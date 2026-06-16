-- Migration 0016: Seed more real public data
-- Project: La Gauchita Federal
-- Scope: public.contents, public.recognitions
-- Note: ASCII-safe SQL using PostgreSQL Unicode escape strings.

-- =========================================================================
-- 1. Seed Real Contents (Batch 3)
-- =========================================================================

-- Content 4: AGRESION ENTRE GATOS
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
    U&'AGRESI\00D3N ENTRE GATOS',
    'agresion-entre-gatos',
    U&'Dr. Walter Octavio Chihan - M\00E9dico Veterinario - M. P. 037',
    U&'El m\00E9dico veterinario Walter Octavio Chihan analiza las principales causas de agresi\00F3n entre gatos, sus factores m\00E9dicos, ambientales y conductuales, y ofrece pautas para comprender el diagn\00F3stico y la clasificaci\00F3n del problema.',
    U&'Existen m\00FAltiples causales para la agresi\00F3n entre gatos. En todas las circunstancias, los factores m\00E9dicos deben ser descartados o identificados y tratados. En gatos sanos, desde otros aspectos, el miedo, la ansiedad y las respuestas territoriales contribuyen al problema. Las ri\00F1as pueden ocurrir a causa de un cambio en el estatus social, un evento traum\00E1tico, como la secuela del comportamiento agresivo redirigido u otro hecho ansiog\00E9nico, con la introducci\00F3n de otro gato, o debido a modificaciones sociales o ambientales dentro del hogar. Estos escenarios tambi\00E9n son responsables de peleas entre gatos que han vivido juntos durante cierto tiempo.' || E'\n\n' ||
    U&'Diagn\00F3stico. Anamnesis completa: todos los conflictos conductuales requieren una anamnesis detallada y completa para un diagn\00F3stico preciso. Los antecedentes y las descripciones de los incidentes agresivos son esenciales para identificar los potenciales disparadores del comportamiento y orientar la correspondiente conducta terap\00E9utica. El interrogatorio debe concentrase en los episodios; es preciso registrar la actitud o respuesta de cada animal y persona participante, en especial los signos de ansiedad, temor o defensa. Las expresiones agresivas incluyen bloqueo del acceso a un territorio, miradas fijas, soplidos, manotazos, gru\00F1idos, persecuciones, salivaciones, ara\00F1azos, mordidas y vocalizaciones, sin limitarse solo a estas. Tales indicios del comportamiento, junto con la frecuencia de los episodios, pueden ser de utilidad para confeccionar el pron\00F3stico.' || E'\n\n' ||
    U&'Recursos y ambiente: se debe obtener informaci\00F3n sobre la rutina diaria, incluyendo cu\00E1ndo y d\00F3nde se producen los incidentes agresivos y c\00F3mo es la distribuci\00F3n de recursos dentro del hogar. Los recursos comprenden alimentos, agua, bandejas sanitarias, juguetes, guaridas y lugares de reposo, entre otros. Los suministros restringidos pueden ser motivo de agresi\00F3n por competencia, y las disputas territoriales pueden provocar agresi\00F3n si existe una distribuci\00F3n inadecuada de recursos dentro de la casa. Por ejemplo, si las ri\00F1as siempre tienen lugar a la hora de alimentarse, se deber\00EDan ofrecer m\00E1s comederos y bebederos, y en mayor n\00FAmero de lugares. Si la agresi\00F3n ocurre cerca de la bandeja sanitaria, el problema podr\00EDa disminuir ofreciendo m\00E1s lugares para las evacuaciones.' || E'\n\n' ||
    U&'Edad de comienzo: se debe registrar la edad del gato al inicio del problema. Cuando los gatos alcanzan la madurez social, alrededor de 1 a 2 a\00F1os, pueden volverse m\00E1s proclives a competir por el estatus social y el territorio, lo cual explicar\00EDa el mayor n\00FAmero de conflictos entre compa\00F1eros de residencia.' || E'\n\n' ||
    U&'Lenguaje corporal y postura: las descripciones detalladas de la postura corporal y las expresiones faciales de los gatos participantes antes, durante y despu\00E9s del incidente son \00FAtiles para diferenciar entre agresores y v\00EDctimas. Si ambos gatos est\00E1n en un mismo nivel, es com\00FAn que el agresor tenga contacto ocular directo y postura corporal erguida, mientras que la v\00EDctima exhibir\00E1 signos de sometimiento, como apartar la vista y mantenerse agazapada.' || E'\n\n' ||
    U&'Clasificaci\00F3n. Agresi\00F3n territorial: algunos estudios se\00F1alan que los gatos no comparten los espacios igualmente y que, dentro de una colonia, ciertos ejemplares parecen tener el control. Las amenazas pueden ser furtivas, como bloquear el acceso a zonas, miradas fijas o desalojos, o tambi\00E9n agresiones francas.' || E'\n\n' ||
    U&'Agresi\00F3n por temor o defensiva: es una secuela com\00FAn de las ri\00F1as entre gatos. Con este tipo de comportamiento, el gato exhibe un lenguaje corporal temeroso o defensivo, como postura agazapada, orejas aplanadas, midriasis, piloerecci\00F3n, soplidos, salivaciones y gru\00F1idos. Esta respuesta conductual puede inducir en otros gatos conductas agresivas, origin\00E1ndose un c\00EDrculo vicioso de agresiones entre compa\00F1eros.' || E'\n\n' ||
    U&'Agresi\00F3n irritable: la irritaci\00F3n puede conducir a la agresi\00F3n si el gato experimenta problemas m\00E9dicos subyacentes, en especial dolor, o si ha sufrido cambios en su ambiente hogare\00F1o. Si estos inconvenientes se resuelven, el comportamiento agresivo puede declinar.' || E'\n\n' ||
    U&'Agresi\00F3n predatoria o relacionada con el juego: suele producirse en gatos \00FAnicos menores de 2 a\00F1os, en gatos alojados con otros animales que no juegan o en gatos que se quedan solos durante per\00EDodos extensos. Con frecuencia, el gato se esconde detr\00E1s de los objetos y aguarda el momento para saltar, atacar y luego escaparse.' || E'\n\n' ||
    U&'Agresi\00F3n redirigida: esta conducta se produce cuando un gato est\00E1 irritado, pero no puede descargar su reacci\00F3n sobre el agente que induce su irritaci\00F3n. Los est\00EDmulos posibles incluyen ver, o\00EDr u oler a otro gato u otro animal, ruidos inusuales, personas desconocidas, ambientes no familiares y dolor.',
    COALESCE(
        (SELECT id FROM public.content_types WHERE code = 'article'),
        (SELECT id FROM public.content_types WHERE code = 'news')
    ),
    COALESCE(
        (SELECT id FROM public.categories WHERE code = 'veterinary'),
        (SELECT id FROM public.categories WHERE code = 'health'),
        (SELECT id FROM public.categories WHERE code = 'culture')
    ),
    (SELECT id FROM public.institutions WHERE slug = 'revista-la-gauchita'),
    NULL,
    (SELECT id FROM public.regions WHERE code = 'noa'),
    (SELECT id FROM public.provinces WHERE code = 'salta'),
    (SELECT id FROM public.municipalities WHERE code = 'salta'),
    NULL,
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

