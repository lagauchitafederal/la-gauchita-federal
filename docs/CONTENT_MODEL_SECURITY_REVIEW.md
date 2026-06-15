# Revision de Seguridad del Modelo de Contenidos (pre-migracion) — La Gauchita Federal

> [!IMPORTANT]
> Este documento tecnico es una especificacion de diseño de seguridad y datos previa a la creacion de las tablas de contenidos del CMS.
> **No se deben generar archivos `.sql` reales, ejecutar Supabase CLI ni alterar la base de datos en esta tarea.**

---

## 1. Analisis del Modelo de Contenidos

### 1.1. Proposito General
El modelo de contenidos de **La Gauchita Federal** representa el nucleo de informacion cultural, historica, pedagogica e institucional de la plataforma. La tabla principal `contents` centraliza todas las publicaciones editoriales del portal, unificando bajo un mismo esquema modular entidades como efemerides, noticias, articulos de revista y recursos docentes, condicionando su visualizacion dinamicamente mediante el filtro context-core (Fecha + Territorio + Acceso).

### 1.2. Estructura Sugerida de Campos para la Tabla `contents`
* `id` (UUID, PK, default `gen_random_uuid()`): Identificador unico del contenido.
* `title` (TEXT, obligatorio): Titulo principal.
* `slug` (TEXT, obligatorio, unique): URL amigable indexable.
* `subtitle` (TEXT, opcional): Bajada de titulo o copete.
* `summary` (TEXT, opcional): Resumen breve para listados y SEO.
* `body` (TEXT, obligatorio): Cuerpo enriquecido del articulo.
* `content_type_id` (UUID, FK a `content_types(id)`, obligatorio): Tipo de publicacion.
* `category_id` (UUID, FK a `categories(id)`, obligatorio): Categoria tematica.
* `institution_id` (UUID, FK a `institutions(id)`, opcional): Institucion creadora o vinculada.
* `author_profile_id` (UUID, FK a `profiles(id)`, opcional): Perfil del autor.
* `region_id` (UUID, FK a `regions(id)`, opcional): Alcance regional.
* `province_id` (UUID, FK a `provinces(id)`, opcional): Alcance provincial.
* `municipality_id` (UUID, FK a `municipalities(id)`, opcional): Alcance municipal/local.
* `event_date` (TIMESTAMPTZ, opcional): Fecha del evento para carteleras o calendario.
* `publish_date` (TIMESTAMPTZ, opcional): Fecha programada de publicacion.
* `status` (TEXT, obligatorio, default `'draft'`): Estado de moderacion editorial.
* `visibility` (TEXT, obligatorio, default `'public'`): Nivel de acceso requerido.
* `is_featured` (BOOLEAN, obligatorio, default `false`): Destacado en carruseles.
* `source_reference` (TEXT, opcional): Cita bibliografica o fuente documental.
* `created_at` (TIMESTAMPTZ, default `now()`).
* `updated_at` (TIMESTAMPTZ, default `now()`).

### 1.3. Estados Editoriales Sugeridos (`status`)
- **`draft`**: Borrador del autor. Solo visible para el creador y editores asignados.
- **`review`**: Enviado a moderacion. Listo para ser evaluado por revisores o editores.
- **`published`**: Aprobado y visible publicamente (si la fecha de publicacion es pasada y segun visibilidad).
- **`archived`**: Retirado del portal publico pero preservado para consultas historicas internas.
- **`rejected`**: Rechazado por moderacion con comentarios de cambio. Devuelto al autor.

### 1.4. Niveles de Visibilidad Sugeridos (`visibility`)
- **`public`**: Accesible por cualquier visitante del portal (anonimo o registrado).
- **`subscribers`**: Restringido a usuarios autenticados con suscripciones activas (`membership_levels`).
- **`institutional`**: Exclusivo para miembros validados de la institucion creadora (`institution_members`).
- **`private`**: Reservado exclusivamente para autores y administradores.

---

## 2. Reglas Editoriales del CMS

