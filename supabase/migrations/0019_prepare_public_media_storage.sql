-- Migration 0019: Prepare public media storage bucket and policies
-- Project: La Gauchita Federal
-- Scope: storage.buckets, storage.objects
-- Note: All comments use ASCII encoding to avoid system-specific character issues.

-- 1. Create or update public-media bucket in storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'public-media',
    'public-media',
    true,
    10485760, -- 10 MB limit
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/pdf',
        'audio/mpeg',
        'audio/wav',
        'audio/ogg'
    ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Drop existing select policies for public-media bucket if they exist for idempotency
DROP POLICY IF EXISTS storage_public_media_select_anon ON storage.objects;
DROP POLICY IF EXISTS storage_public_media_select_auth ON storage.objects;

-- 3. Create SELECT policies for anon and authenticated users to access public-media bucket objects
CREATE POLICY storage_public_media_select_anon ON storage.objects
    FOR SELECT
    TO anon
    USING (bucket_id = 'public-media');

CREATE POLICY storage_public_media_select_auth ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'public-media');
