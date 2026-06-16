-- Migration 0017: Hide demo public data
-- Project: La Gauchita Federal
-- Scope: public.institutions, public.contents, public.recognitions, public.media_assets
-- Note: All comments use ASCII encoding to avoid system-specific character issues.

-- 1. Hide Institution demo
UPDATE public.institutions
SET status = 'archived',
    updated_at = now()
WHERE slug = 'centro-cultural-demo-federal';

-- 2. Hide Content demo
UPDATE public.contents
SET status = 'archived',
    visibility = 'private',
    updated_at = now()
WHERE slug = 'efemeride-cultural-demo';

-- 3. Hide Recognition demo
UPDATE public.recognitions
SET status = 'archived',
    visibility = 'private',
    updated_at = now()
WHERE slug = 'reconocimiento-demo-trayectoria-cultural';

-- 4. Hide Media asset demo
UPDATE public.media_assets
SET status = 'archived',
    visibility = 'private',
    updated_at = now()
WHERE bucket_name = 'public-media'
  AND storage_path = 'demo/home/imagen-demo-archivo-cultural.jpg';
