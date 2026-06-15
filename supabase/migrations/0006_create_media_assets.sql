-- Migration 0006: Create media_assets table
-- Project: La Gauchita Federal
-- Scope: public.media_assets
-- Note: All comments use ASCII encoding to avoid system-specific character issues.

-- 1. Create media_assets table
CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES public.contents(id) ON DELETE SET NULL,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    uploaded_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    asset_type TEXT NOT NULL,
    bucket_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT,
    file_size_bytes BIGINT,
    original_filename TEXT,
    alt_text TEXT,
    credit TEXT,
    source_reference TEXT,
    rights_status TEXT NOT NULL DEFAULT 'pending_review',
    visibility TEXT NOT NULL DEFAULT 'private',
    status TEXT NOT NULL DEFAULT 'draft',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_media_assets_type CHECK (asset_type IN (
        'cover_image', 'content_image', 'gallery_image', 'historical_photo', 
        'pdf_document', 'magazine_pdf', 'book_pdf', 'audio', 
        'teacher_resource', 'institutional_document', 'recognition_document', 
        'archive_material', 'other'
    )),
    CONSTRAINT chk_media_assets_rights CHECK (rights_status IN (
        'owned', 'authorized', 'public_domain', 'licensed', 
        'pending_review', 'restricted', 'unknown'
    )),
    CONSTRAINT chk_media_assets_visibility CHECK (visibility IN (
        'public', 'subscribers', 'institutional', 'private'
    )),
    CONSTRAINT chk_media_assets_status CHECK (status IN (
        'draft', 'review', 'active', 'archived', 'rejected'
    )),
    CONSTRAINT chk_media_assets_size CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0)
);

-- 2. Unique index to prevent duplicate storage objects
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_assets_unique_storage 
ON public.media_assets (bucket_name, storage_path);

-- 3. Create Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_media_assets_content_id ON public.media_assets(content_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_institution_id ON public.media_assets(institution_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_uploaded_by_profile_id ON public.media_assets(uploaded_by_profile_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_asset_type ON public.media_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_rights_status ON public.media_assets(rights_status);
CREATE INDEX IF NOT EXISTS idx_media_assets_visibility ON public.media_assets(visibility);
CREATE INDEX IF NOT EXISTS idx_media_assets_status ON public.media_assets(status);
CREATE INDEX IF NOT EXISTS idx_media_assets_sort_order ON public.media_assets(sort_order);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON public.media_assets(created_at);

-- Compound index for public reading
CREATE INDEX IF NOT EXISTS idx_media_assets_public_read ON public.media_assets(status, visibility, asset_type);

-- Compound index for content sort order
CREATE INDEX IF NOT EXISTS idx_media_assets_content_sort ON public.media_assets(content_id, sort_order);

-- Compound index for institution sort order
CREATE INDEX IF NOT EXISTS idx_media_assets_institution_sort ON public.media_assets(institution_id, sort_order);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies

-- Drop existing policies to ensure idempotency
DROP POLICY IF EXISTS select_public_active_assets_anon ON public.media_assets;
DROP POLICY IF EXISTS select_public_active_assets_auth ON public.media_assets;
DROP POLICY IF EXISTS select_own_assets ON public.media_assets;
DROP POLICY IF EXISTS update_own_draft_assets ON public.media_assets;

-- Policies for public reading (anon)
CREATE POLICY select_public_active_assets_anon ON public.media_assets
    FOR SELECT
    TO anon
    USING (
        status = 'active'
        AND visibility = 'public'
        AND rights_status IN ('owned', 'authorized', 'public_domain', 'licensed')
        AND (
            content_id IS NULL
            OR content_id IN (
                SELECT id FROM public.contents
                WHERE status = 'published'
                AND visibility = 'public'
                AND publish_date IS NOT NULL
                AND publish_date <= now()
            )
        )
    );

-- Policies for public reading (authenticated)
CREATE POLICY select_public_active_assets_auth ON public.media_assets
    FOR SELECT
    TO authenticated
    USING (
        status = 'active'
        AND visibility = 'public'
        AND rights_status IN ('owned', 'authorized', 'public_domain', 'licensed')
        AND (
            content_id IS NULL
            OR content_id IN (
                SELECT id FROM public.contents
                WHERE status = 'published'
                AND visibility = 'public'
                AND publish_date IS NOT NULL
                AND publish_date <= now()
            )
        )
    );

-- Policies for authors to read their own media assets
CREATE POLICY select_own_assets ON public.media_assets
    FOR SELECT
    TO authenticated
    USING (uploaded_by_profile_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    ));

-- Policies for authors to update their own assets only if they are drafts or rejected
CREATE POLICY update_own_draft_assets ON public.media_assets
    FOR UPDATE
    TO authenticated
    USING (uploaded_by_profile_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    ))
    WITH CHECK (
        uploaded_by_profile_id IN (
            SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
        )
        AND status IN ('draft', 'rejected')
    );

-- 6. Grant Privileges
-- Revoke all default privileges from public roles
REVOKE ALL ON public.media_assets FROM anon;
REVOKE ALL ON public.media_assets FROM authenticated;

-- Grant selective privileges
GRANT SELECT ON public.media_assets TO anon, authenticated;

-- Grant update only on non-sensitive metadata columns to authenticated users
GRANT UPDATE (
    title, description, alt_text, credit, source_reference
) ON public.media_assets TO authenticated;
