-- Migration 0021: Seed more real contents batch A
-- Project: La Gauchita Federal
-- Scope: public.contents
-- Note: ASCII-safe SQL using PostgreSQL Unicode escape strings.

-- =========================================================================
-- 1. Seed Content 7: Gliptodontes, megaterios y mastodontes
-- =========================================================================

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
    U&'GLIPTODONTES, MEGATERIOS Y MASTODONTES EN LA EDAD DE HIELO EN SALTA',
    'gliptodontes-megaterios-y-mastodontes-edad-de-hielo-en-salta',
    U&'Por el Dr. Ricardo N. Alonso',
    U&'Relato de los hallazgos de grandes mam\00EDferos f\00F3siles del Pleistoceno en Salta, vinculando la paleontolog\00EDa regional con la historia natural de la Edad de Hielo.',
    U&'Durante el Pleistoceno, la actual provincia de Salta albergaba una fauna prehist\00F3rica extraordinaria de grandes dimensiones, adaptada a las rigurosas condiciones clim\00E1ticas de la Edad de Hielo. Entre estos colosos se encontraban los gliptodontes, megaterios y mastodontes, cuyos restos f\00F3siles contin\00FAan emergiendo en diversos puntos de la geograf\00EDa salte\00F1a, asombrando a investigadores y pobladores locales por igual.' || E'\n\n' || U&'El megaterio, un perezoso terrestre gigante que pod\00EDa alcanzar el tama\00F1o de un elefante actual, es uno de los f\00F3siles m\00E1s impresionantes de la regi\00F3n. Uno de los hallazgos hist\00F3ricos m\00E1s importantes tuvo lugar en 1972 en la Estancia Vieja del Rey, en el departamento de Anta. Este esp\00E9cimen, clasificado cient\00EDficamente como Megatherium arnodin-chibraci, representa un testimonio magn\00EDfico de la envergadura y adaptabilidad de estos mam\00EDferos herb\00EDvoros en el antiguo ecosistema de valles salte\00F1os.' || E'\n\n' || U&'Por otro lado, los gliptodontes eran mam\00EDferos acorazados emparentados lejanamente con los armadillos actuales, pero del tama\00F1o de un autom\00F3vil peque\00F1o. El ge\00F3logo Ricardo Alonso y su equipo documentaron el asombroso hallazgo de una paleocueva en la serran\00EDa del Mojotoro. Estas paleocuevas eran t\00FAneles excavados por los propios gliptodontes (como el g\00E9nero Neosclerocalyptus) para refugiarse, proporcionando una valiosa informaci\00F3n sobre el comportamiento conductual y la ecolog\00EDa de estas criaturas de m\00E1s de trescientos kilos.' || E'\n\n' || U&'Los mastodontes, pertenecientes al grupo de los probosc\00EDdeos y parientes de los elefantes modernos, completaban este paisaje glacial. A diferencia de los megaterios y gliptodontes, que eran de origen sudamericano, los mastodontes ingresaron al continente durante el Gran Intercambio Bi\00F3tico Americano. En 1954, el reconocido profesor Amadeo Sirolli desenterr\00F3 un esqueleto completo de Stegomastodon en Cruz Quemada, un hito paleontol\00F3gico que consolid\00F3 el valor de Salta como un archivo natural excepcional del pasado geol\00F3gico.' || E'\n\n' || U&'La extinci\00F3n de esta megafauna ocurri\00F3 hace unos diez mil a\00F1os, coincidiendo con el fin de la \00FAltima glaciaci\00F3n y la llegada de los primeros grupos humanos de cazadores-recolectores. Las evidencias arqueol\00F3gicas y paleontol\00F3gicas sugieren una coexistencia entre estos colosos y los primeros pobladores de la regi\00F3n, abriendo debates fascinantes sobre las causas de su desaparici\00F3n, donde el cambio clim\00E1tico y la actividad humana jugaron roles fundamentales.',
    COALESCE(
        (SELECT id FROM public.content_types WHERE code = 'article'),
        (SELECT id FROM public.content_types WHERE code = 'news')
    ),
    COALESCE(
        (SELECT id FROM public.categories WHERE code = 'science'),
        (SELECT id FROM public.categories WHERE code = 'history'),
        (SELECT id FROM public.categories WHERE code = 'culture')
    ),
    (SELECT id FROM public.institutions WHERE slug = 'revista-la-gauchita'),
    NULL,
    (SELECT id FROM public.regions WHERE code = 'noa'),
    (SELECT id FROM public.provinces WHERE code = 'salta'),
    (SELECT id FROM public.municipalities WHERE code = 'salta'),
    '2026-06-01',
    '2026-06-01 00:00:00+00',
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
-- 2. Seed Content 8: La leyenda del Jarjacha
-- =========================================================================

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
    U&'LA LEYENDA DEL JARJACHA (PER\00DA)',
    'la-leyenda-del-jarjacha-peru',
    U&'Por Felipe Mendoza',
    U&'Relato sobre el Jarjacha, criatura temida del imaginario andino peruano, presentada como una leyenda de advertencia moral dentro del folclore de la sierra central y sur del Per\00FA.',
    U&'La leyenda del Jarjacha es uno de los relatos m\00E1s arraigados y temidos en el imaginario folcl\00F3rico de la sierra central y sur del Per\00FA, particularmente en regiones como Huancayo y Huaytar\00E1. Esta criatura m\00EDtica, cuyo nombre proviene del estremecedor chillido "jar-jar-jar" que emite al vagar por las noches, encarna el terror de las comunidades andinas y sirve como una advertencia moral de gran poder social.' || E'\n\n' || U&'Seg\00FAn la tradici\00F3n oral andina, el Jarjacha es un ser monstruoso que se origina como castigo divino ante pecados morales graves, especialmente el incesto. Las personas que cometen esta transgresi\00F3n son condenadas a transformarse durante las noches en una bestia h\00EDbrida, com\00FAnmente descrita como una criatura mitad hombre y mitad llama o alpaca. La metamorfosis priva a la persona de su conciencia y la obliga a deambular por los senderos oscuros aterrorizando a quienes se cruzan en su camino.' || E'\n\n' || U&'La creencia popular sostiene que el Jarjacha posee una mirada hipn\00F3tica capaz de paralizar a sus v\00EDctimas y llevarlas a la locura o a la muerte. Los pobladores andinos han transmitido de generaci\00F3n en generaci\00F3n diversas formas de protegerse contra este ser, que incluyen el uso de cuerdas hechas de lana de llama negra, crucifijos y oraciones espec\00EDficas, as\00ED como el confrontarlo con valent\00EDa pronunciando su nombre para obligarlo a recuperar su forma humana.' || E'\n\n' || U&'Para descubrir la identidad de la persona que se convierte en Jarjacha, los relatos tradicionales sugieren seguir los rastros de la criatura al amanecer, los cuales invariablemente conducen hasta la casa del pecador, quien suele despertar exhausto, con heridas o marcas del recorrido nocturno. Este aspecto del mito refuerza la vigilancia social y el cumplimiento estricto de las normas familiares dentro de las comunidades andinas.' || E'\n\n' || U&'M\00E1s all\00E1 de su car\00E1cter terror\00EDfico, la leyenda del Jarjacha funciona como una herramienta de control social e institucionalizaci\00F3n de la moral familiar. Al vincular el pecado de la transgresi\00F3n familiar con una monstruosa transformaci\00F3n f\00EDsica visible para toda la comunidad, el relato preserva valores ancestrales de orden y respeto, manteniendo su vigencia como parte del patrimonio oral intangible del Per\00FA.',
    COALESCE(
        (SELECT id FROM public.content_types WHERE code = 'article'),
        (SELECT id FROM public.content_types WHERE code = 'news')
    ),
    COALESCE(
        (SELECT id FROM public.categories WHERE code = 'traditions'),
        (SELECT id FROM public.categories WHERE code = 'folklore'),
        (SELECT id FROM public.categories WHERE code = 'culture')
    ),
    (SELECT id FROM public.institutions WHERE slug = 'revista-la-gauchita'),
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-06-01',
    '2026-06-01 00:00:00+00',
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
