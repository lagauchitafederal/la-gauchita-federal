-- Migration 0002: Seed base catalog tables
-- Project: La Gauchita Federal
-- Scope: regions, provinces, municipalities, roles, membership_levels, categories, content_types
-- Notes:
-- - This migration inserts only non-sensitive catalog data.
-- - No users, profiles, auth records, storage buckets or real contents are created.
-- - Codes and slugs use stable technical values in English.
-- - Descriptions avoid special characters to prevent encoding issues.
-- - This migration must be applied after 0001_create_catalog_tables.sql.

-- =========================================================================
-- 1. Seed regions
-- =========================================================================

INSERT INTO regions (code, name, slug, description, sort_order)
VALUES
('noa', 'Noroeste Argentino', 'noa', 'Region cultural e historica del noroeste argentino', 1)
ON CONFLICT (code) DO UPDATE SET
name = EXCLUDED.name,
slug = EXCLUDED.slug,
description = EXCLUDED.description,
sort_order = EXCLUDED.sort_order,
updated_at = now();

-- =========================================================================
-- 2. Seed provinces
-- =========================================================================

INSERT INTO provinces (region_id, code, name, slug, description, sort_order)
VALUES
(
(SELECT id FROM regions WHERE code = 'noa'),
'salta',
'Salta',
'salta',
'Provincia de Salta',
1
)
ON CONFLICT (code) DO UPDATE SET
region_id = EXCLUDED.region_id,
name = EXCLUDED.name,
slug = EXCLUDED.slug,
description = EXCLUDED.description,
sort_order = EXCLUDED.sort_order,
updated_at = now();

-- =========================================================================
-- 3. Seed municipalities
-- =========================================================================

INSERT INTO municipalities (province_id, code, name, slug, description, latitude, longitude, is_capital, sort_order)
VALUES
(
(SELECT id FROM provinces WHERE code = 'salta'),
'salta',
'Salta',
'salta',
'Ciudad de Salta',
-24.7829,
-65.4232,
true,
1
),
(
(SELECT id FROM provinces WHERE code = 'salta'),
'la-silleta',
'La Silleta',
'la-silleta',
'Localidad de La Silleta',
NULL,
NULL,
false,
2
),
(
(SELECT id FROM provinces WHERE code = 'salta'),
'campo-quijano',
'Campo Quijano',
'campo-quijano',
'Municipio de Campo Quijano',
NULL,
NULL,
false,
3
)
ON CONFLICT (code) DO UPDATE SET
province_id = EXCLUDED.province_id,
name = EXCLUDED.name,
slug = EXCLUDED.slug,
description = EXCLUDED.description,
latitude = EXCLUDED.latitude,
longitude = EXCLUDED.longitude,
is_capital = EXCLUDED.is_capital,
sort_order = EXCLUDED.sort_order,
updated_at = now();

-- =========================================================================
-- 4. Seed roles
-- =========================================================================

INSERT INTO roles (code, name, description, is_system_role, sort_order)
VALUES
('visitor', 'Visitante', 'Usuario no autenticado con acceso publico basico', true, 1),
('subscriber', 'Suscriptor', 'Usuario registrado con acceso ampliado segun membresia', true, 2),
('cultural_collaborator', 'Colaborador Cultural', 'Usuario autorizado para proponer contenidos culturales bajo revision', true, 3),
('validated_institution', 'Institucion Validada', 'Institucion participante con identidad verificada', true, 4),
('reviewer', 'Revisor', 'Usuario autorizado para revisar contenidos y emitir observaciones', true, 5),
('municipal_editor', 'Editor Municipal', 'Editor con alcance territorial municipal', true, 6),
('provincial_editor', 'Editor Provincial', 'Editor con alcance territorial provincial', true, 7),
('federal_editor', 'Editor Federal', 'Editor con alcance federal o nacional', true, 8),
('general_admin', 'Administrador General', 'Administrador operativo del sistema', true, 9),
('super_admin', 'Super Administrador', 'Administrador tecnico con control total del sistema', true, 10)
ON CONFLICT (code) DO UPDATE SET
name = EXCLUDED.name,
description = EXCLUDED.description,
is_system_role = EXCLUDED.is_system_role,
sort_order = EXCLUDED.sort_order,
updated_at = now();

-- =========================================================================
-- 5. Seed membership levels
-- =========================================================================

