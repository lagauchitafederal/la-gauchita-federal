-- Migration 0023: Seed more recognition media assets
-- Project: La Gauchita Federal
-- Scope: public.media_assets
-- Note: ASCII-safe SQL using PostgreSQL Unicode escape strings.

-- =========================================================================
-- 1. Seed Media Asset for Image 1: Certificado Museo Terry
-- =========================================================================

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
    U&'Certificado de presentaci\00F3n de Revista La Gauchita en el Museo Jos\00E9 Antonio Terry',
    U&'Certificado otorgado a Miguel Eduardo Ceballos por la presentaci\00F3n de la revista La Gauchita en el Museo Regional de Pintura Jos\00E9 Antonio Terry, realizada el 15 de septiembre de 2001.',
    'recognition_document',
    'public-media',
    'reconocimientos/certificado-museo-terry-2001.webp',
    'image/webp',
    NULL,
    'certificado-museo-terry-2001.webp',
    U&'Certificado de presentaci\00F3n de Revista La Gauchita en el Museo Jos\00E9 Antonio Terry',
    U&'Museo Regional de Pintura Jos\00E9 Antonio Terry',
    U&'Certificado',
    'authorized',
    'public',
    'active',
    40
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

-- =========================================================================
-- 2. Seed Media Asset for Image 2: Certificado Guemes Humano
-- =========================================================================

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
    U&'Certificado como disertante sobre G\00FCemes Humano',
    U&'Certificado otorgado a Miguel Eduardo Ceballos por su participaci\00F3n como disertante en el Acto Acad\00E9mico con el tema G\00FCemes Humano.',
    'recognition_document',
    'public-media',
    'reconocimientos/certificado-guemes-humano-2009.webp',
    'image/webp',
    NULL,
    'certificado-guemes-humano-2009.webp',
    U&'Certificado como disertante sobre G\00FCemes Humano otorgado a Miguel Eduardo Ceballos',
    U&'Instituto G\00FCemesiano de Salta',
    U&'Certificado',
    'authorized',
    'public',
    'active',
    50
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
