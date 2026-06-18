-- Migration 0024: Seed more real institutions
-- Project: La Gauchita Federal
-- Scope: public.institutions
-- Note: ASCII-safe SQL using PostgreSQL Unicode escape strings.

-- =========================================================================
-- 1. Seed Institution 4: Museo Terry
-- Source: Certificado de presentacion de Revista La Gauchita, 15 de septiembre de 2001.
-- =========================================================================

INSERT INTO public.institutions (
    name,
    slug,
    institution_type,
    description,
    website_url,
    logo_url,
    region_id,
    province_id,
    municipality_id,
    address,
    contact_email,
    contact_phone,
    status,
    is_featured,
    sort_order
)
VALUES (
    U&'Museo Regional de Pintura Jos\00E9 Antonio Terry',
    'museo-regional-de-pintura-jose-antonio-terry',
    'museum',
    U&'Instituci\00F3n cultural vinculada al archivo documental de La Gauchita Federal a partir del certificado otorgado por la presentaci\00F3n de Revista La Gauchita realizada por Miguel Eduardo Ceballos en su sala institucional el 15 de septiembre de 2001.',
    NULL,
    NULL,
    (SELECT id FROM public.regions WHERE code = 'noa'),
    NULL, -- Jujuy not in default province catalog
    NULL, -- Tilcara not in default municipality catalog
    NULL,
    NULL,
    NULL,
    'active',
    false,
    40
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    institution_type = EXCLUDED.institution_type,
    description = EXCLUDED.description,
    website_url = EXCLUDED.website_url,
    logo_url = EXCLUDED.logo_url,
    region_id = EXCLUDED.region_id,
    province_id = EXCLUDED.province_id,
    municipality_id = EXCLUDED.municipality_id,
    address = EXCLUDED.address,
    contact_email = EXCLUDED.contact_email,
    contact_phone = EXCLUDED.contact_phone,
    status = EXCLUDED.status,
    is_featured = EXCLUDED.is_featured,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

-- =========================================================================
-- 2. Seed Institution 5: Instituto Guemesiano de Salta
-- Source: Certificado como disertante sobre Guemes Humano, 8 de febrero de 2009.
-- =========================================================================

INSERT INTO public.institutions (
    name,
    slug,
    institution_type,
    description,
    website_url,
    logo_url,
    region_id,
    province_id,
    municipality_id,
    address,
    contact_email,
    contact_phone,
    status,
    is_featured,
    sort_order
)
VALUES (
    U&'Instituto G\00FCemesiano de Salta',
    'instituto-guemesiano-de-salta',
    'cultural_institute',
    U&'Instituci\00F3n cultural salte\00F1a vinculada al archivo documental de La Gauchita Federal a partir del certificado otorgado a Miguel Eduardo Ceballos como disertante en el Acto Acad\00E9mico sobre el tema G\00FCemes Humano, realizado el 8 de febrero de 2009.',
    NULL,
    NULL,
    (SELECT id FROM public.regions WHERE code = 'noa'),
    (SELECT id FROM public.provinces WHERE code = 'salta'),
    (SELECT id FROM public.municipalities WHERE code = 'salta'),
    NULL,
    NULL,
    NULL,
    'active',
    false,
    50
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    institution_type = EXCLUDED.institution_type,
    description = EXCLUDED.description,
    website_url = EXCLUDED.website_url,
    logo_url = EXCLUDED.logo_url,
    region_id = EXCLUDED.region_id,
    province_id = EXCLUDED.province_id,
    municipality_id = EXCLUDED.municipality_id,
    address = EXCLUDED.address,
    contact_email = EXCLUDED.contact_email,
    contact_phone = EXCLUDED.contact_phone,
    status = EXCLUDED.status,
    is_featured = EXCLUDED.is_featured,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

-- =========================================================================
-- 3. Seed Institution 6: Federacion Saltena de Bibliotecas Populares
-- Source: Diploma de reconocimiento por trayectoria y servicio bibliotecario, 23 de septiembre de 2001.
-- =========================================================================

INSERT INTO public.institutions (
    name,
    slug,
    institution_type,
    description,
    website_url,
    logo_url,
    region_id,
    province_id,
    municipality_id,
    address,
    contact_email,
    contact_phone,
    status,
    is_featured,
    sort_order
)
VALUES (
    U&'Federaci\00F3n Salte\00F1a de Bibliotecas Populares',
    'federacion-saltena-de-bibliotecas-populares',
    'association',
    U&'Entidad vinculada al archivo documental de La Gauchita Federal a partir del diploma de reconocimiento otorgado a Eduardo Ceballos por su trayectoria y entrega constante al servicio bibliotecario.',
    NULL,
    NULL,
    (SELECT id FROM public.regions WHERE code = 'noa'),
    (SELECT id FROM public.provinces WHERE code = 'salta'),
    (SELECT id FROM public.municipalities WHERE code = 'salta'),
    NULL,
    NULL,
    NULL,
    'active',
    false,
    60
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    institution_type = EXCLUDED.institution_type,
    description = EXCLUDED.description,
    website_url = EXCLUDED.website_url,
    logo_url = EXCLUDED.logo_url,
    region_id = EXCLUDED.region_id,
    province_id = EXCLUDED.province_id,
    municipality_id = EXCLUDED.municipality_id,
    address = EXCLUDED.address,
    contact_email = EXCLUDED.contact_email,
    contact_phone = EXCLUDED.contact_phone,
    status = EXCLUDED.status,
    is_featured = EXCLUDED.is_featured,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

