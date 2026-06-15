-- Migration 0005: Create contents table
-- Project: La Gauchita Federal
-- Scope: public.contents
-- Note: All comments use ASCII encoding to avoid system-specific character issues.

-- 1. Create contents table
CREATE TABLE IF NOT EXISTS public.contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    subtitle TEXT,
    summary TEXT,
    body TEXT,
    content_type_id UUID NOT NULL REFERENCES public.content_types(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    author_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
    province_id UUID REFERENCES public.provinces(id) ON DELETE SET NULL,
    municipality_id UUID REFERENCES public.municipalities(id) ON DELETE SET NULL,
    event_date DATE,
    publish_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'draft',
    visibility TEXT NOT NULL DEFAULT 'public',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    source_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_contents_status CHECK (status IN ('draft', 'review', 'published', 'archived', 'rejected')),
    CONSTRAINT chk_contents_visibility CHECK (visibility IN ('public', 'subscribers', 'institutional', 'private'))
);

-- 2. Create Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_contents_content_type_id ON public.contents(content_type_id);
CREATE INDEX IF NOT EXISTS idx_contents_category_id ON public.contents(category_id);
CREATE INDEX IF NOT EXISTS idx_contents_institution_id ON public.contents(institution_id);
CREATE INDEX IF NOT EXISTS idx_contents_author_profile_id ON public.contents(author_profile_id);
CREATE INDEX IF NOT EXISTS idx_contents_region_id ON public.contents(region_id);
CREATE INDEX IF NOT EXISTS idx_contents_province_id ON public.contents(province_id);
CREATE INDEX IF NOT EXISTS idx_contents_municipality_id ON public.contents(municipality_id);
CREATE INDEX IF NOT EXISTS idx_contents_event_date ON public.contents(event_date);
CREATE INDEX IF NOT EXISTS idx_contents_publish_date ON public.contents(publish_date);
CREATE INDEX IF NOT EXISTS idx_contents_status ON public.contents(status);
CREATE INDEX IF NOT EXISTS idx_contents_visibility ON public.contents(visibility);
CREATE INDEX IF NOT EXISTS idx_contents_is_featured ON public.contents(is_featured);

-- Compound index for public/anonymous content read
CREATE INDEX IF NOT EXISTS idx_contents_public_read ON public.contents(status, visibility, publish_date);

-- Compound index for localized queries
CREATE INDEX IF NOT EXISTS idx_contents_territory ON public.contents(province_id, municipality_id);

-- Compound index for agenda, calendar and ephemerides queries
CREATE INDEX IF NOT EXISTS idx_contents_agenda_ephemerides ON public.contents(event_date, content_type_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

-- 4. Define RLS Policies

-- Drop existing policies to ensure idempotency
DROP POLICY IF EXISTS select_public_published_contents_anon ON public.contents;
DROP POLICY IF EXISTS select_public_published_contents_auth ON public.contents;
DROP POLICY IF EXISTS select_own_contents ON public.contents;
DROP POLICY IF EXISTS update_own_draft_contents ON public.contents;

-- Policies for public reading (anon)
CREATE POLICY select_public_published_contents_anon ON public.contents
    FOR SELECT
    TO anon
    USING (
        status = 'published' 
        AND visibility = 'public' 
        AND publish_date IS NOT NULL 
        AND publish_date <= now()
    );

-- Policies for public reading (authenticated)
CREATE POLICY select_public_published_contents_auth ON public.contents
    FOR SELECT
    TO authenticated
    USING (
        status = 'published' 
        AND visibility = 'public' 
        AND publish_date IS NOT NULL 
        AND publish_date <= now()
    );

-- Policies for authors to read their own drafts and historical contents
CREATE POLICY select_own_contents ON public.contents
    FOR SELECT
    TO authenticated
    USING (author_profile_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    ));

-- Policies for authors to update their own contents only if they are drafts or rejected
CREATE POLICY update_own_draft_contents ON public.contents
    FOR UPDATE
    TO authenticated
    USING (author_profile_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    ))
    WITH CHECK (
        author_profile_id IN (
            SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
        )
        AND status IN ('draft', 'rejected')
    );

-- 5. Grant Privileges
-- Revoke all default privileges from public roles
REVOKE ALL ON public.contents FROM anon;
REVOKE ALL ON public.contents FROM authenticated;

-- Grant selective privileges
GRANT SELECT ON public.contents TO anon, authenticated;

-- Grant update only on non-sensitive metadata columns to authenticated users
GRANT UPDATE (
    title, subtitle, summary, body, category_id, region_id, 
    province_id, municipality_id, event_date, source_reference
) ON public.contents TO authenticated;