-- Content 5: LAS MARCADAS
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
    'LAS MARCADAS',
    'las-marcadas',
    'Por Jorge A. Gianella',
    U&'Jorge A. Gianella aborda las marcadas, hierras y yerras como pr\00E1cticas tradicionales del \00E1mbito rural, vinculadas al ganado, la familia, la memoria comunitaria y la ofrenda a la Pachamama.',
    U&'Cuando se aproximan los fr\00EDos, baja la humedad y disminuye la presencia de moscas en el ambiente, llega el momento en que se realizan pr\00E1cticas tradicionales de importancia, entre ellas castrar animales, las marcadas y las hierras.' || E'\n\n' ||
    U&'Se puede notar que he usado una palabra que no es frecuente ver en las invitaciones a esos eventos. Los solemos llamar "yerras". Vamos a recurrir al diccionario para distinguir los significados. Hierra, de herrar: acci\00F3n de marcar con el hierro los ganados; temporada en que se marca el ganado; fiesta que se celebra con tal motivo. Seg\00FAn la Real Academia Espa\00F1ola, yerra es la acci\00F3n de marcar el ganado con hierro caliente, una actividad com\00FAn en el \00E1mbito rural de M\00E9xico, Bolivia, Chile, Paraguay, Argentina y Uruguay, a menudo celebrada como fiesta. Tambi\00E9n es la tercera persona del singular del presente del verbo errar.' || E'\n\n' ||
    U&'En esta oportunidad, vamos a referirnos a la celebraci\00F3n que se realiza en nuestra regi\00F3n, tratando de identificar algunas de sus formas y momentos. Aunque var\00EDan seg\00FAn el \00E1rea de la provincia donde se realizan, su simbolismo es compartido y su utilizaci\00F3n depende de la tradici\00F3n propia de cada familia anfitriona.' || E'\n\n' ||
    U&'Generalmente, esta celebraci\00F3n comienza el d\00EDa anterior, cuando se junta la hacienda y se la encierra en el corral, ya sea que est\00E9 criada a monte o en la serran\00EDa. El primer paso significativo es el desentierro del toro, figura que fuera enterrada en la ofrenda del a\00F1o anterior.' || E'\n\n' ||
    U&'La yista o llipta es un preparado alcalino ancestral, generalmente en forma de pasta o masa s\00F3lida, utilizado en la regi\00F3n andina para el coqueo o masticado de hoja de coca. Se elabora con cenizas de plantas quemadas, cal o ma\00EDz, y sirve para liberar los alcaloides de la coca, mejorando su sabor y efectos.' || E'\n\n' ||
    U&'Con esta masa se prepara una figura de animal vacuno, que representar\00E1 a toda la hacienda convocada. Al ingresarlo al predio se realiza un peque\00F1o acto donde se simula la faena y la despostada, dividi\00E9ndolo simb\00F3licamente en m\00FAltiples porciones que se reparten entre la concurrencia.' || E'\n\n' ||
    U&'La gente se acerca al corral, observa los animales y comienza a campear las hojas de coca. Luego, el due\00F1o de casa se ubica en un lugar portando una yica, bolsa de fibra de chaguar, o alg\00FAn recipiente, donde recibir\00E1 las intenciones de los visitantes. Cada hoja de coca elegida es portadora de un deseo para los due\00F1os de casa y para la hacienda. Al t\00E9rmino de la jornada, esas hojas ser\00E1n entregadas como ofrenda a la Pachamama.' || E'\n\n' ||
    U&'Comienza entonces la actividad en el corral: se enlazan los animales y se los castra, se\00F1ala, marca y enflora. Con el hierro candente se los marca con la forma que representa a la familia o a la finca, s\00EDmbolo de propiedad. Tambi\00E9n se los se\00F1ala mediante cortes en las orejas, lo que indica a qui\00E9n pertenecen dentro de la familia. Luego se los enflora, coloc\00E1ndoles un pomp\00F3n de lana cosido en la oreja, para saber que ese animal ya fue marcado.' || E'\n\n' ||
    U&'En el caso de los machos que no ser\00E1n elegidos para procrear, se realiza el castrado. Este encuentro y juntada de animales se realiza una vez al a\00F1o. Al t\00E9rmino de la faena, se liberan los animales del corral, que r\00E1pidamente buscan el campo.' || E'\n\n' ||
    U&'Muchas veces se produce el "casamiento", que consiste en unir una vaquillona que entrar\00E1 en servicio con un torito nuevo. Se los voltea antes de la suelta, se los ata juntos y se los cubre con el poncho en s\00EDmbolo de intimidad. Luego de los ritos elegidos y acostumbrados en la zona y la familia, se los suelta.' || E'\n\n' ||
    U&'Como cierre de la jornada se realiza la ofrenda a la Pachamama, en un pozo, donde se entregan las ofrendas recibidas por el anfitri\00F3n y las ofrendas personales de los asistentes. Luego se vuelve a colocar y enterrar el toro, que puede ser de diferentes materiales, aunque generalmente es de cer\00E1mica. Este encuentro se convierte en una verdadera fiesta que, en muchos casos, se extiende durante toda la noche.',
    COALESCE(
        (SELECT id FROM public.content_types WHERE code = 'article'),
        (SELECT id FROM public.content_types WHERE code = 'news')
    ),
    COALESCE(
        (SELECT id FROM public.categories WHERE code = 'traditions'),
        (SELECT id FROM public.categories WHERE code = 'culture')
    ),
    (SELECT id FROM public.institutions WHERE slug = 'revista-la-gauchita'),
    NULL,
    (SELECT id FROM public.regions WHERE code = 'noa'),
    (SELECT id FROM public.provinces WHERE code = 'salta'),
    (SELECT id FROM public.municipalities WHERE code = 'salta'),
    NULL,
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
-- 2. Seed Real Recognitions (Batch 3)
-- =========================================================================

-- Recognition 3: Mencion de honor (Eduardo Ceballos 2001)
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
    U&'Menci\00F3n de honor',
    'mencion-de-honor-eduardo-ceballos-2001',
    'homage',
    U&'Homenaje otorgado a Eduardo Ceballos por su trayectoria de vida, por su dedicaci\00F3n al arte folkl\00F3rico y en agradecimiento por permitir continuar con su amistad.',
    U&'Instituto Folkl\00F3rico Argentino Don Mart\00EDn Miguel de G\00FCemes',
    'person',
    '2001-05-10',
    'Salta Capital',
    U&'Menci\00F3n de honor',
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
