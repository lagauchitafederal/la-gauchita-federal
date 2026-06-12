# Estrategia de Seguridad y Row Level Security (RLS) — La Gauchita Federal

> [!IMPORTANT]
> Este documento técnico define la especificación conceptual y el diseño de la seguridad a nivel de base de datos para la Versión 1. 
> **No se deben crear políticas SQL activas ni migraciones en esta tarea.**

---

## 1. Principios de Seguridad Core

1. **Defensa en Profundidad (Base de Datos como Última Frontera)**: La seguridad nunca debe delegarse únicamente en la UI del frontend o en capas intermedias. Si una consulta puentea el cliente, las políticas de Supabase Row Level Security (RLS) deben garantizar que el actor solo acceda a los registros autorizados.
2. **Principio de Menor Privilegio (PoLP)**: Todo acceso por defecto está denegado (`RESTRICTIVE`) hasta que una política explícita (`PERMISSIVE`) permita selectivamente operaciones de `SELECT`, `INSERT`, `UPDATE` o `DELETE`.
3. **Validación de Roles en Token JWT (Custom Claims)**: Para evitar cuellos de botella y recursión infinita en las políticas SQL de RLS, la información del rol (`UserRole`) y el alcance territorial de los editores debe inyectarse en los metadatos de usuario (`app_metadata` del JWT) al autenticarse en Supabase Auth, evitando consultas constantes a la tabla `user_roles`.
4. **Trazabilidad Inalterable**: Toda operación que altere estados críticos (CMS, instituciones, roles) debe registrarse automáticamente en la tabla `audit_logs` mediante triggers a nivel de esquema (`SECURITY DEFINER`), previniendo manipulaciones por parte de los usuarios.

---

## 2. Matriz de Permisos por Rol

La plataforma de **La Gauchita Federal** define una jerarquía operativa donde los permisos se limitan territorialmente en cascada:

| Rol Técnico (JWT / BD) | Descripción Operativa | SELECT | INSERT | UPDATE | DELETE |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`visitor`** | Usuario anónimo no autenticado. | Solo lectura de contenidos publicados y públicos a nivel federal o de la zona seleccionada. | Ninguno (excepto inserción anónima en `views`). | Ninguno. | Ninguno. |
| **`subscriber`** | Usuario autenticado (Gratuito/Patrocinador). | Lectura de contenidos publicados adaptados a su nivel de membresía. | Creación y eliminación de sus propios `likes`. | Actualización de su propio perfil (`profiles`). | Ninguno. |
| **`cultural_collaborator`** | Historiadores, docentes y autores independientes. | Lectura general + lectura de borradores de su propia autoría. | Creación de borradores en `contents`. | Edición de borradores propios (no publicados). | Eliminación de borradores propios (no publicados). |
| **`validated_institution`** | Personal autorizado de escuelas, bibliotecas o museos. | Lectura general + lectura de contenidos y reconocimientos de su institución. | Creación de contenidos y reconocimientos asociados a su institución (en estado `'review'`). | Edición de borradores y propuestas de su institución. | Ninguno. |
| **`reviewer`** | Moderadores editoriales y académicos. | Lectura de cualquier borrador o propuesta en estado `'review'`. | Creación de comentarios o registros de auditoría de revisión. | Modificación del estado editorial a `'review'` (sin publicación directa). | Ninguno. |
| **`municipal_editor`** | Editor restringido a contenidos de un Municipio específico. | Lectura de todo el CMS dentro de su municipio. | Creación de contenidos y efemérides para su municipio. | Aprobación e inicio de publicación (`'published'`) de contenidos de su municipio. | Ninguno. |
| **`provincial_editor`** | Editor restringido a contenidos de una Provincia. | Lectura de todo el CMS de su provincia. | Creación de contenidos a nivel provincial y municipal en su zona. | Aprobación, edición y publicación de contenidos de su provincia. | Eliminación de contenidos locales/provinciales no validados. |
| **`federal_editor`** | Editores generales con alcance nacional. | Lectura de todo el sistema. | Creación de contenidos nacionales (federales), provinciales o municipales. | Edición, aprobación y publicación sin restricciones de territorio. | Eliminación de contenidos (excepto logs). |
| **`general_admin`** | Administradores de plataforma. | Lectura total. | Registro de instituciones y asignación de usuarios institucionales. | Gestión de perfiles, categorías e instituciones. | Bloqueo/suspensión de perfiles de usuario. |
| **`super_admin`** | Administrador de sistemas / DevOps. | Control total (Bypass de políticas RLS para mantenimiento). | Control total. | Control total. | Control total. |

---

## 3. Especificación RLS por Entidad

A continuación se determinan las políticas de seguridad sugeridas para cada una de las tablas del sistema:

### 3.1. profiles
- **RLS Obligatorio**: Sí.
- **Políticas**:
  - `SELECT`: Público (cualquier visitante puede leer perfiles básicos de autores).
  - `INSERT`: Restringido al trigger de creación de usuario en Supabase Auth (`auth.users`).
  - `UPDATE`: Permitido únicamente si `auth.uid() = id`.
  - `DELETE`: Denegado.

