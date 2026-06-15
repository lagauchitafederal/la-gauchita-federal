# Revision de Seguridad del Modelo de Reconocimientos (pre-migracion) — La Gauchita Federal

> [!IMPORTANT]
> Este documento tecnico es una especificacion de diseño de seguridad y datos previa a la creacion de la tabla de reconocimientos.
> **No se deben generar archivos `.sql` reales, ejecutar Supabase CLI ni alterar la base de datos en esta tarea.**

---

## 1. Analisis del Modelo de Reconocimientos

### 1.1. Proposito General
El modelo de reconocimientos de **La Gauchita Federal** tiene como finalidad estructurar, validar y exponer publicamente la trayectoria y legitimidad cultural del proyecto y sus actores asociados. Permite catalogar premios, avales, menciones y distinciones otorgadas por entidades publicas o privadas a personas, obras o instituciones. Este modelo sirve como un validador de reputacion historica y patrimonio inmaterial, y debe integrarse de manera fluida con el filtro core de la plataforma (Fecha + Territorio + Acceso).

### 1.2. Objetivos de Registro (Tipologia)
El modelo debe estar capacitado para persistir y clasificar de forma categorica los siguientes antecedentes:
- **Premios (`award`)**: Galardones competitivos o de trayectoria.
- **Menciones (`mention`)**: Reconocimientos honorificos o destaques en certamenes.
- **Declaraciones de Interes (`declaration`)**: Declaraciones formales de interes cultural, legislativo o municipal.
- **Avales Institucionales (`endorsement`)**: Respaldo formal emitido por instituciones educativas, gubernamentales o culturales.
- **Reconocimientos Culturales (`distinction`)**: Distinciones otorgadas por la comunidad o referentes del sector.
- **Distinciones Acadicas (`distinction`)**: Reconocimientos de universidades, academias o institutos de investigacion.
- **Homenajes (`homage`)**: Tributos a trayectorias de personas o instituciones.
- **Certificaciones (`certification`)**: Acreditaciones oficiales o profesionales de competencias o estandares.
- **Participaciones Destacadas (`participation`)**: Presencia relevante en congresos, festivales o ferias internacionales.
- **Prensa Destacada (`press`)**: Cobertura mediatica o notas de prensa de gran relevancia.
- **Otros Antecedentes (`other`)**: Cualquier otro hito de relevancia patrimonial o curricular.

### 1.3. Entidades Reconocibles
El modelo de reconocimientos es transversal y puede aplicarse a multiples tipos de entidades en el sistema:
- **Eduardo Ceballos**: Fundador y referente cultural (`person`).
- **Revista La Gauchita**: Publicacion de trayectoria (`magazine`).
- **Instituto Cultural Andino (ICA)**: Institucion educativa/cultural (`institute`).
- **La Gauchita Federal**: Plataforma digital y proyecto federal (`project`).
- **Libros**: Ensayos, antologias y publicaciones literarias (`book`).
- **Discos / Albumes**: Producciones musicales folklores (`music_album`).
- **Autores / Colaboradores**: Escritores, musicos e investigadores (`person`).
- **Instituciones**: Colegios, bibliotecas, municipios y museos (`institution`).
- **Contenidos Culturales**: Articulos especificos o efemerides de gran valor (`content`).
- **Eventos**: Festivales, peñas o jornadas culturales (`event`).
- **Otros Productos Culturales**: Obras artisticas no categorizadas (`other`).

---

## 2. Especificacion de Estructura de Datos (Futura Tabla `recognitions`)

### 2.1. Estructura Sugerida de Campos
* `id` (UUID, PK, default `gen_random_uuid()`): Identificador unico de la base de datos.
* `title` (TEXT, obligatorio): Nombre o titulo del reconocimiento (ej: "Declaracion de Interes Cultural").
* `slug` (TEXT, obligatorio, unique): URL amigable indexable.
* `recognition_type` (TEXT, obligatorio): Clasificacion del reconocimiento.
* `description` (TEXT, opcional): Resumen o justificacion del reconocimiento.
* `granting_institution_name` (TEXT, obligatorio): Nombre de la entidad que otorga el reconocimiento.
* `granting_institution_id` (UUID, FK a `institutions(id)`, opcional): Enlace si la institucion otorgante esta registrada en el sistema.
* `recognized_entity_type` (TEXT, obligatorio): Tipo de entidad que recibe el reconocimiento.
* `recognized_entity_id` (UUID, opcional): UUID de la entidad en el sistema (ej. ID de profiles para personas, ID de contents para articulos, etc.).
* `related_content_id` (UUID, FK a `contents(id)`, opcional): Contenido del CMS asociado que narra o documenta el evento.
* `related_institution_id` (UUID, FK a `institutions(id)`, opcional): Institucion del sistema asociada al reconocimiento.
* `recognition_date` (DATE, opcional): Fecha en que se otorgo el reconocimiento.
* `location` (TEXT, opcional): Lugar geografico donde se otorgo (ciudad, provincia).
* `document_reference` (TEXT, opcional): Numero de resolucion, acta o identificador legal.
* `source_reference` (TEXT, opcional): Enlace web de prensa, boletin oficial o referencia.
* `status` (TEXT, obligatorio, default `'draft'`): Estado de validacion editorial.
* `visibility` (TEXT, obligatorio, default `'public'`): Nivel de acceso restringido.
* `is_featured` (BOOLEAN, obligatorio, default `false`): Flag para destacar en vitrinas.
* `sort_order` (INTEGER, obligatorio, default 0): Orden manual de presentacion.
* `created_by_profile_id` (UUID, FK a `profiles(id)`, obligatorio): Usuario creador del registro.
* `created_at` (TIMESTAMPTZ, default `now()`).
* `updated_at` (TIMESTAMPTZ, default `now()`).