1. **Aprobacion Previa Obligatoria**: Ningun contenido de caracter publico (`visibility = 'public'`) puede ser leido por usuarios anonimos o subscriptores basicos a menos que `status = 'published'` y `publish_date <= now()`.
2. **Vinculacion Institucional**: Los contenidos de tipo `institutional_content` o `recognition` deben estar obligatoriamente enlazados a un `institution_id` valido. El autor que realice la creacion debe poseer una relacion activa y permisos de edicion en `institution_members`.
3. **Asociacion de Reconocimientos**: Las menciones y premios catalogados en `recognitions` deben poder enlazarse a personas (`people`), instituciones (`institutions`) o hitos especificos del patrimonio.
4. **Fechas en Efemerides**: Los contenidos catalogados como `ephemeris` deben vincularse a campos de dia/mes especificos y poseer opcionalmente un año historico de referencia.
5. **Filtrado de Cartelera Docente**: El contenido de caracter educativo (`teacher_resource`) debe prever campos y tags optimizados para busqueda combinada por materia, nivel escolar y ambito territorial.
6. **Destacados Controlados (`is_featured`)**: Los contenidos de portada no deben determinarse unicamente por el orden cronologico de insercion. Se controlaran mediante la bandera `is_featured` y la columna `sort_order` para permitir a la mesa editorial fijar notas principales.

---

## 3. Riesgos de Seguridad Identificados

- **Publicacion Accidental de Borradores**: Exposición de articulos en desarrollo (`draft`/`review`) debido a politicas RLS permisivas.
- **Edicion No Autorizada**: Manipulacion de contenidos ajenos por colaboradores basicos.
- **Escalamiento Editorial**: Autores que marcan sus propios articulos como `'published'` sin revision de moderadores.
- **Exposicion de Datos Personales**: Publicacion de perfiles de autores o docentes suspendidos en listados publicos.
- **Carga de Fuentes No Verificadas**: Carencia de registros de autorias o instituciones responsables.
- **Manipulacion de Destacados**: Modificaciones no autorizadas de `is_featured` en articulos para alterar la portada.
- **Eliminacion de Historicos**: Borrados fisicos accidentales de contenidos patrimoniales e historicos (Mitigacion: implementar eliminacion logica e inhabilitar `DELETE` a nivel publico).

---

## 4. Criterios de Politicas RLS Futuras

Para neutralizar los riesgos de seguridad, la futura migración de contenidos implementará políticas RLS basadas en las siguientes directrices:

1. **Lectura Publica Controlada**:
   - El rol `anon` y perfiles basicos solo pueden leer si: `status = 'published' AND publish_date <= now() AND visibility = 'public'`.
2. **Acceso de Suscriptores**:
   - Usuarios autenticados (`authenticated`) con membresias activas pueden leer si: `status = 'published' AND publish_date <= now() AND visibility IN ('public', 'subscribers')`.
3. **Permisos de Autor**:
   - Un usuario con rol `cultural_collaborator` puede realizar `SELECT`, `UPDATE` y `DELETE` si: `author_profile_id = auth.uid()` y el estado es estrictamente `draft`.
4. **Moderacion Territorial y de Ambito**:
   - Los moderadores (`municipal_editor`, `provincial_editor`) solo pueden actualizar estados editoriales de `contents` cuyo `municipality_id` o `province_id` coincida con su ambito geografico (`scope_id` de `user_roles`).
   - Los editores federales y administradores poseen control de lectura y modificacion sin restricciones territoriales.
5. **Trazabilidad de Cambios**:
   - Cada cambio de estado editorial (`status`) o modificacion de cuerpo de contenidos gatillara un log inalterable en `audit_logs`.

---

## 5. Proximos Pasos

Esta revision no crea tablas ni politicas de base de datos. La proxima migracion a redactar se denominará:

```txt
supabase/migrations/0005_create_contents.sql
```
Esta migración se encargará de crear fisicamente la tabla `contents`, indices de busqueda para slugs e identificadores de categorizacion, y de habilitar el aislamiento mediante politicas RLS y grants.
