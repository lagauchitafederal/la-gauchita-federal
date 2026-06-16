-- Migration 0012: Seed initial real public data
-- Project: La Gauchita Federal
-- Scope: public.institutions, public.contents, public.recognitions
-- Note: All comments use ASCII encoding to avoid system-specific character issues.

-- =========================================================================
-- 1. Seed Real Institutions
-- =========================================================================

-- Revista La Gauchita
INSERT INTO public.institutions (
    name,
    slug,
    institution_type,
    description,
    website_url,
    region_id,
    province_id,
    municipality_id,
    address,
    contact_email,
    contact_phone,
    status
)
VALUES (
    'Revista La Gauchita',
    'revista-la-gauchita',
    'media',
    'Revista Saltena Coleccionable',
    'https://eduardoceballos.com/revistas',
    (SELECT id FROM public.regions WHERE code = 'noa'),
    (SELECT id FROM public.provinces WHERE code = 'salta'),
    (SELECT id FROM public.municipalities WHERE code = 'salta'),
    'Manuela Gonzalez de Todd 930',
    'eduardoceballos.salta@gmail.com',
    '+54 9 387 510-1026',
    'active'
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    institution_type = EXCLUDED.institution_type,
    description = EXCLUDED.description,
    website_url = EXCLUDED.website_url,
    region_id = EXCLUDED.region_id,
    province_id = EXCLUDED.province_id,
    municipality_id = EXCLUDED.municipality_id,
    address = EXCLUDED.address,
    contact_email = EXCLUDED.contact_email,
    contact_phone = EXCLUDED.contact_phone,
    status = EXCLUDED.status,
    updated_at = now();

-- Instituto Cultural Andino
INSERT INTO public.institutions (
    name,
    slug,
    institution_type,
    description,
    region_id,
    province_id,
    municipality_id,
    address,
    contact_email,
    contact_phone,
    status
)
VALUES (
    'Instituto Cultural Andino',
    'instituto-cultural-andino',
    'cultural_institute',
    'Produccion de libros, revistas y productos culturales',
    (SELECT id FROM public.regions WHERE code = 'noa'),
    (SELECT id FROM public.provinces WHERE code = 'salta'),
    (SELECT id FROM public.municipalities WHERE code = 'salta'),
    'Manuela Gonzalez de Todd 930',
    'eduardoceballos.salta@gmail.com',
    '+54 9 387 510-1026',
    'active'
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    institution_type = EXCLUDED.institution_type,
    description = EXCLUDED.description,
    region_id = EXCLUDED.region_id,
    province_id = EXCLUDED.province_id,
    municipality_id = EXCLUDED.municipality_id,
    address = EXCLUDED.address,
    contact_email = EXCLUDED.contact_email,
    contact_phone = EXCLUDED.contact_phone,
    status = EXCLUDED.status,
    updated_at = now();

-- =========================================================================
-- 2. Seed Real Contents
-- =========================================================================

-- Content 1: Efemeride Eduardo Falu
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
    source_reference
)
VALUES (
    '7 de julio de 1923',
    '7-de-julio-de-1923-eduardo-falu',
    'Eduardo Falu',
    'Nacio en El Galpon, provincia de Salta, el guitarrista Eduardo Falu.',
    'Mundialmente conocido por su obra musical y por su calidad interpretativa. Compuso con Jaime Davalos, Manuel J. Castilla, Ernesto Sabato, Cesar Perdiguer, Jose Rios, Hugo Alarcon, entre muchos otros poetas. Entre sus exitos mas reconocidos se encuentran: La Atardecida, La nina, La nostalgiosa, Las golondrinas, La volvedora, No te puedo olvidar, Tabacalera, Tonada del viejo amor y Zamba de la Candelaria.',
    (SELECT id FROM public.content_types WHERE code = 'ephemeris'),
    COALESCE(
        (SELECT id FROM public.categories WHERE code = 'music'),
        (SELECT id FROM public.categories WHERE code = 'culture')
    ),
    (SELECT id FROM public.institutions WHERE slug = 'instituto-cultural-andino'),
    NULL,
    (SELECT id FROM public.regions WHERE code = 'noa'),
    (SELECT id FROM public.provinces WHERE code = 'salta'),
    (SELECT id FROM public.municipalities WHERE code = 'salta'),
    '1923-07-07',
    '2026-06-16 00:00:00+00',
    'published',
    'public',
    'Libro: Conozca Salta a traves de sus Efemerides'
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
    source_reference = EXCLUDED.source_reference,
    updated_at = now();

-- =========================================================================
-- 3. Seed Real Recognitions
-- =========================================================================

-- Recognition 1: Declaracion de interes al Diccionario Cultural del Noroeste Argentino
INSERT INTO public.recognitions (
    title,
    slug,
    recognition_type,
    description,
    granting_institution_name,
    recognized_entity_type,
    recognition_date,
    location,
    document_reference,
    source_reference,
    status,
    visibility
)
VALUES (
    'Declaracion de interes al Diccionario Cultural del Noroeste Argentino',
    'declaracion-interes-diccionario-cultural-noroeste-argentino',
    'declaration',
    'Declarar de interes de esta Camara el "Diccionario Cultural del Noroeste Argentino" del escritor salteno Eduardo Ceballos, obra de investigacion que conforma una interesante y completa variedad de biografias y resume la produccion cultural de las seis provincias que conforman la Region Noroeste Argentino.',
    'Camara de Diputados de la Provincia de Salta',
    'person',
    '2021-11-24',
    'Salta Capital',
    'Res. Nro. 378/21',
    'Res. Nro. 378/21 - Camara de Diputados de la Provincia de Salta',
    'active',
    'public'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    recognition_type = EXCLUDED.recognition_type,
    description = EXCLUDED.description,
    granting_institution_name = EXCLUDED.granting_institution_name,
    recognized_entity_type = EXCLUDED.recognized_entity_type,
    recognition_date = EXCLUDED.recognition_date,
    location = EXCLUDED.location,
    document_reference = EXCLUDED.document_reference,
    source_reference = EXCLUDED.source_reference,
    status = EXCLUDED.status,
    visibility = EXCLUDED.visibility,
    updated_at = now();
