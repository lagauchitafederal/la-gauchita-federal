-- Migration 0027: Create people table and policies
-- Project: La Gauchita Federal
-- Scope: public.people

CREATE TABLE IF NOT EXISTS public.people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    short_bio TEXT,
    biography TEXT,
    person_type TEXT NOT NULL,
    birth_date DATE,
    death_date DATE,
    region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
    province_id UUID REFERENCES public.provinces(id) ON DELETE SET NULL,
    municipality_id UUID REFERENCES public.municipalities(id) ON DELETE SET NULL,
    main_image_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
    source_reference TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    visibility TEXT NOT NULL DEFAULT 'public',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_people_person_type CHECK (person_type IN (
        'historical_figure', 'writer', 'poet', 'historian', 'musician',
        'singer', 'artist', 'artisan', 'educator', 'researcher',
        'public_figure', 'cultural_referent', 'other'
    )),
    CONSTRAINT chk_people_status CHECK (status IN (
        'draft', 'review', 'published', 'archived', 'rejected'
    )),
    CONSTRAINT chk_people_visibility CHECK (visibility IN (
        'public', 'subscribers', 'institutional', 'private'
    )),
    CONSTRAINT chk_people_dates CHECK (
        death_date IS NULL OR birth_date IS NULL OR death_date >= birth_date
    )
);

-- Indexes for performance and querying
CREATE INDEX IF NOT EXISTS idx_people_slug ON public.people(slug);
CREATE INDEX IF NOT EXISTS idx_people_person_type ON public.people(person_type);
CREATE INDEX IF NOT EXISTS idx_people_region_id ON public.people(region_id);
CREATE INDEX IF NOT EXISTS idx_people_province_id ON public.people(province_id);
CREATE INDEX IF NOT EXISTS idx_people_municipality_id ON public.people(municipality_id);
CREATE INDEX IF NOT EXISTS idx_people_status ON public.people(status);
CREATE INDEX IF NOT EXISTS idx_people_visibility ON public.people(visibility);
CREATE INDEX IF NOT EXISTS idx_people_is_featured ON public.people(is_featured);
CREATE INDEX IF NOT EXISTS idx_people_birth_date ON public.people(birth_date);
CREATE INDEX IF NOT EXISTS idx_people_death_date ON public.people(death_date);

-- Enable RLS
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for idempotency
DROP POLICY IF EXISTS select_public_published_people_anon ON public.people;
DROP POLICY IF EXISTS select_public_published_people_auth ON public.people;
DROP POLICY IF EXISTS select_admin_people ON public.people;
DROP POLICY IF EXISTS insert_admin_people ON public.people;
DROP POLICY IF EXISTS update_admin_people ON public.people;
DROP POLICY IF EXISTS delete_admin_people ON public.people;

-- 1. Public SELECT for anon
CREATE POLICY select_public_published_people_anon ON public.people
    FOR SELECT
    TO anon
    USING (status = 'published' AND visibility = 'public');

-- 2. Public SELECT for authenticated
CREATE POLICY select_public_published_people_auth ON public.people
    FOR SELECT
    TO authenticated
    USING (status = 'published' AND visibility = 'public');

-- 3. Administrative SELECT (any status/visibility for admins/editors)
CREATE POLICY select_admin_people ON public.people
    FOR SELECT
    TO authenticated
    USING (public.is_admin() OR public.has_role('federal_editor'));

-- 4. Administrative INSERT
CREATE POLICY insert_admin_people ON public.people
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin() OR public.has_role('federal_editor'));

-- 5. Administrative UPDATE
CREATE POLICY update_admin_people ON public.people
    FOR UPDATE
    TO authenticated
    USING (public.is_admin() OR public.has_role('federal_editor'))
    WITH CHECK (public.is_admin() OR public.has_role('federal_editor'));

-- 6. Administrative DELETE
CREATE POLICY delete_admin_people ON public.people
    FOR DELETE
    TO authenticated
    USING (public.is_admin() OR public.has_role('federal_editor'));

-- Grants
REVOKE ALL ON public.people FROM anon;
REVOKE ALL ON public.people FROM authenticated;

GRANT SELECT ON public.people TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.people TO authenticated;
