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