### 2.2. Restricciones de Dominio (Check Constraints)

Para asegurar la integridad de los datos a nivel fisico, se proponen las siguientes restricciones:

```sql
-- Restriccion de tipo de reconocimiento
CONSTRAINT chk_recognitions_type CHECK (recognition_type IN (
    'award', 'mention', 'declaration', 'endorsement', 'distinction', 
    'homage', 'certification', 'press', 'participation', 'other'
))

-- Restriccion de tipo de entidad reconocida
CONSTRAINT chk_recognitions_entity_type CHECK (recognized_entity_type IN (
    'person', 'magazine', 'institute', 'project', 'book', 
    'music_album', 'institution', 'content', 'event', 'other'
))

-- Restriccion de estado editorial
CONSTRAINT chk_recognitions_status CHECK (status IN (
    'draft', 'review', 'active', 'archived', 'rejected'
))

-- Restriccion de visibilidad de acceso
CONSTRAINT chk_recognitions_visibility CHECK (visibility IN (
    'public', 'institutional', 'private'
))
```

---

## 3. Relaciones Futuras y Modelado Fisico

El modelo de reconocimientos interactua en cascada con los demas componentes del ecosistema relacional de Supabase:
1. **Con `institutions`**:
   - `granting_institution_id`: Permite vincular el premio a una de las instituciones registradas (ej: "Municipio de Salta").
   - `related_institution_id`: Asocia el reconocimiento a la institucion que lo recibe o lo promueve.
2. **Con `contents`**:
   - `related_content_id`: Permite enlazar un articulo del CMS que cubra el evento de entrega del reconocimiento.
3. **Con `media_assets`**:
   - Se debe prever una relacion de uno a muchos (o tabla intermedia) para adjuntar documentos probatorios (PDF de la resolucion, fotografia de la estatuilla, acta escaneada), categorizados bajo el `asset_type = 'recognition_document'`.
4. **Con `profiles`**:
   - `created_by_profile_id`: Garantiza la trazabilidad de quien registro el antecedente.
   - Enlace indirecto mediante `recognized_entity_id` a `profiles.id` when `recognized_entity_type = 'person'`.
5. **Con Futuras Tablas de Personas/Productos Culturales**:
   - Enlace logico o polimorfico mediante `recognized_entity_id` hacia las futuras tablas de libros, discos y revistas.
6. **Con Documentos Probatorios**:
   - Los documentos fisicos en Supabase Storage (en bucket publico o privado segun visibilidad) se referencian a traves de la tabla `media_assets`.

---

## 4. Analisis de Riesgos de Seguridad y Reputacion

La publicacion de reconocimientos falsos o inexactos es un riesgo critico para la legitimidad del proyecto. Se identifican las siguientes amenazas:
1. **Publicacion de Reconocimientos No Verificados**: Un colaborador o institucion podria subir un premio falso.
   - *Mitigacion*: El estado inicial por defecto debe ser `'draft'` o `'review'`. Requiere aprobacion explicita de un editor o administrador antes de pasar a `'active'`.
2. **Publicacion de Documentacion Sensible**: Adjuntar escaneos de resoluciones que contengan firmas, DNI, telefonos o datos de caracter privado de funcionarios o terceros.
   - *Mitigacion*: Establecer flujos de revision obligatorios para documentos y habilitar visibilidad `'private'` o `'institutional'` para archivos sensibles.
3. **Atribucion Falsa de Premios o Avales**: Asociar un reconocimiento a un autor o proyecto que no corresponde.
   - *Mitigacion*: Restricciones de llave foranea robustas y RLS que limite la relacion de perfiles.
4. **Confusion de Participacion con Reconocimiento**: Catalogar una asistencia basica a un congreso como si fuera una distincion oficial de la institucion.
   - *Mitigacion*: Definicion estricta a nivel editorial de que clasifica como `award`/`distinction` vs `participation`.