### 3.2. contents
- **RLS Obligatorio**: Sí.
- **Políticas**:
  - `SELECT`:
    - Público si `editorial_status = 'published' AND publish_date <= NOW() AND min_access_level = 'public'`.
    - Autores pueden leer sus propios registros (`author_id = auth.uid()`).
    - Editores locales/federales pueden leer registros que coincidan con su alcance territorial (`province_id`, `municipality_id`).
  - `INSERT`: Autores, colaboradores e instituciones pueden insertar (estado inicial obligatorio: `'draft'` o `'review'`).
  - `UPDATE`:
    - Editores autorizados según jerarquía territorial.
    - Autores solo si el estado actual es `'draft'`.
  - `DELETE`: Editores provinciales, federales y administradores.

### 3.3. ephemerides
- **RLS Obligatorio**: Sí.
- **Políticas**:
  - `SELECT`: Público (Lectura sin restricciones).
  - `INSERT` / `UPDATE` / `DELETE`: Restringido a editores municipales, provinciales, federales o administradores según el territorio asignado.

### 3.4. people & places
- **RLS Obligatorio**: Sí.
- **Políticas**:
  - `SELECT`: Público (Lectura sin restricciones).
  - `INSERT` / `UPDATE` / `DELETE`: Restringido a editores autorizados.

### 3.5. institutions
- **RLS Obligatorio**: Sí.
- **Políticas**:
  - `SELECT`: Público.
  - `INSERT`: Administradores generales o federales.
  - `UPDATE`: Administradores generales o administradores de la propia institución (`institution_users`).
  - `DELETE`: Solo administradores generales.

### 3.6. institution_users
- **RLS Obligatorio**: Sí.
- **Políticas**:
  - `SELECT`: Miembros de la institución.
  - `INSERT` / `UPDATE` / `DELETE`: Administradores de la institución o administradores generales.

### 3.7. recognitions
- **RLS Obligatorio**: Sí.
- **Políticas**:
  - `SELECT`: Público.
  - `INSERT` / `UPDATE`: Instituciones autorizadas (restringidas a su propio `institution_id`) y editores.
  - `DELETE`: Editores provinciales/federales.

### 3.8. magazine_editions & publications
- **RLS Obligatorio**: Sí.
- **Políticas**:
  - `SELECT`:
    - Si la edición de revista es gratuita (`is_free = true`), lectura pública.
    - Si es de pago (`is_free = false`), requiere que el usuario posea nivel de membresía compatible (`patrocinador` o `adherente`) verificado contra `profiles.membership_level_id`.
  - `INSERT` / `UPDATE` / `DELETE`: Editores federales y administradores.

### 3.9. media_assets
- **RLS Obligatorio**: Sí.
- **Políticas**:
  - `SELECT`: Público (para renderizado de imágenes y documentos).
  - `INSERT`: Usuarios autenticados con rol de autor, institución o editor.
  - `DELETE`: Propietario del archivo (`uploaded_by = auth.uid()`) o editores.

### 3.10. views
- **RLS Obligatorio**: Sí.
- **Políticas**:
  - `SELECT`: Autores (solo estadísticas de sus propios posts) y editores.
  - `INSERT`: Público (Inserción anónima mediante triggers o API pública controlada).
  - `UPDATE` / `DELETE`: Denegado para todos los roles.

### 3.11. likes
- **RLS Obligatorio**: Sí.
- **Políticas**:
  - `SELECT`: Público.
  - `INSERT`: Permitido si `auth.uid() = profile_id`.
  - `DELETE`: Permitido si `auth.uid() = profile_id`.

### 3.12. audit_logs
- **RLS Obligatorio**: Sí.
- **Políticas**:
  - `SELECT`: Restringido a `super_admin` e inspectores de seguridad autorizados.
  - `INSERT` / `UPDATE` / `DELETE`: Denegado para todas las conexiones externas. Solo modificable por funciones internas del sistema (`SECURITY DEFINER`) ejecutadas por triggers del sistema.

---

## 4. Evitar Recursión Infinita en Supabase RLS

Un error común en Supabase RLS es la recursión infinita (ej: una política en la tabla `profiles` que consulta `user_roles`, y la política de `user_roles` consulta `profiles`).

### Solución Arquitectónica Recomendada:
1. **Inyección en JWT**: Guardar los datos de privilegios del perfil en el JWT usando funciones de PostgreSQL enlazadas a `supabase_trigger_auth_user`.
2. **Consultas Directas Optimizadas**: En caso de no usar JWT claims, las políticas RLS deben apuntar directamente a funciones de base de datos seguras (`SECURITY DEFINER`) que bypassen RLS para consultas internas de verificación:

```sql
-- Función conceptual para verificar permisos territorialmente sin recursión
CREATE OR REPLACE FUNCTION check_editor_territory(
    user_id UUID, 
    target_municipality_id UUID, 
    target_province_id UUID
) 
RETURNS BOOLEAN 
SECURITY DEFINER -- Ejecuta con privilegios del sistema
AS $$
BEGIN
    -- Lógica interna que comprueba si el usuario posee rol editor municipal o provincial asignado
    -- y si el territorio coincide con su alcance de gestión
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.profile_id = user_id 
        AND (
            r.code = 'federal_editor' 
            OR (r.code = 'provincial_editor' AND ur.province_id = target_province_id)
            OR (r.code = 'municipal_editor' AND ur.municipality_id = target_municipality_id)
        )
    );
END;
$$ LANGUAGE plpgsql;
```
