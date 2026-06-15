# Revision de Seguridad de Medios y Almacenamiento (pre-migracion) — La Gauchita Federal

> [!IMPORTANT]
> Este documento tecnico define la especificacion conceptual para la gestion de archivos digitales y politicas de seguridad en Supabase Storage.
> **No se deben generar archivos `.sql` reales, crear buckets en la nube, ni alterar la base de datos en esta tarea.**

---

## 1. Proposito del Modelo de Medios y Archivos

El sistema de gestion de medios de **La Gauchita Federal** centraliza la administracion de activos digitales (imagenes de alta definicion, fotografias historicas digitalizadas, PDFs de la revista, documentos docentes e institucionales). El objetivo es asegurar un almacenamiento optimizado que proteja los derechos de autor, impida la carga de archivos nocivos y restrinja de manera segura el acceso a las ediciones premium de la revista digital mediante politicas de Supabase Storage RLS.

---

## 2. Tipos de Archivos Soportados

La plataforma preve soporte y clasificacion para las siguientes tipologias de archivos:
* **Imagenes de Portada**: Banners principales de articulos y home.
* **Imagenes de Contenido**: Ilustraciones insertas en el cuerpo del texto.
* **Fotografias Historicas**: Archivo documental digitalizado de valor patrimonial.
* **Documentos PDF**: Hojas de ruta, reglamentos y publicaciones sueltas.
* **Revistas Digitales**: Ediciones completas de la Revista La Gauchita en PDF.
* **Libros Digitales**: Publicaciones y ensayos historicos de Eduardo Ceballos y colaboradores.
* **Audios**: Entrevistas, musica folklore y registros de folklore oral.
* **Material Docente**: Planificaciones, secuencias didacticas y guias de estudio.
* **Documentos Institucionales**: Resoluciones de municipios o actas de bibliotecas.
* **Constancias y Premios**: PDF/Imagen de reconocimientos otorgados.
* **Material de Archivo**: Documentos historicos escaneados de acceso restringido.

---

## 3. Estructura Sugerida de Campos: Tabla `media_assets`

Para indexar y controlar el acceso a los archivos fisicos de Supabase Storage, se utilizara la tabla `media_assets`:

* `id` (UUID, PK, default `gen_random_uuid()`): Identificador de la base de datos.
* `content_id` (UUID, FK a `contents(id)`, opcional): Relacion con la publicacion que contiene el activo.
* `institution_id` (UUID, FK a `institutions(id)`, opcional): Institucion propietaria.
* `uploaded_by_profile_id` (UUID, FK a `profiles(id)`, obligatorio): Usuario que realizo la carga.
* `title` (TEXT, obligatorio): Nombre o titulo del archivo.
* `description` (TEXT, opcional): Resumen o pie de foto.
* `asset_type` (TEXT, obligatorio): Clasificacion del activo.
* `bucket_name` (TEXT, obligatorio): Nombre del bucket de Supabase (`public-media`, `private-media`, etc.).
* `storage_path` (TEXT, obligatorio, unique): Ruta fisica del objeto en el bucket (object name).
* `mime_type` (TEXT, obligatorio): Tipo MIME del archivo (ej. `image/jpeg`, `application/pdf`).
* `file_size_bytes` (BIGINT, obligatorio): Tamaño del archivo en bytes.
* `original_filename` (TEXT, obligatorio): Nombre original de carga.
* `alt_text` (TEXT, opcional): Texto alternativo para accesibilidad visual.
* `credit` (TEXT, opcional): Creditos de la fotografia o autoria.
* `source_reference` (TEXT, opcional): Procedencia del material (ej. Archivo ICA).
* `rights_status` (TEXT, obligatorio, default `'pending_review'`): Estado de derechos de propiedad.
* `visibility` (TEXT, obligatorio, default `'public'`): Nivel de acceso al archivo.
* `status` (TEXT, obligatorio, default `'draft'`): Estado de moderacion.
* `sort_order` (INTEGER, default 0): Orden de despliegue en galerias.
* `created_at` (TIMESTAMPTZ, default `now()`).
* `updated_at` (TIMESTAMPTZ, default `now()`).

### 3.1. Valores para `asset_type`
`cover_image`, `content_image`, `gallery_image`, `historical_photo`, `pdf_document`, `magazine_pdf`, `book_pdf`, `audio`, `teacher_resource`, `institutional_document`, `recognition_document`, `archive_material`, `other`.

### 3.2. Valores para `rights_status`
`owned` (propietario/editorial), `authorized` (autorizado por autor), `public_domain` (dominio publico), `licensed` (bajo licencia comercial), `pending_review` (pendiente de validacion), `restricted` (restringido), `unknown` (desconocido).

