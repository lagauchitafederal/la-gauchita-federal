-- Migration 0029: Create magazine_editions table and update editorial_relations constraints
-- Project: La Gauchita Federal
-- Scope: public.magazine_editions, public.editorial_relations
-- Note: All comments use ASCII encoding to avoid system-specific character issues.

-- 1. Create magazine_editions table
CREATE TABLE IF NOT EXISTS public.magazine_editions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    edition_number INTEGER NOT NULL,
    volume TEXT, -- Tomo/Volumen
    publication_year INTEGER NOT NULL,
    publication_date DATE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    table_of_contents JSONB NOT NULL DEFAULT '[]'::jsonb, -- Indice de paginas y articulos
    publisher_institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE RESTRICT,
    cover_image_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
    pdf_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    visibility TEXT NOT NULL DEFAULT 'public',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_magazine_editions_status CHECK (status IN (
        'draft', 'review', 'published', 'archived'
    )),
    CONSTRAINT chk_magazine_editions_visibility CHECK (visibility IN (
        'public', 'subscribers', 'institutional', 'private'
    )),
    CONSTRAINT chk_magazine_editions_number CHECK (edition_number > 0),
    CONSTRAINT chk_magazine_editions_year CHECK (publication_year BETWEEN 1900 AND 2100)
);

-- 2. Indexes for performance and querying
-- Unique index to prevent duplicate edition numbers for the same institution (editora)
CREATE UNIQUE INDEX IF NOT EXISTS idx_magazine_editions_number_uniq 
ON public.magazine_editions(publisher_institution_id, edition_number);

CREATE INDEX IF NOT EXISTS idx_magazine_editions_slug ON public.magazine_editions(slug);
CREATE INDEX IF NOT EXISTS idx_magazine_editions_lookup ON public.magazine_editions(status, visibility);
CREATE INDEX IF NOT EXISTS idx_magazine_editions_year ON public.magazine_editions(publication_year);
CREATE INDEX IF NOT EXISTS idx_magazine_editions_date ON public.magazine_editions(publication_date DESC);
CREATE INDEX IF NOT EXISTS idx_magazine_editions_featured ON public.magazine_editions(is_featured);
CREATE INDEX IF NOT EXISTS idx_magazine_editions_sort ON public.magazine_editions(sort_order);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.magazine_editions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist for idempotency
DROP POLICY IF EXISTS select_public_published_editions_anon ON public.magazine_editions;
DROP POLICY IF EXISTS select_public_published_editions_auth ON public.magazine_editions;
DROP POLICY IF EXISTS select_admin_editions ON public.magazine_editions;
DROP POLICY IF EXISTS insert_admin_editions ON public.magazine_editions;
DROP POLICY IF EXISTS update_admin_editions ON public.magazine_editions;
DROP POLICY IF EXISTS delete_admin_editions ON public.magazine_editions;

-- Policy 1: Public SELECT for anon (only published and public)
CREATE POLICY select_public_published_editions_anon ON public.magazine_editions
    FOR SELECT
    TO anon
    USING (status = 'published' AND visibility = 'public');

-- Policy 2: Public SELECT for authenticated (only published and public)
CREATE POLICY select_public_published_editions_auth ON public.magazine_editions
    FOR SELECT
    TO authenticated
    USING (status = 'published' AND visibility = 'public');

-- Policy 3: Administrative SELECT (any status/visibility for admins/editors)
CREATE POLICY select_admin_editions ON public.magazine_editions
    FOR SELECT
    TO authenticated
    USING (public.is_admin() OR public.has_role('federal_editor'));

-- Policy 4: Administrative INSERT
CREATE POLICY insert_admin_editions ON public.magazine_editions
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin() OR public.has_role('federal_editor'));

-- Policy 5: Administrative UPDATE
CREATE POLICY update_admin_editions ON public.magazine_editions
    FOR UPDATE
    TO authenticated
    USING (public.is_admin() OR public.has_role('federal_editor'))
    WITH CHECK (public.is_admin() OR public.has_role('federal_editor'));

-- Policy 6: Administrative DELETE
CREATE POLICY delete_admin_editions ON public.magazine_editions
    FOR DELETE
    TO authenticated
    USING (public.is_admin() OR public.has_role('federal_editor'));

-- Grants
REVOKE ALL ON public.magazine_editions FROM anon;
REVOKE ALL ON public.magazine_editions FROM authenticated;

GRANT SELECT ON public.magazine_editions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.magazine_editions TO authenticated;


-- =========================================================================
-- 4. Update editorial_relations table constraints
-- =========================================================================
-- magazine_edition allows linking editions with contents, people, institutions, recognitions and assets.
-- The links will use editorial relations in a later phase; no automatic relations are seeded in this migration.

ALTER TABLE public.editorial_relations
    DROP CONSTRAINT IF EXISTS chk_editorial_relations_source_type,
    DROP CONSTRAINT IF EXISTS chk_editorial_relations_target_type;

ALTER TABLE public.editorial_relations
    ADD CONSTRAINT chk_editorial_relations_source_type CHECK (source_entity_type IN (
        'content', 'person', 'institution', 'recognition', 'media_asset', 'magazine_edition'
    )),
    ADD CONSTRAINT chk_editorial_relations_target_type CHECK (target_entity_type IN (
        'content', 'person', 'institution', 'recognition', 'media_asset', 'magazine_edition'
    ));
