-- Migration 0020: Seed real media assets
-- Project: La Gauchita Federal
-- Scope: public.media_assets
-- Note: All comments use ASCII encoding to avoid system-specific character issues.

-- =========================================================================
-- 1. Seed Real Media Assets
-- =========================================================================

-- Imagen 1: Jornada de estudios guemesianos (Content relation)
INSERT INTO public.media_assets (
    content_id,
    institution_id,
    uploaded_by_profile_id,
    title,
    description,
    asset_type,
    bucket_name,
    storage_path,
    mime_type,
    file_size_bytes,
    original_filename,
    alt_text,
    credit,
    source_reference,
    rights_status,
    visibility,
    status,
    sort_order
)
VALUES (
    (SELECT id FROM public.contents WHERE slug = 'la-nutrida-labor-historica-juan-manuel-de-los-rios'),
    NULL,
    NULL,
    U&'Jornada de estudios g\00FCemesianos',
    U&'Imagen de archivo asociada a contenidos hist\00F3ricos publicados por Revista La Gauchita.',
    'content_image',
    'public-media',
    'contenidos/2026/jornadadeestudiosguemes.jpg',
    'image/jpeg',
    NULL,
    'jornadadeestudiosguemes.jpg',
    U&'Jornada de estudios g\00FCemesianos vinculada a la historia salte\00F1a',
    'Revista La Gauchita',
    'Revista La Gauchita',
    'authorized',
    'public',
    'active',
    10
)
ON CONFLICT (bucket_name, storage_path) DO UPDATE SET
    content_id = EXCLUDED.content_id,
    institution_id = EXCLUDED.institution_id,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    asset_type = EXCLUDED.asset_type,
    mime_type = EXCLUDED.mime_type,
    original_filename = EXCLUDED.original_filename,
    alt_text = EXCLUDED.alt_text,
    credit = EXCLUDED.credit,
    source_reference = EXCLUDED.source_reference,
    rights_status = EXCLUDED.rights_status,
    visibility = EXCLUDED.visibility,
    status = EXCLUDED.status,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

-- Imagen 2: Portada Revista La Gauchita 274 (Institution relation)
INSERT INTO public.media_assets (
    content_id,
    institution_id,
    uploaded_by_profile_id,
    title,
    description,
    asset_type,
    bucket_name,
    storage_path,
    mime_type,
    file_size_bytes,
    original_filename,
    alt_text,
    credit,
    source_reference,
    rights_status,
    visibility,
    status,
    sort_order
)
VALUES (
    NULL,
    (SELECT id FROM public.institutions WHERE slug = 'revista-la-gauchita'),
    NULL,
    'Portada Revista La Gauchita 274',
    'Portada de Revista La Gauchita utilizada como referencia institucional y visual del archivo editorial.',
    'cover_image',
    'public-media',
    'instituciones/revista-la-gauchita/portadaLG274.webp',
    'image/webp',
    NULL,
    'portadaLG274.webp',
    U&'Portada de Revista La Gauchita n\00FAmero 274',
    'Revista La Gauchita',
    'Revista La Gauchita',
    'authorized',
    'public',
    'active',
    20
)
ON CONFLICT (bucket_name, storage_path) DO UPDATE SET
    content_id = EXCLUDED.content_id,
    institution_id = EXCLUDED.institution_id,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    asset_type = EXCLUDED.asset_type,
    mime_type = EXCLUDED.mime_type,
    original_filename = EXCLUDED.original_filename,
    alt_text = EXCLUDED.alt_text,
    credit = EXCLUDED.credit,
    source_reference = EXCLUDED.source_reference,
    rights_status = EXCLUDED.rights_status,
    visibility = EXCLUDED.visibility,
    status = EXCLUDED.status,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

-- Imagen 3: Homenaje a los bibliotecarios (No relations)
INSERT INTO public.media_assets (
    content_id,
    institution_id,
    uploaded_by_profile_id,
    title,
    description,
    asset_type,
    bucket_name,
    storage_path,
    mime_type,
    file_size_bytes,
    original_filename,
    alt_text,
    credit,
    source_reference,
    rights_status,
    visibility,
    status,
    sort_order
)
VALUES (
    NULL,
    NULL,
    NULL,
    'Homenaje a los bibliotecarios',
    'Diploma de reconocimiento otorgado a Eduardo Ceballos por su trayectoria y entrega constante al servicio bibliotecario.',
    'recognition_document',
    'public-media',
    'reconocimientos/reconocimientobiblio.webp',
    'image/webp',
    NULL,
    'reconocimientobiblio.webp',
    'Diploma de homenaje a los bibliotecarios otorgado a Eduardo Ceballos',
    U&'Federaci\00F3n Salte\00F1a de Bibliotecas Populares',
    'Diploma',
    'authorized',
    'public',
    'active',
    30
)
ON CONFLICT (bucket_name, storage_path) DO UPDATE SET
    content_id = EXCLUDED.content_id,
    institution_id = EXCLUDED.institution_id,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    asset_type = EXCLUDED.asset_type,
    mime_type = EXCLUDED.mime_type,
    original_filename = EXCLUDED.original_filename,
    alt_text = EXCLUDED.alt_text,
    credit = EXCLUDED.credit,
    source_reference = EXCLUDED.source_reference,
    rights_status = EXCLUDED.rights_status,
    visibility = EXCLUDED.visibility,
    status = EXCLUDED.status,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();
