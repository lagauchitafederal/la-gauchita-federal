# Especificación del Modelo de Datos V1 — La Gauchita Federal

> [!IMPORTANT]
> Este documento técnico es una especificación de diseño previa para la Versión 1 de la base de datos de **La Gauchita Federal**. 
> **No se deben generar migraciones, scripts SQL reales ni alterar la base de datos en esta fase.**

---

## 1. Principio Central de Filtrado

El portal opera sobre un núcleo funcional obligatorio donde la visualización de datos se condiciona dinámicamente según tres dimensiones:

$$\text{Filtro Contextual} = \text{Fecha Actual} \times \text{Ubicación Seleccionada} \times \text{Nivel de Acceso/Usuario}$$

1. **Fecha Actual**: El contenido solo es visible para el público si `publish_date <= NOW()` y `editorial_status = 'published'`, a menos que el usuario posea privilegios administrativos de edición.
2. **Ubicación Seleccionada**: El contenido puede estar etiquetado para un territorio específico (a nivel municipal, provincial o regional). Si el usuario selecciona una ubicación, el motor de consultas debe retornar el contenido específico de esa localidad, junto con el contenido de jerarquía superior (provincial, regional y nacional/federal) que le aplique.
3. **Nivel de Acceso del Usuario**: La combinación del rol (`UserRole`) y el nivel de membresía (`MembershipLevel`) determina si el usuario tiene autorización para leer publicaciones gratuitas, para miembros adherentes o patrocinadores exclusivos.

---

## 2. Herencia Territorial (GIS y PostGIS)

La plataforma integra geolocalización de alto rendimiento utilizando la extensión espacial **PostGIS** para PostgreSQL.
La jerarquía de herencia territorial es estrictamente ascendente:

$$\text{Municipios / Parajes} \longrightarrow \text{Provincias} \longrightarrow \text{Regiones} \longrightarrow \text{País (Federal)}$$

### Reglas de Diseño Espacial:
- Las entidades geográficas (`regions`, `provinces`, `municipalities`) contienen polígonos georreferenciados (`geometry(MultiPolygon, 4326)`).
- Se implementan **índices espaciales GiST** en todas las columnas geométricas para optimizar búsquedas espaciales en tiempo real (por ejemplo, detectar qué contenidos locales caen dentro de un radio de interés de un usuario utilizando `ST_DWithin` o `ST_Contains`).
- La UI utiliza nombres en español, pero internamente los campos técnicos y códigos de estado utilizan claves estables y estandarizadas en inglés.

---

## 3. Diccionario de Entidades y DDL de Referencia

A continuación se detallan las 22 entidades del sistema con sus correspondientes especificaciones DDL, propósitos y consideraciones de seguridad.

### 3.1. profiles
- **Propósito**: Extiende la tabla nativa de autenticación de Supabase (`auth.users`) con información de perfil público de la plataforma.
- **Relaciones**:
  - `id` referencia a `auth.users(id)` (1:1).
  - `membership_level_id` referencia a `membership_levels(id)` (M:1).

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    membership_level_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```
- **Seguridad**: RLS activo. Lectura pública de perfiles básicos; actualización restringida al propio dueño del perfil (`auth.uid() = id`).

---

### 3.2. roles
- **Propósito**: Catálogo maestro de roles administrativos y de edición disponibles en la plataforma.
- **Campos**:

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- 'super_admin', 'editor', 'institution_admin', 'collaborator'
    name_es TEXT NOT NULL,     -- 'Super Administrador', 'Editor', etc.
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```
- **Seguridad**: RLS activo. Lectura pública; modificación exclusiva por usuarios con rol `'super_admin'`.

---

### 3.3. user_roles
- **Propósito**: Tabla intermedia para la asignación de roles a perfiles de usuario (soporte de múltiples roles por usuario).
- **Relaciones**:
  - `profile_id` referencia a `profiles(id)` (M:1).
  - `role_id` referencia a `roles(id)` (M:1).

```sql
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (profile_id, role_id)
);
```
- **Seguridad**: RLS activo. Lectura para personal autenticado; escritura exclusiva para `'super_admin'`.

---

### 3.4. membership_levels
- **Propósito**: Catálogo maestro de niveles de suscripción de la comunidad.
- **Campos**:

```sql
CREATE TABLE membership_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- 'gratuito', 'adherente', 'patrocinador'
    name_es TEXT NOT NULL,     -- 'Gratuito', 'Miembro Adherente', 'Patrocinador'
    description TEXT,
    price NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```
- **Seguridad**: RLS activo. Lectura pública; escritura exclusiva para `'super_admin'`.

---

### 3.5. regions
- **Propósito**: Regiones geográficas federales que agrupan provincias (ej: Región del NOA).
- **Campos**:

```sql
CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- 'noa', 'nea', 'cuyo', 'patagonia', 'pampeana'
    name TEXT NOT NULL,        -- 'Noroeste Argentino'
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_regions_geom ON regions USING gist(geom);
```
- **Seguridad**: RLS activo. Lectura pública; modificación por administradores espaciales autorizados.

---

