-- Migration 0007: Create recognitions table
-- Project: La Gauchita Federal
-- Scope: public.recognitions
-- Note: All comments use ASCII encoding to avoid system-specific character issues.

-- =========================================================================
-- TABLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.recognitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    recognition_type TEXT NOT NULL,
    description TEXT,
    granting_institution_name TEXT,
    granting_institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    recognized_entity_type TEXT NOT NULL,
    recognized_entity_id UUID,
    related_content_id UUID REFERENCES public.contents(id) ON DELETE SET NULL,
    related_institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    recognition_date DATE,
    location TEXT,
    document_reference TEXT,
    source_reference TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    visibility TEXT NOT NULL DEFAULT 'public',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints for domain validation
    CONSTRAINT chk_recognitions_type CHECK (recognition_type IN (
        'award', 'mention', 'declaration', 'endorsement', 'distinction',
        'homage', 'certification', 'press', 'participation', 'other'
    )),
    CONSTRAINT chk_recognitions_entity_type CHECK (recognized_entity_type IN (
        'person', 'magazine', 'institute', 'project', 'book',
        'music_album', 'institution', 'content', 'event', 'other'
    )),
    CONSTRAINT chk_recognitions_status CHECK (status IN (
        'draft', 'review', 'active', 'archived', 'rejected'
    )),
    CONSTRAINT chk_recognitions_visibility CHECK (visibility IN (
        'public', 'institutional', 'private'
    ))
);

-- =========================================================================
-- INDEXES
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_recognitions_recognition_type ON public.recognitions(recognition_type);
CREATE INDEX IF NOT EXISTS idx_recognitions_granting_institution_id ON public.recognitions(granting_institution_id);
CREATE INDEX IF NOT EXISTS idx_recognitions_recognized_entity_type ON public.recognitions(recognized_entity_type);
CREATE INDEX IF NOT EXISTS idx_recognitions_recognized_entity_id ON public.recognitions(recognized_entity_id);
CREATE INDEX IF NOT EXISTS idx_recognitions_related_content_id ON public.recognitions(related_content_id);
CREATE INDEX IF NOT EXISTS idx_recognitions_related_institution_id ON public.recognitions(related_institution_id);
CREATE INDEX IF NOT EXISTS idx_recognitions_recognition_date ON public.recognitions(recognition_date);
CREATE INDEX IF NOT EXISTS idx_recognitions_status ON public.recognitions(status);
CREATE INDEX IF NOT EXISTS idx_recognitions_visibility ON public.recognitions(visibility);
CREATE INDEX IF NOT EXISTS idx_recognitions_is_featured ON public.recognitions(is_featured);
CREATE INDEX IF NOT EXISTS idx_recognitions_sort_order ON public.recognitions(sort_order);
CREATE INDEX IF NOT EXISTS idx_recognitions_created_by_profile_id ON public.recognitions(created_by_profile_id);

-- Compound index for public reading optimization
CREATE INDEX IF NOT EXISTS idx_recognitions_public_read ON public.recognitions(status, visibility, recognition_date);

-- Compound index for featured display optimization
CREATE INDEX IF NOT EXISTS idx_recognitions_featured_show ON public.recognitions(status, visibility, is_featured, sort_order);

-- Compound index for recognized entity lookup optimization
CREATE INDEX IF NOT EXISTS idx_recognitions_recognized_entity ON public.recognitions(recognized_entity_type, recognized_entity_id);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================================================

ALTER TABLE public.recognitions ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- POLICIES
-- =========================================================================

-- Drop existing policies if they exist for idempotency
DROP POLICY IF EXISTS select_public_active_recognitions_anon ON public.recognitions;
DROP POLICY IF EXISTS select_public_active_recognitions_auth ON public.recognitions;
DROP POLICY IF EXISTS select_own_recognitions ON public.recognitions;
DROP POLICY IF EXISTS update_own_draft_recognitions ON public.recognitions;

-- Policy 1: anon can select only public and active recognitions
CREATE POLICY select_public_active_recognitions_anon ON public.recognitions
    FOR SELECT
    TO anon
    USING (
        status = 'active'
        AND visibility = 'public'
    );

-- Policy 2: authenticated can select public and active recognitions
CREATE POLICY select_public_active_recognitions_auth ON public.recognitions
    FOR SELECT
    TO authenticated
    USING (
        status = 'active'
        AND visibility = 'public'
    );

-- Policy 3: authenticated can select their own recognitions
CREATE POLICY select_own_recognitions ON public.recognitions
    FOR SELECT
    TO authenticated
    USING (
        created_by_profile_id IN (
            SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
        )
    );

-- Policy 4: authenticated can update their own recognitions only if the current status is 'draft' or 'rejected'
CREATE POLICY update_own_draft_recognitions ON public.recognitions
    FOR UPDATE
    TO authenticated
    USING (
        created_by_profile_id IN (
            SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        created_by_profile_id IN (
            SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
        )
        AND status IN ('draft', 'rejected')
    );

-- =========================================================================
-- GRANTS
-- =========================================================================

-- Revoke all default privileges from public roles
REVOKE ALL ON public.recognitions FROM anon;
REVOKE ALL ON public.recognitions FROM authenticated;

-- Grant select privilege to visitors and subscribers
GRANT SELECT ON public.recognitions TO anon, authenticated;

-- Grant update only on non-sensitive columns to authenticated users
GRANT UPDATE (
    title,
    description,
    granting_institution_name,
    recognition_date,
    location,
    document_reference,
    source_reference
) ON public.recognitions TO authenticated;
