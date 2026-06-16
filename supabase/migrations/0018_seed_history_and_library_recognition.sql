-- Migration 0018: Seed history content and library recognition
-- Project: La Gauchita Federal
-- Scope: public.contents, public.recognitions
-- Note: ASCII-safe SQL using PostgreSQL Unicode escape strings.

-- =========================================================================
-- 1. Seed Real Contents (Batch 4)
-- =========================================================================

-- Content 6: LA NUTRIDA LABOR HISTORICA DE JUAN MANUEL DE LOS RIOS
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
    U&'LA NUTRIDA LABOR HIST\00D3RICA DE JUAN MANUEL DE LOS R\00CDOS',
    'la-nutrida-labor-historica-juan-manuel-de-los-rios',
    U&'Por Carlos Mar\00EDa Romero Sosa',
    U&'Carlos Mar\00EDa Romero Sosa aborda la labor hist\00F3rica de Juan Manuel de los R\00EDos en torno a los l\00EDmites de Salta, sus antecedentes documentales y los conflictos territoriales internacionales e interprovinciales de la provincia.',
    U&'I) Secretario de la Comisi\00F3n de L\00EDmites de Salta' || E'\n\n' ||
    U&'Salta, con 155.488 kil\00F3metros cuadrados, una extensi\00F3n geogr\00E1fica que le permite tener fronteras internacionales con Chile, Bolivia y Paraguay, y l\00EDmites con las provincias de Jujuy, Formosa, Chaco, Santiago del Estero, Catamarca y Tucum\00E1n, no es extra\00F1o que haya sostenido diversos conflictos territoriales, internacionales e interprovinciales.' || E'\n\n' ||
    U&'As\00ED, por ejemplificar con hechos m\00E1s o menos ventilados en \00E9pocas no muy lejanas, aunque con a\00F1ejos antecedentes, en 1933 el ingeniero Alfonso Peralta, director general de Obras P\00FAblicas de Salta, dio a conocer en publicaci\00F3n oficial del Ministerio de Gobierno, a cargo del doctor Ernesto Ar\00E1oz durante la gobernaci\00F3n de Joaqu\00EDn Corbal\00E1n, su \201CContribuci\00F3n al Estudio Hist\00F3rico de los L\00EDmites de la Provincia de Salta\201D. El trabajo consta de 75 p\00E1ginas, epilogado con dos mapas, y estudia el disputado caso de la boliviana Tarija.' || E'\n\n' ||
    U&'El ingeniero Peralta argument\00F3 sobre la procedencia salte\00F1a de ese departamento de Bolivia, incluso con fundamento en bibliograf\00EDa de historiadores del Pa\00EDs del Altiplano, como Ricardo Jaimes Freyre en su \201CHistoria del Descubrimiento del Tucum\00E1n\201D, donde puede leerse referencia a territorios como \201COr\00E1n, Iruya, Santa Victoria, etc., y el territorio situado al norte de las juntas de San Antonio entre el r\00EDo Bermejo por el oeste y los r\00EDos Grande de Tarija e Ita\00FA por el este, que actualmente se encuentran bajo la jurisdicci\00F3n de Bolivia\201D.' || E'\n\n' ||
    U&'Continuaba as\00ED el funcionario salte\00F1o la senda trazada sobre el particular por Bernardo Fr\00EDas en el \201CInforme y comprobantes sobre l\00EDmites\201D, citado por el senador Carlos Serrey en su relaci\00F3n dirigida al presidente de la Comisi\00F3n de L\00EDmites Interprovinciales, doctor Guillermo Rothe, el 30 de abril de 1938.' || E'\n\n' ||
    U&'Sin olvidar lo tratado en las \00FAltimas d\00E9cadas del siglo XIX por Juan Mart\00EDn Leguizam\00F3n en sus art\00EDculos publicados en el diario salte\00F1o Democracia en 1872; por Casiano J. Goytia con sus notas period\00EDsticas, tambi\00E9n aparecidas en Democracia ese mismo a\00F1o, bajo el t\00EDtulo \201CJurisdicci\00F3n Hist\00F3rica de Salta sobre Tarija\201D; y por Mariano Zorreguieta con sus \201CApuntes Hist\00F3ricos de la Provincia de Salta en la \00E9poca del Coloniaje\201D, igualmente de 1872.' || E'\n\n' ||
    U&'Todos ellos se hallan reunidos en la obra \201CL\00EDmites con Bolivia\201D (1872), publicaci\00F3n ordenada por el Gobierno Provincial siendo presidente de la Honorable C\00E1mara Legislativa, en ejercicio del Poder Ejecutivo, Mois\00E9s Oliva, m\00E1s tarde gobernador constitucional en el per\00EDodo 1879-1881.',
    COALESCE(
        (SELECT id FROM public.content_types WHERE code = 'article'),
        (SELECT id FROM public.content_types WHERE code = 'news')
    ),
    COALESCE(
        (SELECT id FROM public.categories WHERE code = 'history'),
        (SELECT id FROM public.categories WHERE code = 'culture')
    ),
    (SELECT id FROM public.institutions WHERE slug = 'revista-la-gauchita'),
    NULL,
    (SELECT id FROM public.regions WHERE code = 'noa'),
    (SELECT id FROM public.provinces WHERE code = 'salta'),
    (SELECT id FROM public.municipalities WHERE code = 'salta'),
    '2026-06-06',
    '2026-06-06 00:00:00+00',
    'published',
    'public',
    'Revista La Gauchita'
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
-- 2. Seed Real Recognitions (Batch 4)
-- =========================================================================

-- Recognition 4: Homenaje a los bibliotecarios
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
    'Homenaje a los bibliotecarios',
    'homenaje-a-los-bibliotecarios-eduardo-ceballos-2001',
    'distinction',
    'Diploma de reconocimiento otorgado por la trayectoria y entrega constante al servicio bibliotecario.',
    U&'Federaci\00F3n Salte\00F1a de Bibliotecas Populares',
    'person',
    '2001-09-23',
    'Salta Capital',
    'Diploma',
    'Revista La Gauchita',
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
