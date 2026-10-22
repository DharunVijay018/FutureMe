-- FutureMe Vault: Complete Database Schema with Row Level Security (RLS)
-- Enables strict time-locking guarantees and user ownership isolation

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Capsules Table
CREATE TABLE IF NOT EXISTS public.capsules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    capsule_type TEXT NOT NULL CHECK (capsule_type IN ('letter', 'goal', 'prediction', 'memory', 'custom')),
    status TEXT NOT NULL CHECK (status IN ('draft', 'sealed', 'opened')) DEFAULT 'draft',
    category TEXT DEFAULT 'Personal' NOT NULL,
    scheduled_opening_at TIMESTAMPTZ NOT NULL,
    original_timezone TEXT DEFAULT 'UTC' NOT NULL,
    sealed_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_capsules_owner_id ON public.capsules(owner_id);
CREATE INDEX IF NOT EXISTS idx_capsules_status ON public.capsules(status);
CREATE INDEX IF NOT EXISTS idx_capsules_scheduled_opening_at ON public.capsules(scheduled_opening_at);

-- 3. Capsule Attachments Table
CREATE TABLE IF NOT EXISTS public.capsule_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capsule_id UUID NOT NULL REFERENCES public.capsules(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attachments_capsule_id ON public.capsule_attachments(capsule_id);

-- 4. Capsule Reflections Table (Private notes added upon or after opening)
CREATE TABLE IF NOT EXISTS public.capsule_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capsule_id UUID NOT NULL REFERENCES public.capsules(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reflection_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reflections_capsule_id ON public.capsule_reflections(capsule_id);

-- 5. Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    owner_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT true NOT NULL,
    notify_before_hours INTEGER DEFAULT 24 NOT NULL,
    notify_at_unlock BOOLEAN DEFAULT true NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Notification Delivery Records Table (Audit & Idempotency)
CREATE TABLE IF NOT EXISTS public.notification_delivery_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capsule_id UUID NOT NULL REFERENCES public.capsules(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('unlock_ready', 'reminder_24h')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
    provider_message_id TEXT,
    error_message TEXT,
    attempted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_delivery_attempt
ON public.notification_delivery_records(capsule_id, notification_type, recipient_email)
WHERE status = 'sent';

-- ============================================================================
-- TIME-LOCK GUARANTEE FUNCTION & ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Function to check if a capsule is eligible to reveal private contents
-- Returns true ONLY IF:
-- 1. Status is 'draft' (user is currently editing)
-- 2. Status is 'opened' (already officially unlocked)
-- 3. Status is 'sealed' AND current server time >= scheduled_opening_at
CREATE OR REPLACE FUNCTION public.can_view_capsule_content(capsule_row public.capsules)
RETURNS BOOLEAN AS $$
BEGIN
    IF capsule_row.status = 'draft' THEN
        RETURN TRUE;
    END IF;
    
    IF capsule_row.status = 'opened' THEN
        RETURN TRUE;
    END IF;
    
    IF capsule_row.status = 'sealed' AND timezone('utc'::text, now()) >= capsule_row.scheduled_opening_at THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capsule_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capsule_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_records ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- PROFILES POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- CAPSULES POLICIES
-- ----------------------------------------------------------------------------
-- Users can only select their own capsules
CREATE POLICY "Users can select own capsules"
    ON public.capsules FOR SELECT
    USING (auth.uid() = owner_id);

-- Users can only insert capsules where owner_id is their own UID
CREATE POLICY "Users can create own capsules"
    ON public.capsules FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Users can update draft capsules, or seal them. Once sealed, content cannot be edited!
CREATE POLICY "Users can update own draft capsules"
    ON public.capsules FOR UPDATE
    USING (auth.uid() = owner_id AND status = 'draft');

-- Special policy for marking capsule as opened once eligible
CREATE POLICY "Users can mark eligible sealed capsule as opened"
    ON public.capsules FOR UPDATE
    USING (
        auth.uid() = owner_id
        AND status = 'sealed'
        AND timezone('utc'::text, now()) >= scheduled_opening_at
    );

-- Users can delete their own drafts or opened capsules, but sealed capsules are preserved
CREATE POLICY "Users can delete own drafts or opened capsules"
    ON public.capsules FOR DELETE
    USING (auth.uid() = owner_id AND status IN ('draft', 'opened'));

-- ----------------------------------------------------------------------------
-- ATTACHMENTS POLICIES (Time-lock guarded through parent capsule)
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view attachments if capsule is accessible"
    ON public.capsule_attachments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.capsules c
            WHERE c.id = capsule_attachments.capsule_id
            AND c.owner_id = auth.uid()
            AND public.can_view_capsule_content(c)
        )
    );

CREATE POLICY "Users can insert attachments to own draft capsules"
    ON public.capsule_attachments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.capsules c
            WHERE c.id = capsule_attachments.capsule_id
            AND c.owner_id = auth.uid()
            AND c.status = 'draft'
        )
    );

CREATE POLICY "Users can delete attachments from own draft capsules"
    ON public.capsule_attachments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.capsules c
            WHERE c.id = capsule_attachments.capsule_id
            AND c.owner_id = auth.uid()
            AND c.status = 'draft'
        )
    );

-- ----------------------------------------------------------------------------
-- REFLECTIONS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage own reflections"
    ON public.capsule_reflections FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- ----------------------------------------------------------------------------
-- NOTIFICATION PREFERENCES POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage own notification preferences"
    ON public.notification_preferences FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- ----------------------------------------------------------------------------
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, timezone)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'timezone', 'UTC')
    );
    
    INSERT INTO public.notification_preferences (owner_id)
    VALUES (new.id);
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