### 3.3. Valores para `visibility`
`public`, `subscribers`, `institutional`, `private`.

### 3.4. Valores para `status`
`draft` (borrador/no visible), `review` (en revision editorial), `active` (visible/activo), `archived` (archivado/historico), `rejected` (rechazado).

---

## 4. Riesgos de Seguridad de Almacenamiento

- **Exposicion Publica de Archivos Privados**: Acceso directo mediante URL publicas a PDFs de la revista premium (Mitigacion: Almacenar en bucket privado y consumir via URLs firmadas con tiempo de expiracion acotado).
- **Carga de Archivos sin Autorizacion**: Carga masiva de binarios por usuarios anonimos (Mitigacion: Politicas RLS estrictas en Supabase Storage).
- **Fotografias e Imagenes sin Derechos**: Publicacion de material protegido sin autorizacion (Mitigacion: Flujo de moderacion `'review'` forzoso para activos de colaboradores).
- **Archivos Maliciosos**: Carga de scripts ejecutables camuflados como imagenes o PDFs (Mitigacion: Control de extension y MIME Type estricto, sandboxing de visualizacion).
- **PDFs Sobre-dimensionados**: Carga de revistas sin optimizar (+100MB) que saturen el ancho de banda (Mitigacion: Limitacion de peso en frontend y validacion de tamaño maximo en politicas de Storage de Supabase).
- **Eliminacion Indebida de Material de Archivo**: Borrado fisico de fotos historicas (Mitigacion: Restringir `DELETE` de Storage al super_admin; utilizar marcas logicas en base de datos).
- **Cargas fuera del Alcance**: Usuarios institucionales subiendo logos o PDFs a carpetas de otra escuela (Mitigacion: Rutas con prefijo de `institution_id` validadas por RLS).

---

## 5. Estrategia de Supabase Storage

### 5.1. Estructura de Buckets Propuesta
1. **`public-media`**: Almacenamiento publico general (portadas, imagenes de contenido, recursos docentes gratuitos).
2. **`private-media`**: PDFs de revistas premium, libros protegidos y material historico restringido. Acceso exclusivo mediante URLs firmadas temporales (ej: expiracion a los 5 minutos).
3. **`editorial-review`**: Zona temporal para la carga de colaboraciones que se encuentran en estado de revision y moderacion por editores.

### 5.2. Convencion de Rutas (Object Naming)
Las rutas dentro de los buckets se organizaran con prefijos logicos estructurados para evitar colisiones:
- Public: `public-media/institutions/{institution_id}/{asset_type}/{uuid_filename}`
- Public Content: `public-media/contents/{content_type}/{year}/{month}/{uuid_filename}`
- Private: `private-media/magazine/editions/{edition_number}/{uuid_filename}`

Los nombres originales de los archivos se almacenaran en `original_filename` de la base de datos, pero el objeto fisico se renombrara usando un identificador UUID para evitar ataques de inyeccion de nombres de rutas (Path Traversal).

---

## 6. Criterios de Seguridad y RLS Futuros

### 6.1. Politicas de Lectura en Storage y Base de Datos
- **Anonimos (`anon`)**: Solo lectura de objetos en `public-media`. No acceden a `private-media` ni `editorial-review`.
- **Subscriptores (`subscriber`)**: Acceso a `private-media` condicionado a poseer una suscripcion compatible (`MembershipLevel`) en base de datos.
- **Autores**: Pueden ver objetos subidos por si mismos en `editorial-review` (`uploaded_by_profile_id = auth.uid()`).
- **Editores Territoriales**: Lectura de objetos en moderacion editorial asociados a su jurisdiccion.

### 6.2. Criterios de Subida (Upload Policies)
- Carga permitida **exclusivamente a usuarios autenticados** con perfil activo y roles autorizados.
- **Validacion de Peso y Formato**: Las politicas de Storage de Supabase controlaran el tamaño de archivo (`content_length <= 25165824` para 24MB en PDFs, y `content_length <= 5242880` para 5MB en imagenes) y validaran que el MIME Type coincida con el catalogado.

---

## 7. Proximos Pasos

Esta revision no crea tablas ni buckets de almacenamiento. La proxima migracion a redactar se denominará:

```txt
supabase/migrations/0006_create_media_assets.sql
```
Esta migración se encargará de crear fisicamente la tabla `media_assets`, configurar los indices de rendimiento de rutas de almacenamiento y habilitar el aislamiento RLS preliminar en base de datos.
