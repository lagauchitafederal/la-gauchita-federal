# Plan Técnico de Migraciones V1 — La Gauchita Federal

> [!IMPORTANT]
> Este documento técnico define la especificación de diseño previa para el orden secuencial de ejecución de las migraciones SQL. 
> **No se deben generar archivos `.sql` reales, ejecutar Supabase CLI ni alterar la base de datos en esta tarea.**

---

## 1. Orden Secuencial Propuesto de Migraciones

Para evitar errores de dependencias de claves foráneas (`FOREIGN KEY`) y garantizar que los catálogos maestros existan antes de ser referenciados por las tablas lógicas, se establece el siguiente orden secuencial de migración:

```txt
0001_create_catalog_tables.sql
  └── 0002_seed_catalog_tables.sql
        └── 0003_create_profiles_and_roles.sql
              └── 0004_create_content_core_tables.sql
                    └── 0005_create_institution_tables.sql
                          └── 0006_create_media_publications_and_recognitions.sql
                                └── 0007_create_engagement_and_audit_tables.sql
                                      └── 0008_create_rls_policies.sql
```

---

## 2. Detalle Fases de Migración

### 2.1. `0001_create_catalog_tables.sql`
- **Objetivo**: Crear la estructura física de las tablas maestras de catálogo independientes del dominio.
- **Tablas Involucradas**:
  - `regions`
  - `provinces`
  - `municipalities`
  - `roles`
  - `membership_levels`
  - `categories`
  - `content_types`
- **Datos Incluidos/Excluidos**: Estructuras DDL vacías. Ningún registro.
- **Riesgos**: Mapeo incorrecto de relaciones jerárquicas territoriales (`municipalities` -> `provinces` -> `regions`).
- **Criterios de Aceptación**: Creación exitosa de las 7 tablas de catálogo y sus índices de clave primaria y foránea correspondientes.

### 2.2. `0002_seed_catalog_tables.sql`
- **Objetivo**: Insertar los registros maestros base para posibilitar el correcto funcionamiento de las validaciones y selecciones territoriales.
- **Tablas Involucradas**: Las 7 tablas creadas en la migración `0001`.
- **Datos Incluidos/Excluidos**: Carga inicial de Regiones geográficas, Provincias de la República Argentina, Municipios seleccionados (datos INDEC preliminares), Roles operativos (`super_admin`, `editor`, etc.), Niveles de Membresía e identificadores de Categorías. Excluye perfiles de usuario.
- **Riesgos**: Volumen excesivo de datos si se insertan todos los parajes del país en la primera carga (Mitigación: restringir a un subset representativo de municipios).
- **Criterios de Aceptación**: Datos de referencia insertados y accesibles mediante consultas de lectura básicas.

### 2.3. `0003_create_profiles_and_roles.sql`
- **Objetivo**: Vincular el sistema de autenticación de Supabase (`auth.users`) con el dominio de la aplicación y el control de accesos.
- **Tablas Involucradas**:
  - `profiles`
  - `user_roles`
- **Datos Incluidos/Excluidos**: Estructuras DDL vacías y trigger automático `create_profile_on_signup()` en PostgreSQL.
- **Riesgos**: Fallo en el trigger automático de creación de perfil al registrar un usuario en Supabase Auth.
- **Criterios de Aceptación**: Registro automático en `profiles` tras cada inserción simulada en `auth.users`.

### 2.4. `0004_create_content_core_tables.sql`
- **Objetivo**: Instanciar la lógica de persistencia del CMS de contenidos y efemérides.
- **Tablas Involucradas**:
  - `contents`
  - `ephemerides`
- **Datos Incluidos/Excluidos**: Tablas vacías de contenidos. Excluye comentarios o interacciones.
- **Riesgos**: Lentitud en búsquedas compuestas por fecha y estado de publicación (Mitigación: índices específicos en `(editorial_status, publish_date)`).
- **Criterios de Aceptación**: Soporte para vincular contenidos a localizaciones (municipios/provincias/regiones) y tipos de contenido.

### 2.5. `0005_create_institution_tables.sql`
- **Objetivo**: Soportar el registro de escuelas, bibliotecas y museos y sus usuarios delegados.
- **Tablas Involucradas**:
  - `institutions`
  - `institution_users`
- **Datos Incluidos/Excluidos**: Estructuras DDL vacías.
- **Riesgos**: Asignación de un usuario a múltiples instituciones con permisos conflictivos.
- **Criterios de Aceptación**: Integridad referencial que asocie usuarios de instituciones a perfiles activos.

### 2.6. `0006_create_media_publications_and_recognitions.sql`
- **Objetivo**: Instanciar almacenamiento lógico multimedia, ediciones mensuales de la revista y menciones honoríficas locales.
- **Tablas Involucradas**:
  - `media_assets`
  - `magazine_editions`
  - `publications`
  - `recognitions`
- **Datos Incluidos/Excluidos**: Estructuras DDL vacías.
- **Riesgos**: Falta de integridad entre la publicación individual y la edición PDF de la revista.
- **Criterios de Aceptación**: Correcto mapeo de archivos de almacenamiento hacia rutas de Supabase Storage.

### 3.7. `0007_create_engagement_and_audit_tables.sql`
- **Objetivo**: Habilitar interacciones de usuario (Me Gusta, Visualizaciones) y registros del historial de auditoría de seguridad.
- **Tablas Involucradas**:
  - `likes`
  - `views`
  - `audit_logs`
- **Datos Incluidos/Excluidos**: Estructuras DDL vacías.
- **Riesgos**: Crecimiento desmedido de la tabla `views` (Mitigación: agregación de datos por fecha e índices en `content_id`).
- **Criterios de Aceptación**: Registro inalterable de auditoría mediante triggers automáticos de base de datos.

### 2.8. `0008_create_rls_policies.sql`
- **Objetivo**: Blindar la base de datos aplicando Row Level Security (RLS) en todas las tablas del sistema.
- **Tablas Involucradas**: Las 22 tablas del modelo.
- **Datos Incluidos/Excluidos**: Sentencias SQL de políticas (`CREATE POLICY`).
- **Riesgos**: Recursión infinita en validación de roles cruzados (Mitigación: uso de funciones `SECURITY DEFINER` e inyección de claims en JWT).
- **Criterios de Aceptación**: Denegación por defecto de lecturas y escrituras no autorizadas a usuarios anónimos o no privilegiados.

---

## 3. Decisiones Arquitectónicas Especiales

### Exclusión de PostGIS en el MVP Inicial:
* **Decisión Técnica**: La extensión geográfica **PostGIS queda formalmente fuera del MVP inicial** para acelerar el desarrollo de las Fases 1 a 6. 
* **Alternativa**: Las localizaciones de provincias y municipios se modelarán inicialmente de manera relacional tradicional utilizando coordenadas decimales numéricas (`NUMERIC(10, 8)`) de latitud y longitud. La herencia jerárquica se realizará mediante llaves foráneas estándar (`province_id`, `region_id`). Las operaciones geométricas avanzadas (como ST_Contains o polígonos complejos) se integrarán en una versión posterior.

---

## 4. Lineamientos de Despliegue de Base de Datos

* **Ambiente de Destino Mandatorio**: Toda migración redactada debe ejecutarse, depurarse y aprobarse en primer término en la instancia de base de datos **`la-gauchita-federal-dev`** en la nube de Supabase.
* **Prohibición en Producción**: **Bajo ninguna circunstancia** se aplicarán migraciones o cambios estructurales directamente sobre la base de datos de producción (`la-gauchita-federal-prod`) o staging sin haber completado y validado el ciclo de pruebas en el entorno dev.