### 3.6. provinces
- **Propósito**: Provincias de la República Argentina.
- **Relaciones**:
  - `region_id` referencia a `regions(id)` (M:1).

```sql
CREATE TABLE provinces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID REFERENCES regions(id) ON DELETE RESTRICT NOT NULL,
    code TEXT UNIQUE NOT NULL, -- 'AR-A', 'AR-S', etc. (códigos ISO)
    name TEXT NOT NULL,        -- 'Salta'
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_provinces_geom ON provinces USING gist(geom);
```
- **Seguridad**: RLS activo. Lectura pública; modificación por administradores.

---

### 3.7. municipalities
- **Propósito**: Municipios, localidades y parajes específicos del país.
- **Relaciones**:
  - `province_id` referencia a `provinces(id)` (M:1).

```sql
CREATE TABLE municipalities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    province_id UUID REFERENCES provinces(id) ON DELETE RESTRICT NOT NULL,
    code TEXT UNIQUE NOT NULL, -- Código INDEC
    name TEXT NOT NULL,        -- 'San Lorenzo'
    geom GEOMETRY(MultiPolygon, 4326),
    centroid GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_municipalities_geom ON municipalities USING gist(geom);
CREATE INDEX idx_municipalities_centroid ON municipalities USING gist(centroid);
```
- **Seguridad**: RLS activo. Lectura pública; modificación administrativa.

---

### 3.8. categories
- **Propósito**: Categorización temática del material del portal (Comidas, Tradiciones, Historia, etc.).
- **Campos**:

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- 'comidas_regionales', 'tradiciones', 'efemerides'
    name_es TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```
- **Seguridad**: RLS activo. Lectura pública; modificación exclusiva de editores y administradores.

---

### 3.9. content_types
- **Propósito**: Clasificación estructural de las publicaciones.
- **Campos**:

```sql
CREATE TABLE content_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- 'news', 'article', 'recipe', 'documentary'
    name_es TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```
- **Seguridad**: RLS activo. Lectura pública; modificación administrativa.

---

### 3.10. contents
- **Propósito**: Tabla central de publicaciones, efemérides, tradiciones y notas editoriales.
- **Relaciones**:
  - `content_type_id` referencia a `content_types(id)` (M:1).
  - `category_id` referencia a `categories(id)` (M:1).
  - `author_id` referencia a `profiles(id)` (M:1).
  - `municipality_id`, `province_id`, `region_id` (Opcionales) proveen la localización geo-targeteada del contenido.

```sql
CREATE TABLE contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type_id UUID REFERENCES content_types(id) NOT NULL,
    category_id UUID REFERENCES categories(id) NOT NULL,
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    body TEXT NOT NULL,
    editorial_status TEXT NOT NULL CHECK (editorial_status IN ('draft', 'review', 'published', 'archived')),
    publish_date TIMESTAMPTZ,
    min_access_level TEXT NOT NULL CHECK (min_access_level IN ('public', 'member', 'exclusive')),
    municipality_id UUID REFERENCES municipalities(id) ON DELETE SET NULL,
    province_id UUID REFERENCES provinces(id) ON DELETE SET NULL,
    region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_contents_slug ON contents(slug);
