-- Migration 0013: Seed more real public data
-- Project: La Gauchita Federal
-- Scope: public.contents, public.recognitions
-- Note: All comments use ASCII encoding to avoid system-specific character issues.

-- =========================================================================
-- 1. Seed Real Contents (Batch 2)
-- =========================================================================

-- Content 2: GRAN PENA HOMENAJE EN VIDA
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
    'GRAN PENA HOMENAJE EN VIDA',
    'gran-pena-homenaje-en-vida',
    'Homenaje a referentes de la cultura saltena',
    'Gran cena pena homenaje impulsada por la cantora popular Claudia Vilte, con la participacion de artistas invitados y referentes culturales de Salta.',
    'Por iniciativa de la reconocida cantora popular Claudia Vilte, se realizara el sabado 13 de junio una gran cena pena homenaje, en las instalaciones del Centro Argentino, de avenida Sarmiento, con el aval de su presidente, el cantor Juan Rueda. Entre los homenajeados se encuentran Rodolfo Aredes, el papa de Pepito; Eduardo Ceballos; el historico cantor de tangos Hugo Cardozo; el conductor de programas televisivos Carlos Rodolfo Lopez Velez; el gestor cultural Lito Cardozo; y el matrimonio conformado por Teresita y Rodolfo "Supay" Soria, propietarios de Radio Santa Teresita, que pregonan la cultura de Salta. Sera una noche magica con la actuacion de artistas invitados entre los que se destacan Juan Rueda "El Andariego", Claudia Vilte, Grupo Quinoa, Chicha Guanca, Ballet Aromas de Salta, Guitarmon, Agustin Villaverde, Chichichi Villaroel, Marta Roldan y Turco Apud. Habra pista de baile para disfrutar de nuestra musica hasta las 5 de la madrugada. Sera una noche muy especial para aplaudir a nuestros referentes, gente que hizo historia con su aporte.',
    (SELECT id FROM public.content_types WHERE code = 'news'),
    (SELECT id FROM public.categories WHERE code = 'culture'),
    (SELECT id FROM public.institutions WHERE slug = 'revista-la-gauchita'),
    NULL,
    (SELECT id FROM public.regions WHERE code = 'noa'),
    (SELECT id FROM public.provinces WHERE code = 'salta'),
    (SELECT id FROM public.municipalities WHERE code = 'salta'),
    '2026-06-13',
    '2026-06-16 00:00:00+00',
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

-- Content 3: EFEMERIDES HISTORICAS Y CULTURALES DEL NOROESTE ARGENTINO
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
    'EFEMERIDES HISTORICAS Y CULTURALES DEL NOROESTE ARGENTINO',
    'efemerides-historicas-culturales-noroeste-argentino',
    'Presentacion en la 50 Feria Internacional del Libro de Buenos Aires',
    'En la 50 Feria Internacional del Libro de Buenos Aires se presento la obra Efemerides Historicas y Culturales del Noroeste Argentino, de Eduardo Ceballos.',
    'La obra "Efemerides Historicas y Culturales del Noroeste Argentino", de Eduardo Ceballos, fue presentada en la 50 Feria Internacional del Libro de Buenos Aires, el miercoles 29 de abril de 2026, a las 21 horas, en el Stand Norte Cultura, Pabellon Ocre. La publicacion esta integrada por dos tomos: el tomo I, de 316 paginas, y el tomo II, de 462 paginas, con un total de 778 paginas en formato 20 x 27 centimetros. Incluye referencias a mas de 4.000 escritores de La Rioja, Catamarca, Tucuman, Santiago del Estero, Jujuy y Salta. El trabajo constituye un aporte para conocer mejor la historia cultural del NOA y da continuidad al Diccionario Cultural del Noroeste Argentino. La presentacion conto con la presencia de amigos, escritores y artistas que acompanaron al autor. Entre ellos se destacaron el doctor Carlos Maria Romero Sosa, uno de los prologuistas de la obra, y el reconocido cantor popular Zamba Quipildor, embajador artistico de la patria e interprete de la Misa Criolla en distintos escenarios del mundo.',
    (SELECT id FROM public.content_types WHERE code = 'event'),
    (SELECT id FROM public.categories WHERE code = 'culture'),
    (SELECT id FROM public.institutions WHERE slug = 'revista-la-gauchita'),
    NULL,
    (SELECT id FROM public.regions WHERE code = 'noa'),
    (SELECT id FROM public.provinces WHERE code = 'salta'),
    (SELECT id FROM public.municipalities WHERE code = 'salta'),
    '2026-04-29',
    '2026-06-16 00:00:00+00',
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
-- 2. Seed Real Recognitions (Batch 2)
-- =========================================================================

-- Recognition 2: Premio Patria 2000
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
    'Premio Patria',
    'premio-patria-2000',
    'award',
    'Distincion otorgada por el apoyo brindado para destacar a los mas importantes valores de nuestra cultura.',
    'Radiodifusora FM Patria 90.3 Mhz.',
    'person',
    '2000-12-01',
    'Salta Capital',
    'Distincion',
    'Eduardo Ceballos - Revista La Gauchita',
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
