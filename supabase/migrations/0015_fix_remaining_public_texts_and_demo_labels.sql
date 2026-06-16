-- Migration 0015: Fix remaining public texts and demo labels
-- Project: La Gauchita Federal
-- Scope: public.institutions, public.contents, public.recognitions, public.media_assets
-- Note: ASCII-safe SQL using PostgreSQL Unicode escape strings.

-- 1. Update Institution Demo
UPDATE public.institutions
SET description = U&'Instituci\00F3n demo de desarrollo para validaci\00F3n visual de portadas.',
    updated_at = now()
WHERE slug = 'centro-cultural-demo-federal';

-- 2. Update Content Demo
UPDATE public.contents
SET title = U&'Efem\00E9ride cultural demo',
    summary = U&'Resumen de muestra de la efem\00E9ride cultural demo para validar listados.',
    body = U&'Cuerpo de prueba de la efem\00E9ride cultural demo.',
    updated_at = now()
WHERE slug = 'efemeride-cultural-demo';

-- 3. Update Recognition Demo
UPDATE public.recognitions
SET description = U&'Menci\00F3n honor\00EDfica demo para pruebas de integraci\00F3n de datos.',
    granting_institution_name = U&'Instituci\00F3n Otorgante Demo',
    document_reference = U&'Resoluci\00F3n Demo 123/2026',
    updated_at = now()
WHERE slug = 'reconocimiento-demo-trayectoria-cultural';

-- 4. Update Media Asset Demo
UPDATE public.media_assets
SET description = U&'Asset multimedia demo de desarrollo. No posee archivo f\00EDsico cargado en Storage.',
    updated_at = now()
WHERE bucket_name = 'public-media' AND storage_path = 'demo/home/imagen-demo-archivo-cultural.jpg';
