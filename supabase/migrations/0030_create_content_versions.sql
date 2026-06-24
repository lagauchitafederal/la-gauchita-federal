-- Migration 0030: Create content_versions table and policies
-- Project: La Gauchita Federal
-- Scope: public.content_versions

CREATE TABLE IF NOT EXISTS public.content_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT NULL,
    summary TEXT NULL,
    body TEXT NULL,
    content_type_id UUID NULL REFERENCES public.content_types(id) ON DELETE SET NULL,
    category_id UUID NULL REFERENCES public.categories(id) ON DELETE SET NULL,
    institution_id UUID NULL REFERENCES public.institutions(id) ON DELETE SET NULL,
    author_profile_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    region_id UUID NULL REFERENCES public.regions(id) ON DELETE SET NULL,
    province_id UUID NULL REFERENCES public.provinces(id) ON DELETE SET NULL,
    municipality_id UUID NULL REFERENCES public.municipalities(id) ON DELETE SET NULL,
    event_date DATE NULL,
    publish_date TIMESTAMPTZ NULL,
    status TEXT NOT NULL,
    visibility TEXT NOT NULL,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    source_reference TEXT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    change_summary TEXT NULL,
    created_by_profile_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_content_versions_number CHECK (version_number > 0),
    CONSTRAINT chk_content_versions_status CHECK (status IN ('draft', 'review', 'published', 'archived', 'rejected')),
    CONSTRAINT chk_content_versions_visibility CHECK (visibility IN ('public', 'subscribers', 'institutional', 'private'))
);

-- Compound index for version uniqueness per content
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_versions_unique_number 
ON public.content_versions(content_id, version_number);

-- Indexes for lookup performance
CREATE INDEX IF NOT EXISTS idx_content_versions_content_id ON public.content_versions(content_id);
CREATE INDEX IF NOT EXISTS idx_content_versions_created_at_desc ON public.content_versions(content_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_versions_created_by ON public.content_versions(created_by_profile_id);

-- Enable Row Level Security
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any for safety
DROP POLICY IF EXISTS select_admin_versions ON public.content_versions;
DROP POLICY IF EXISTS insert_admin_versions ON public.content_versions;
DROP POLICY IF EXISTS update_admin_versions ON public.content_versions;
DROP POLICY IF EXISTS delete_admin_versions ON public.content_versions;

-- 1. Administrative SELECT
CREATE POLICY select_admin_versions ON public.content_versions
    FOR SELECT
    TO authenticated
    USING (public.is_admin() OR public.has_role('federal_editor'));

-- 2. Administrative INSERT
CREATE POLICY insert_admin_versions ON public.content_versions
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin() OR public.has_role('federal_editor'));

-- 3. Administrative UPDATE
CREATE POLICY update_admin_versions ON public.content_versions
    FOR UPDATE
    TO authenticated
    USING (public.is_admin() OR public.has_role('federal_editor'))
    WITH CHECK (public.is_admin() OR public.has_role('federal_editor'));

-- 4. Administrative DELETE
CREATE POLICY delete_admin_versions ON public.content_versions
    FOR DELETE
    TO authenticated
    USING (public.is_admin() OR public.has_role('federal_editor'));

-- Grants
REVOKE ALL ON public.content_versions FROM anon;
REVOKE ALL ON public.content_versions FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_versions TO authenticated;
