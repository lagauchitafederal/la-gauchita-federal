-- Migration 0022: Seed more recognitions batch B
-- Project: La Gauchita Federal
-- Scope: public.recognitions
-- Note: ASCII-safe SQL using PostgreSQL Unicode escape strings.

-- =========================================================================
-- 1. Seed Recognition 6: Certificado Presentacion Museo Terry
-- =========================================================================

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
    U&'Certificado de presentaci\00F3n de Revista La Gauchita en el Museo Jos\00E9 Antonio Terry',
    'certificado-presentacion-revista-la-gauchita-museo-terry-2001',
    'certification',
    U&'Certificado otorgado a Miguel Eduardo Ceballos por la presentaci\00F3n de la revista "La Gauchita" en la Sala "Amalia Lacroze de Fortabat y Alfredo Fortabat" del Museo Regional de Pintura "Jos\00E9 Antonio Terry", realizada el 15 de septiembre de 2001.',
    U&'Museo Regional de Pintura "Jos\00E9 Antonio Terry" - Direcci\00F3n Nacional de Patrimonio, Museos y Artes. Secretar\00EDa de Cultura y Medios de Comunicaci\00F3n - Presidencia de la Naci\00F3n.',
    'person',
    '2001-09-15',
    U&'Tilcara',
    U&'Certificado',
    U&'Certificado',
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

-- =========================================================================
-- 2. Seed Recognition 7: Certificado Disertante Guemes Humano
-- =========================================================================

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
    U&'Certificado como disertante sobre G\00FCemes Humano',
    'certificado-disertante-guemes-humano-2009',
    'certification',
    U&'Certificado otorgado a Miguel Eduardo Ceballos por su participaci\00F3n como disertante en el Acto Acad\00E9mico con el tema "G\00FCemes Humano".',
    U&'Instituto G\00FCemesiano de Salta',
    'person',
    '2009-02-08',
    U&'Salta Capital',
    U&'Certificado',
    U&'Certificado',
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
