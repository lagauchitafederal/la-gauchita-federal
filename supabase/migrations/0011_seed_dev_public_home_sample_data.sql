-- Migration 0011: Seed dev public home sample data
-- Project: La Gauchita Federal
-- Scope: DEV ONLY - SAMPLE DATA
-- Note: All comments use ASCII encoding to avoid system-specific character issues.

-- =========================================================================
-- DEV ONLY - DO NOT RUN IN PRODUCTION
-- NO REAL CULTURAL OR INSTITUTIONAL DATA
-- =========================================================================

-- 1. Seed Institution Demo
INSERT INTO public.institutions (
    name,
    slug,
    institution_type,
    description,
    status,
    is_featured,
    sort_order,
    region_id,
    province_id,
    municipality_id
)
VALUES (
    'Centro Cultural Demo Federal',
    'centro-cultural-demo-federal',
    'cultural_center',
    'Institucion demo de desarrollo para validacion visual de portadas.',
    'active',
    true,
    1,
    (SELECT id FROM public.regions WHERE code = 'noa'),
    (SELECT id FROM public.provinces WHERE code = 'salta'),
    (SELECT id FROM public.municipalities WHERE code = 'salta')
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    institution_type = EXCLUDED.institution_type,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    is_featured = EXCLUDED.is_featured,
    sort_order = EXCLUDED.sort_order,
    region_id = EXCLUDED.region_id,
    province_id = EXCLUDED.province_id,
    municipality_id = EXCLUDED.municipality_id,
    updated_at = now();

-- 2. Seed Content Demo
INSERT INTO public.contents (
    title,
    slug,
    subtitle,
    summary,
    body,
    content_type_id,
    category_id,
    institution_id,
    author_profile_id,
    region_id,
    province_id,
    municipality_id,
    event_date,
    publish_date,
    status,
    visibility,
    is_featured,
    source_reference
)
VALUES (
    'Efemeride cultural demo',
    'efemeride-cultural-demo',
    'Hito de muestra para pruebas de desarrollo',
    'Resumen de muestra de la efemeride cultural demo para validar listados.',
    'Cuerpo de prueba de la efemeride cultural demo.',
    (SELECT id FROM public.content_types WHERE code = 'ephemeris'),
    (SELECT id FROM public.categories WHERE code = 'culture'),
    (SELECT id FROM public.institutions WHERE slug = 'centro-cultural-demo-federal'),
    NULL,
    (SELECT id FROM public.regions WHERE code = 'noa'),
    (SELECT id FROM public.provinces WHERE code = 'salta'),
    (SELECT id FROM public.municipalities WHERE code = 'salta'),
    '2026-06-15',
    now(),
    'published',
    'public',
    true,
    'Dato ficticio de desarrollo - NO PROD'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    summary = EXCLUDED.summary,
    body = EXCLUDED.body,
    content_type_id = EXCLUDED.content_type_id,
    category_id = EXCLUDED.category_id,
    institution_id = EXCLUDED.institution_id,
    author_profile_id = EXCLUDED.author_profile_id,
    region_id = EXCLUDED.region_id,
    province_id = EXCLUDED.province_id,
    municipality_id = EXCLUDED.municipality_id,
    event_date = EXCLUDED.event_date,
    publish_date = EXCLUDED.publish_date,
    status = EXCLUDED.status,
    visibility = EXCLUDED.visibility,
    is_featured = EXCLUDED.is_featured,
    source_reference = EXCLUDED.source_reference,
    updated_at = now();

-- 3. Seed Recognition Demo
INSERT INTO public.recognitions (
    title,
    slug,
    recognition_type,
    description,
    granting_institution_name,
    granting_institution_id,
    recognized_entity_type,
    recognized_entity_id,
    related_content_id,
    related_institution_id,
    recognition_date,
    location,
    document_reference,
    source_reference,
    status,
    visibility,
    is_featured,
    sort_order,
    created_by_profile_id
)
VALUES (
    'Reconocimiento demo de trayectoria cultural',
    'reconocimiento-demo-trayectoria-cultural',
    'distinction',
    'Mencion honorifica demo para pruebas de integracion de datos.',
    'Institucion Otorgante Demo',
    NULL,
    'project',
    NULL,
    (SELECT id FROM public.contents WHERE slug = 'efemeride-cultural-demo'),
    (SELECT id FROM public.institutions WHERE slug = 'centro-cultural-demo-federal'),
    '2026-06-15',
    'Salta',
    'Resolucion Demo 123/2026',
    'Dato ficticio de desarrollo - NO PROD',
    'active',
    'public',
    true,
    1,
    NULL
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    recognition_type = EXCLUDED.recognition_type,
    description = EXCLUDED.description,
    granting_institution_name = EXCLUDED.granting_institution_name,
    granting_institution_id = EXCLUDED.granting_institution_id,
    recognized_entity_type = EXCLUDED.recognized_entity_type,
    recognized_entity_id = EXCLUDED.recognized_entity_id,
    related_content_id = EXCLUDED.related_content_id,
    related_institution_id = EXCLUDED.related_institution_id,
    recognition_date = EXCLUDED.recognition_date,
    location = EXCLUDED.location,
    document_reference = EXCLUDED.document_reference,
    source_reference = EXCLUDED.source_reference,
    status = EXCLUDED.status,
    visibility = EXCLUDED.visibility,
    is_featured = EXCLUDED.is_featured,
    sort_order = EXCLUDED.sort_order,
    created_by_profile_id = EXCLUDED.created_by_profile_id,
    updated_at = now();

-- 4. Seed Media Asset Demo
INSERT INTO public.media_assets (
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
    sort_order,
    content_id,
    institution_id,
    uploaded_by_profile_id
)
VALUES (
    'Imagen demo de archivo cultural',
    'Asset multimedia demo de desarrollo. No posee archivo fisico cargado en Storage.',
    'cover_image',
    'public-media',
    'demo/home/imagen-demo-archivo-cultural.jpg',
    'image/jpeg',
    1024,
    'imagen-demo.jpg',
    'Vista previa demo de archivo cultural',
    'Archivo Demo Federal',
    'Dato ficticio de desarrollo - NO PROD',
    'owned',
    'public',
    'active',
    1,
    (SELECT id FROM public.contents WHERE slug = 'efemeride-cultural-demo'),
    (SELECT id FROM public.institutions WHERE slug = 'centro-cultural-demo-federal'),
    NULL
)
ON CONFLICT (bucket_name, storage_path) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    asset_type = EXCLUDED.asset_type,
    mime_type = EXCLUDED.mime_type,
    file_size_bytes = EXCLUDED.file_size_bytes,
    original_filename = EXCLUDED.original_filename,
    alt_text = EXCLUDED.alt_text,
    credit = EXCLUDED.credit,
    source_reference = EXCLUDED.source_reference,
    rights_status = EXCLUDED.rights_status,
    visibility = EXCLUDED.visibility,
    status = EXCLUDED.status,
    sort_order = EXCLUDED.sort_order,
    content_id = EXCLUDED.content_id,
    institution_id = EXCLUDED.institution_id,
    uploaded_by_profile_id = EXCLUDED.uploaded_by_profile_id,
    updated_at = now();

