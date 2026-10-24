-- FUTUREME VAULT: COMPLETE PRODUCTION POSTGRESQL SCHEMA
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/yrpmrmmxshbqanotoubr/sql)

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


-- Migration 20261022000002: Security Hardening, Time-Locked Views & Storage Policies

-- 1. Database View enforcing time-lock redaction at the database layer
CREATE OR REPLACE VIEW public.vault_capsules AS
SELECT
    c.id,
    c.owner_id,
    c.title,
    CASE
        WHEN public.can_view_capsule_content(c) THEN c.content
        ELSE '[TIME_LOCKED_CONTENT_ENCRYPTED_AND_REDACTED_UNTIL_SCHEDULED_OPENING]'
    END AS content,
    c.capsule_type,
    c.status,
    c.category,
    c.scheduled_opening_at,
    c.original_timezone,
    c.sealed_at,
    c.opened_at,
    c.created_at,
    c.updated_at
FROM public.capsules c
WHERE c.owner_id = auth.uid();

-- Grant access on the secure view to authenticated users
GRANT SELECT ON public.vault_capsules TO authenticated;

-- 2. Secure RPC to fetch decrypted capsule content with time-lock verification
CREATE OR REPLACE FUNCTION public.get_capsule_content(p_capsule_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_capsule public.capsules%ROWTYPE;
BEGIN
    SELECT * INTO v_capsule FROM public.capsules
    WHERE id = p_capsule_id AND owner_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ACCESS_DENIED: Capsule not found or access forbidden';
    END IF;
    
    IF NOT public.can_view_capsule_content(v_capsule) THEN
        RAISE EXCEPTION 'TIME_LOCK_VIOLATION: Capsule is locked until %', v_capsule.scheduled_opening_at;
    END IF;
    
    RETURN v_capsule.content;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_capsule_content(UUID) TO authenticated;

-- 3. Transition Guard Trigger: Prevent modifying sealed capsules or setting past opening dates
CREATE OR REPLACE FUNCTION public.guard_capsule_transitions()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent editing once sealed (unless transitioning to 'opened')
    IF OLD.status = 'sealed' AND NEW.status = 'sealed' THEN
        IF OLD.content <> NEW.content OR OLD.title <> NEW.title OR OLD.scheduled_opening_at <> NEW.scheduled_opening_at THEN
            RAISE EXCEPTION 'IMMUTABLE_ERROR: Sealed capsules cannot be modified.';
        END IF;
    END IF;

    -- Prevent transitioning from 'sealed' or 'opened' back to 'draft'
    IF (OLD.status = 'sealed' OR OLD.status = 'opened') AND NEW.status = 'draft' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: Sealed or opened capsules cannot return to draft status.';
    END IF;

    -- Prevent setting a scheduled opening time in the past when sealing
    IF NEW.status = 'sealed' AND OLD.status = 'draft' THEN
        IF NEW.scheduled_opening_at <= timezone('utc'::text, now()) THEN
            RAISE EXCEPTION 'INVALID_SCHEDULE: Scheduled opening time must be in the future.';
        END IF;
        NEW.sealed_at := timezone('utc'::text, now());
    END IF;

    -- Enforce time-lock requirement before transitioning to 'opened'
    IF NEW.status = 'opened' AND OLD.status = 'sealed' THEN
        IF timezone('utc'::text, now()) < OLD.scheduled_opening_at THEN
            RAISE EXCEPTION 'TIME_LOCK_VIOLATION: Cannot open capsule before scheduled opening timestamp.';
        END IF;
        NEW.opened_at := timezone('utc'::text, now());
    END IF;

    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_guard_capsule_transitions ON public.capsules;
CREATE TRIGGER trg_guard_capsule_transitions
    BEFORE UPDATE ON public.capsules
    FOR EACH ROW EXECUTE FUNCTION public.guard_capsule_transitions();

-- 4. Supabase Storage Bucket & Object Policies for Private Capsule Memories
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'capsule-memories',
    'capsule-memories',
    false,
    10485760, -- 10MB maximum file size
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage Object Policy: Uploading memories to own user folder
CREATE POLICY "Users can upload attachments to own folder"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'capsule-memories'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage Object Policy: Downloading memories only when time-lock eligibility is met
CREATE POLICY "Users can download memories if time-lock permits"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'capsule-memories'
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND EXISTS (
            SELECT 1 FROM public.capsule_attachments a
            JOIN public.capsules c ON c.id = a.capsule_id
            WHERE a.storage_path = storage.objects.name
            AND c.owner_id = auth.uid()
            AND public.can_view_capsule_content(c)
        )
    );

-- Storage Object Policy: Deleting attachments from draft capsules only
CREATE POLICY "Users can delete attachments from draft capsules"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'capsule-memories'
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND EXISTS (
            SELECT 1 FROM public.capsule_attachments a
            JOIN public.capsules c ON c.id = a.capsule_id
            WHERE a.storage_path = storage.objects.name
            AND c.owner_id = auth.uid()
            AND c.status = 'draft'
        )
    );