5. **Exposicion de Datos Personales en Adjuntos**: Documentos PDF subidos a buckets publicos que expongan direcciones o resoluciones internas no publicas.
   - *Mitigacion*: Bucket `private-media` y consumo exclusivo por URLs firmadas con expiracion para documentos sensibles.
6. **Manipulacion de Reconocimientos Destacados (`is_featured`)**: Alteracion maliciosa para posicionar un reconocimiento menor por encima de los historicos en la portada del CMS.
   - *Mitigacion*: RLS deniega la edicion de `is_featured` y `sort_order` a colaboradores; restringido a editores federales y administradores.
7. **Eliminacion Indebida de Antecedentes Historicos**: Perdida de registros patrimoniales historicos debido a eliminaciones accidentales o intencionadas.
   - *Mitigacion*: Denegar operacion `DELETE` fisica para todos los roles excepto `super_admin`. Utilizar eliminacion logica cambiando el estado a `'archived'`.
8. **Uso Institucional No Autorizado**: Un miembro de una escuela subiendo un aval a nombre de la escuela sin el consentimiento de la direccion.
   - *Mitigacion*: La relacion de miembros institucionales en `institution_members` debe ser validada previamente por un administrador.

---

## 5. Criterios Editoriales y Usabilidad

Para garantizar el rigor historico y la calidad de la informacion expuesta:
1. **Fuente de Respaldo Obligatoria**: Todo reconocimiento visible al publico general debe contar de forma mandatoria con una `source_reference` (boletin oficial, enlace a prensa) o un documento adjunto validado en `media_assets`.
2. **Asociacion Documental**: Si existe el diploma, resolucion o acta, debe digitalizarse e indexarse como un `media_asset` de tipo `recognition_document`.
3. **Taxonomia Clara**: Evitar ambiguedades. Un diploma de asistencia es una `participation`, mientras que una medalla de oro es un `award`.
4. **Ordenamiento Personalizado**: Las instituciones y perfiles destacados deben poder estructurar su "vitrina de reconocimientos" mediante el campo `sort_order`, permitiendo destacar hitos clave sin romper el orden de relevancia historica.
5. **Destacados sin Ruptura Cronologica**: Los hitos principales marcados con `is_featured = true` podran renderizarse en componentes especificos de portada, mientras que el listado historico general se ordenara cronologicamente en base a `recognition_date`.
6. **Filtros Avanzados en Frontend**: El portal de visualizacion debe proveer filtros robustos por `recognition_type`, `recognized_entity_type`, `granting_institution_name`, y rangos de fecha para permitir la investigacion educativa y patrimonial de los antecedentes.

---

## 6. Criterios de Politicas RLS Futuras

La seguridad a nivel de base de datos se estructurara en base a las siguientes politicas conceptuales:
1. **Lectura Publica y Anonima**:
   - Los roles `anon` y `authenticated` (suscriptores/visitantes) solo podran ejecutar `SELECT` sobre registros con: `status = 'active' AND visibility = 'public'`.
2. **Acceso de Autores / Creadores**:
   - Un usuario con rol `cultural_collaborator` podra leer sus propios borradores (`created_by_profile_id = auth.uid()`).
   - Podra actualizar (`UPDATE`) y eliminar logicamente (`status = 'archived'`) unicamente si el registro se encuentra en estado `'draft'` o `'rejected'`.
3. **Editores Institucionales**:
   - Los miembros validados de una institucion (`institution_members` con rol `'admin'` o `'editor'`) podran gestionar y crear reconocimientos cuyo `granting_institution_id` o `related_institution_id` coincida con su institucion.
4. **Administradores Generales y Editores Federales**:
   - Poseeran privilegios totales de `SELECT`, `INSERT`, `UPDATE` y `DELETE` logico sobre todos los registros sin restricciones territoriales.
5. **Restriccion de Activacion / Publicacion**:
   - Ninguna politica permitira a un usuario con rol basico (`subscriber` o `cultural_collaborator`) cambiar el estado `status` a `'active'` de forma directa. Este cambio requerira la aprobacion explicita de un editor con alcance territorial o de un administrador general.
6. **Trazabilidad Historica**:
   - Todo cambio en el estado `status` de un reconocimiento, o alteracion de campos clave como `recognized_entity_id`, debera registrar un evento de auditoria inalterable en `audit_logs` mediante triggers PostgreSQL.

---

## 7. Proximos Pasos de la Implementacion

Esta revision no realiza modificaciones fisicas sobre la base de datos ni crea recursos de almacenamiento. La proxima migracion a redactar se denominará:

```txt
supabase/migrations/0007_create_recognitions.sql
```

Dicha migracion sera la encargada de instanciar la tabla `recognitions`, aplicar los indices de busqueda para consultas frecuentes por tipo y entidad, y configurar las politicas RLS definitivas junto con sus correspondientes grants.