CREATE INDEX idx_contents_status_date ON contents(editorial_status, publish_date);
```
- **Seguridad**: RLS activo. La política de lectura para usuarios no-editores restringe la visibilidad a `editorial_status = 'published' AND publish_date <= NOW()`. Los autores y editores pueden ver borradores según su rol.

---

### 3.11. ephemerides
- **Propósito**: Eventos históricos fechados por día/mes para efemérides federales y regionales.
- **Relaciones**:
  - `municipality_id`, `province_id` (Opcionales) heredan alcance territorial.

```sql
CREATE TABLE ephemerides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day INTEGER NOT NULL CHECK (day BETWEEN 1 AND 31),
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    historical_year INTEGER,
    municipality_id UUID REFERENCES municipalities(id) ON DELETE SET NULL,
    province_id UUID REFERENCES provinces(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_ephemerides_date ON ephemerides(month, day);
```
- **Seguridad**: RLS activo. Lectura pública general; escritura restringida a editores.

---

### 3.12. people
- **Propósito**: Registro de personajes históricos, pioneros y referentes de la cultura andina y federal.
- **Relaciones**:
  - `birth_place_id` referencia a `places(id)` (M:1).

```sql
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    birth_date DATE,
    death_date DATE,
    birth_place_id UUID, -- Referencia diferida a table places
    bio TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```
- **Seguridad**: RLS activo. Lectura pública; escritura para editores.

---

### 3.13. places
- **Propósito**: Puntos de interés histórico, geográfico, museos y patrimonio andino georreferenciados.
- **Relaciones**:
  - `municipality_id` referencia a `municipalities(id)` (M:1).

```sql
CREATE TABLE places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    municipality_id UUID REFERENCES municipalities(id) ON DELETE RESTRICT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_places_geom ON places USING gist(geom);
```
- **Seguridad**: RLS activo. Lectura pública; modificación por personal del portal.

---

### 3.14. institutions
- **Propósito**: Registro de municipios adherentes, escuelas, bibliotecas y museos colaboradores.
- **Relaciones**:
  - `municipality_id` referencia a `municipalities(id)` (M:1).

```sql
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('municipality', 'library', 'museum', 'school', 'media_partner', 'cultural_assoc')),
    municipality_id UUID REFERENCES municipalities(id) ON DELETE RESTRICT NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```
- **Seguridad**: RLS activo. Lectura pública; edición para administradores del portal y administradores institucionales delegados.

---

### 3.15. institution_users
- **Propósito**: Asignación y gestión de personal autorizado por cada institución para publicar contenidos.
- **Relaciones**:
  - `institution_id` referencia a `institutions(id)` (M:1).
  - `profile_id` referencia a `profiles(id)` (M:1).

```sql
CREATE TABLE institution_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'editor')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (institution_id, profile_id)
);
```
- **Seguridad**: RLS activo. Lectura restringida a personal de la institución; escritura exclusiva para administradores del portal o administradores de la propia institución.

---

### 3.16. recognitions
- **Propósito**: Premios, menciones y distinciones otorgadas a la trayectoria y patrimonio.
- **Relaciones**:
  - `institution_id` (Opcional) referencia a la institución otorgante.
  - `municipality_id` referencia territorial obligatoria.

```sql
CREATE TABLE recognitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    recipient TEXT NOT NULL,
    scope TEXT NOT NULL CHECK (scope IN ('local', 'provincial', 'national', 'international')),
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    municipality_id UUID REFERENCES municipalities(id) ON DELETE RESTRICT NOT NULL,
    award_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```
- **Seguridad**: RLS activo. Lectura pública; edición por administradores de instituciones o del portal.

---

### 3.17. magazine_editions
- **Propósito**: Ediciones digitales mensuales de la clásica "Revista La Gauchita".
- **Campos**:

```sql
CREATE TABLE magazine_editions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    edition_number INTEGER UNIQUE NOT NULL,
    title TEXT NOT NULL,
    publish_date DATE NOT NULL,
    cover_url TEXT,
    pdf_url TEXT,
    is_free BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_magazine_editions_number ON magazine_editions(edition_number);
```
- **Seguridad**: RLS activo. Lectura pública general si `is_free = true`. Si `is_free = false`, requiere validación de `MembershipLevel` en la política de visualización.

---

### 3.18. publications
- **Propósito**: Artículos o capítulos específicos extraídos de las ediciones impresas y digitales de la revista.
- **Relaciones**:
  - `magazine_edition_id` (Opcional) referencia a la edición madre.

```sql
CREATE TABLE publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    summary TEXT,
    body TEXT NOT NULL,
    magazine_edition_id UUID REFERENCES magazine_editions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```
- **Seguridad**: RLS activo. Las políticas se alinean con la edición de la revista vinculada (`magazine_edition_id`).

---

### 3.19. media_assets
- **Propósito**: Centralización de archivos multimedia (imágenes, documentos, audios) para reutilización en el CMS.
- **Relaciones**:
  - `uploaded_by` referencia a `profiles(id)` (M:1).

```sql
CREATE TABLE media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Ruta interna en Supabase Storage
    file_type TEXT NOT NULL, -- MIME Type
    size_bytes INTEGER NOT NULL,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```
- **Seguridad**: RLS activo. Lectura pública; inserción y eliminación limitada a creadores de contenido autenticados.

---

### 3.20. views
- **Propósito**: Auditoría no-identificada y estadísticas de lectura agregadas para reportes federales.
- **Relaciones**:
  - `content_id` referencia a `contents(id)` (M:1).
  - `profile_id` (Opcional) referencia a `profiles(id)` (M:1).

```sql
CREATE TABLE views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ip_hash TEXT NOT NULL, -- Almacenamiento seguro anonimizado
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_views_content ON views(content_id);
```
- **Seguridad**: RLS activo. Inserción permitida al público (anonimizada); lectura restringida a editores y autores para estadísticas.

---

### 3.21. likes
- **Propósito**: Mecanismo de interacción comunitaria de contenidos ("Me gusta").
- **Relaciones**:
  - `content_id` referencia a `contents(id)` (M:1).
  - `profile_id` referencia a `profiles(id)` (M:1).

```sql
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (content_id, profile_id)
);
```
- **Seguridad**: RLS activo. Inserción y eliminación permitida solo si `profile_id = auth.uid()`. Lectura agregada pública.

---

### 3.22. audit_logs
- **Propósito**: Trazabilidad y auditoría de acciones administrativas en el CMS.
- **Relaciones**:
  - `profile_id` referencia a `profiles(id)` (M:1).

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,     -- 'INSERT', 'UPDATE', 'DELETE'
    table_name TEXT NOT NULL, -- Nombre de la tabla afectada
    record_id UUID NOT NULL,  -- ID del registro afectado
    old_values JSONB,         -- Estado anterior
    new_values JSONB,         -- Estado posterior
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
```
- **Seguridad**: RLS activo. Escritura realizada mediante triggers de PostgreSQL a nivel del sistema; lectura restringida a `'super_admin'`.