INSERT INTO membership_levels (code, name, description, price, currency, benefits, sort_order)
VALUES
(
'public',
'Publico',
'Acceso publico sin registro',
0.00,
'ARS',
'[]'::jsonb,
1
),
(
'free_subscriber',
'Suscriptor Gratuito',
'Usuario registrado con acceso gratuito a contenidos abiertos',
0.00,
'ARS',
'["newsletter", "basic_profile"]'::jsonb,
2
),
(
'friend',
'Amigo de La Gauchita',
'Nivel de apoyo comunitario inicial',
0.00,
'ARS',
'["community_support", "subscriber_content"]'::jsonb,
3
),
(
'cultural_collaborator',
'Colaborador Cultural',
'Nivel orientado a personas que aportan contenidos culturales bajo revision',
0.00,
'ARS',
'["content_submission", "collaborator_profile"]'::jsonb,
4
),
(
'history_patron',
'Mecenas de la Historia',
'Nivel futuro para patrocinadores culturales e historicos',
0.00,
'ARS',
'["patron_visibility", "special_recognition"]'::jsonb,
5
)
ON CONFLICT (code) DO UPDATE SET
name = EXCLUDED.name,
description = EXCLUDED.description,
price = EXCLUDED.price,
currency = EXCLUDED.currency,
benefits = EXCLUDED.benefits,
sort_order = EXCLUDED.sort_order,
updated_at = now();

-- =========================================================================
-- 6. Seed categories
-- =========================================================================

INSERT INTO categories (code, name, slug, description, sort_order)
VALUES
('history', 'Historia', 'history', 'Notas historicas y efemerides nacionales', 1),
('culture', 'Cultura', 'culture', 'Expresiones artisticas y patrimoniales', 2),
('folklore', 'Folklore', 'folklore', 'Musica, danzas y mitos tradicionales', 3),
('traditions', 'Tradiciones', 'traditions', 'Costumbres y festividades regionales', 4),
('gastronomy', 'Gastronomia', 'gastronomy', 'Recetas y comidas tipicas regionales', 5),
('heritage', 'Patrimonio', 'heritage', 'Monumentos, museos y reservas historicas', 6),
('education', 'Educacion', 'education', 'Material didactico y cartelera docente', 7),
('magazine', 'Revista', 'magazine', 'Articulos y publicaciones de la revista digital', 8),
('institutional', 'Institucional', 'institutional', 'Informacion sobre municipios, bibliotecas e instituciones participantes', 9),
('recognitions', 'Reconocimientos', 'recognitions', 'Premios y distinciones otorgadas', 10)
ON CONFLICT (code) DO UPDATE SET
name = EXCLUDED.name,
slug = EXCLUDED.slug,
description = EXCLUDED.description,
sort_order = EXCLUDED.sort_order,
updated_at = now();

-- =========================================================================
-- 7. Seed content types
-- =========================================================================

INSERT INTO content_types (code, name, slug, description, sort_order)
VALUES
('article', 'Articulo', 'articulo', 'Contenido editorial general', 1),
('news', 'Noticia', 'noticia', 'Noticia cultural o institucional', 2),
('ephemeris', 'Efemeride', 'efemeride', 'Contenido asociado a una fecha historica o cultural', 3),
('person_profile', 'Personaje', 'personaje', 'Perfil de persona historica, cultural o artistica', 4),
('place_profile', 'Lugar', 'lugar', 'Perfil de lugar historico, patrimonial o cultural', 5),
('teacher_resource', 'Recurso Docente', 'recurso-docente', 'Material educativo para docentes y estudiantes', 6),
('magazine_article', 'Articulo de Revista', 'articulo-revista', 'Articulo perteneciente a una edicion de revista', 7),
('institutional_content', 'Contenido Institucional', 'contenido-institucional', 'Contenido vinculado a instituciones participantes', 8),
('recognition', 'Reconocimiento', 'reconocimiento', 'Premio, distincion o mencion institucional', 9),
('event', 'Evento', 'evento', 'Actividad cultural, educativa o institucional', 10)
ON CONFLICT (code) DO UPDATE SET
name = EXCLUDED.name,
slug = EXCLUDED.slug,
description = EXCLUDED.description,
sort_order = EXCLUDED.sort_order,
updated_at = now();
