-- Migration 0014: Fix Spanish accents and special characters in public data
-- Project: La Gauchita Federal
-- Scope: public.institutions, public.contents, public.recognitions
-- Note: ASCII-safe SQL using PostgreSQL Unicode escape strings.

UPDATE public.institutions
SET name = 'Revista La Gauchita',
    description = U&'Revista Salte\00F1a Coleccionable',
    address = U&'Manuela Gonz\00E1lez de Todd 930',
    updated_at = now()
WHERE slug = 'revista-la-gauchita';

UPDATE public.institutions
SET name = 'Instituto Cultural Andino',
    description = U&'Producci\00F3n de libros, revistas y productos culturales',
    address = U&'Manuela Gonz\00E1lez de Todd 930',
    updated_at = now()
WHERE slug = 'instituto-cultural-andino';

UPDATE public.contents
SET title = '7 de julio de 1923',
    subtitle = U&'Eduardo Fal\00FA',
    summary = U&'Naci\00F3 en El Galp\00F3n, provincia de Salta, el guitarrista Eduardo Fal\00FA.',
    body = U&'Mundialmente conocido por su obra musical y por su calidad interpretativa. Compuso con Jaime D\00E1valos, Manuel J. Castilla, Ernesto S\00E1bato, C\00E9sar Perdiguer, Jos\00E9 R\00EDos, Hugo Alarc\00F3n, entre muchos otros poetas. Entre sus \00E9xitos m\00E1s reconocidos se encuentran: La Atardecida, La ni\00F1a, La nostalgiosa, Las golondrinas, La volvedora, No te puedo olvidar, Tabacalera, Tonada del viejo amor y Zamba de la Candelaria.',
    source_reference = U&'Libro: Conozca Salta a trav\00E9s de sus Efem\00E9rides',
    updated_at = now()
WHERE slug = '7-de-julio-de-1923-eduardo-falu';

UPDATE public.contents
SET title = U&'GRAN PE\00D1A HOMENAJE EN VIDA',
    subtitle = U&'Homenaje a referentes de la cultura salte\00F1a',
    summary = U&'Gran cena pe\00F1a homenaje impulsada por la cantora popular Claudia Vilte, con la participaci\00F3n de artistas invitados y referentes culturales de Salta.',
    body = U&'Por iniciativa de la reconocida cantora popular Claudia Vilte, se realizar\00E1 el s\00E1bado 13 de junio una gran cena pe\00F1a homenaje, en las instalaciones del Centro Argentino, de avenida Sarmiento, con el aval de su presidente, el cantor Juan Rueda. Entre los homenajeados se encuentran Rodolfo Aredes, el pap\00E1 de Pepito; Eduardo Ceballos; el hist\00F3rico cantor de tangos Hugo Cardozo; el conductor de programas televisivos Carlos Rodolfo L\00F3pez V\00E9lez; el gestor cultural Lito Cardozo; y el matrimonio conformado por Teresita y Rodolfo "Supay" Soria, propietarios de Radio Santa Teresita, que pregonan la cultura de Salta. Ser\00E1 una noche m\00E1gica con la actuaci\00F3n de artistas invitados entre los que se destacan Juan Rueda "El Andariego", Claudia Vilte, Grupo Quinoa, Chicha Guanca, Ballet Aromas de Salta, Guitarm\00F3n, Agust\00EDn Villaverde, Chichichi Villaroel, Marta Rold\00E1n y Turco Apud. Habr\00E1 pista de baile para disfrutar de nuestra m\00FAsica hasta las 5 de la madrugada. Ser\00E1 una noche muy especial para aplaudir a nuestros referentes, gente que hizo historia con su aporte.',
    source_reference = 'Revista La Gauchita',
    updated_at = now()
WHERE slug = 'gran-pena-homenaje-en-vida';

UPDATE public.contents
SET title = U&'EFEM\00C9RIDES HIST\00D3RICAS Y CULTURALES DEL NOROESTE ARGENTINO',
    subtitle = U&'Presentaci\00F3n en la 50 Feria Internacional del Libro de Buenos Aires',
    summary = U&'En la 50 Feria Internacional del Libro de Buenos Aires se present\00F3 la obra Efem\00E9rides Hist\00F3ricas y Culturales del Noroeste Argentino, de Eduardo Ceballos.',
    body = U&'La obra "Efem\00E9rides Hist\00F3ricas y Culturales del Noroeste Argentino", de Eduardo Ceballos, fue presentada en la 50 Feria Internacional del Libro de Buenos Aires, el mi\00E9rcoles 29 de abril de 2026, a las 21 horas, en el Stand Norte Cultura, Pabell\00F3n Ocre. La publicaci\00F3n est\00E1 integrada por dos tomos: el tomo I, de 316 p\00E1ginas, y el tomo II, de 462 p\00E1ginas, con un total de 778 p\00E1ginas en formato 20 x 27 cent\00EDmetros. Incluye referencias a m\00E1s de 4.000 escritores de La Rioja, Catamarca, Tucum\00E1n, Santiago del Estero, Jujuy y Salta. El trabajo constituye un aporte para conocer mejor la historia cultural del NOA y da continuidad al Diccionario Cultural del Noroeste Argentino. La presentaci\00F3n cont\00F3 con la presencia de amigos, escritores y artistas que acompa\00F1aron al autor. Entre ellos se destacaron el doctor Carlos Mar\00EDa Romero Sosa, uno de los prologuistas de la obra, y el reconocido cantor popular Zamba Quipildor, embajador art\00EDstico de la patria e int\00E9rprete de la Misa Criolla en distintos escenarios del mundo.',
    source_reference = 'Revista La Gauchita',
    updated_at = now()
WHERE slug = 'efemerides-historicas-culturales-noroeste-argentino';

UPDATE public.recognitions
SET title = U&'Declaraci\00F3n de inter\00E9s al Diccionario Cultural del Noroeste Argentino',
    description = U&'Declarar de inter\00E9s de esta C\00E1mara el "Diccionario Cultural del Noroeste Argentino" del escritor salte\00F1o Eduardo Ceballos, obra de investigaci\00F3n que conforma una interesante y completa variedad de biograf\00EDas y resume la producci\00F3n cultural de las seis provincias que conforman la Regi\00F3n Noroeste Argentino.',
    granting_institution_name = U&'C\00E1mara de Diputados de la Provincia de Salta',
    document_reference = 'Res. Nro. 378/21',
    source_reference = U&'Res. Nro. 378/21 - C\00E1mara de Diputados de la Provincia de Salta',
    updated_at = now()
WHERE slug = 'declaracion-interes-diccionario-cultural-noroeste-argentino';

UPDATE public.recognitions
SET title = 'Premio Patria',
    description = U&'Distinci\00F3n otorgada por el apoyo brindado para destacar a los m\00E1s importantes valores de nuestra cultura.',
    granting_institution_name = 'Radiodifusora FM Patria 90.3 MHz.',
    document_reference = U&'Distinci\00F3n',
    source_reference = 'Eduardo Ceballos - Revista La Gauchita',
    updated_at = now()
WHERE slug = 'premio-patria-2000';
