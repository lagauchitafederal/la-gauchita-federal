-- Migration 0037: Create cultural_publications table and update editorial_relations constraints
-- Project: La Gauchita Federal
-- Scope: public.cultural_publications, public.editorial_relations
-- Note: All comments use ASCII encoding to avoid system-specific character issues.

CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- 1. Create cultural_publications table
CREATE TABLE IF NOT EXISTS public.cultural_publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    short_description TEXT,
    description TEXT,
    publication_type TEXT NOT NULL,
    author_text TEXT,
    publication_year INTEGER,
    publisher_institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    cover_image_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
    source_reference TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    visibility TEXT NOT NULL DEFAULT 'public',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_cultural_publications_type CHECK (publication_type IN (
        'book', 'album', 'special_work'
    )),
    CONSTRAINT chk_cultural_publications_status CHECK (status IN (
        'draft', 'review', 'published', 'archived', 'rejected'
    )),
    CONSTRAINT chk_cultural_publications_visibility CHECK (visibility IN (
        'public', 'subscribers', 'institutional', 'private'
    )),
    CONSTRAINT chk_cultural_publications_year CHECK (publication_year IS NULL OR (publication_year >= 1800 AND publication_year <= EXTRACT(YEAR FROM CURRENT_DATE)))
);

-- 2. Indexes for performance and querying
CREATE INDEX IF NOT EXISTS idx_cultural_publications_slug ON public.cultural_publications(slug);
CREATE INDEX IF NOT EXISTS idx_cultural_publications_lookup ON public.cultural_publications(status, visibility);
CREATE INDEX IF NOT EXISTS idx_cultural_publications_type_status ON public.cultural_publications(publication_type, status);
CREATE INDEX IF NOT EXISTS idx_cultural_publications_inst ON public.cultural_publications(publisher_institution_id);
CREATE INDEX IF NOT EXISTS idx_cultural_publications_featured ON public.cultural_publications(is_featured, sort_order);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.cultural_publications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist for idempotency
DROP POLICY IF EXISTS select_public_published_publications_anon ON public.cultural_publications;
DROP POLICY IF EXISTS select_public_published_publications_auth ON public.cultural_publications;
DROP POLICY IF EXISTS select_admin_publications ON public.cultural_publications;
DROP POLICY IF EXISTS insert_admin_publications ON public.cultural_publications;
DROP POLICY IF EXISTS update_admin_publications ON public.cultural_publications;

-- Policy 1: Public SELECT for anon (only published and public)
CREATE POLICY select_public_published_publications_anon ON public.cultural_publications
    FOR SELECT
    TO anon
    USING (status = 'published' AND visibility = 'public');

-- Policy 2: Public SELECT for authenticated (only published and public)
CREATE POLICY select_public_published_publications_auth ON public.cultural_publications
    FOR SELECT
    TO authenticated
    USING (status = 'published' AND visibility = 'public');

-- Policy 3: Administrative SELECT (any status/visibility for admins/editors)
CREATE POLICY select_admin_publications ON public.cultural_publications
    FOR SELECT
    TO authenticated
    USING (public.is_admin() OR public.has_role('federal_editor'));

-- Policy 4: Administrative INSERT
CREATE POLICY insert_admin_publications ON public.cultural_publications
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin() OR public.has_role('federal_editor'));

-- Policy 5: Administrative UPDATE
CREATE POLICY update_admin_publications ON public.cultural_publications
    FOR UPDATE
    TO authenticated
    USING (public.is_admin() OR public.has_role('federal_editor'))
    WITH CHECK (public.is_admin() OR public.has_role('federal_editor'));

-- Grants
REVOKE ALL ON public.cultural_publications FROM anon;
REVOKE ALL ON public.cultural_publications FROM authenticated;

GRANT SELECT ON public.cultural_publications TO anon, authenticated;
GRANT INSERT, UPDATE ON public.cultural_publications TO authenticated;

-- =========================================================================
-- 4. Update editorial_relations table constraints to support cultural publications
-- =========================================================================
ALTER TABLE public.editorial_relations
    DROP CONSTRAINT IF EXISTS chk_editorial_relations_source_type,
    DROP CONSTRAINT IF EXISTS chk_editorial_relations_target_type;

ALTER TABLE public.editorial_relations
    ADD CONSTRAINT chk_editorial_relations_source_type CHECK (source_entity_type IN (
        'content', 'person', 'institution', 'recognition', 'media_asset', 'magazine_edition', 'cultural_publication'
    )),
    ADD CONSTRAINT chk_editorial_relations_target_type CHECK (target_entity_type IN (
        'content', 'person', 'institution', 'recognition', 'media_asset', 'magazine_edition', 'cultural_publication'
    ));

-- =========================================================================
-- 5. Trigger to automatically update updated_at
-- =========================================================================
CREATE TRIGGER handle_cultural_publications_updated_at
    BEFORE UPDATE ON public.cultural_publications
    FOR EACH ROW
    EXECUTE PROCEDURE extensions.moddatetime(updated_at);
