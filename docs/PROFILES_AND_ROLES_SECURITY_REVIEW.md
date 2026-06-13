# Revisión de Seguridad de Perfiles y Roles (pre-migración) — La Gauchita Federal

> [!IMPORTANT]
> Este documento técnico es una especificación de seguridad previa a la creación de las tablas de usuarios.
> **No se deben generar archivos `.sql` reales, ejecutar Supabase CLI ni alterar la base de datos en esta tarea.**

---

## 1. Análisis de Seguridad: Tabla profiles

### 1.1. Propósito y Vínculo
La tabla `profiles` actuará como la entidad de dominio que extiende la información del usuario autenticado en Supabase Auth (`auth.users`).
- **Relación**: El campo `id` de `profiles` referencia a `auth.users(id)` mediante una restricción de clave foránea `ON DELETE CASCADE`. Adicionalmente, se puede incluir `auth_user_id` de forma lógica o referencial redundante para propósitos de indexación.

### 1.2. Clasificación de Datos

- **Datos Permitidos (Públicos o Controlados)**:
  - Nombre a mostrar (`display_name`).
  - URL de avatar de almacenamiento público (`avatar_url`).
  - Preferencias de territorio (`province_id`, `municipality_id`).
  - Nivel de suscripción actual (`membership_level_id`).
  - Estado del perfil (`status`).
- **Datos Prohibidos (NUNCA deben almacenarse en profiles)**:
  - Contraseñas en texto plano o hashes (delegado exclusivamente al sistema de encriptación interna de Supabase Auth).
  - Datos sensibles de facturación (tarjetas de crédito, claves de pasarela).
  - Tokens de API o secretos de sesión.

### 1.3. Campos Mínimos Sugeridos
* `id` (UUID, PK, default `gen_random_uuid()` o mapeado directamente de Supabase Auth).
* `auth_user_id` (UUID, referencia lógica a `auth.users(id)`).
* `display_name` (TEXT, obligatorio).
* `avatar_url` (TEXT, opcional).
* `province_id` (UUID, FK a `provinces(id)`, opcional).
* `municipality_id` (UUID, FK a `municipalities(id)`, opcional).
* `membership_level_id` (UUID, FK a `membership_levels(id)`, obligatorio).
* `status` (TEXT, default `'active'`).
* `created_at` (TIMESTAMPTZ, default `now()`).
* `updated_at` (TIMESTAMPTZ, default `now()`).

### 1.4. Estados Sugeridos (`status`)
- **`active`**: Perfil operativo con permisos normales.
- **`inactive`**: Perfil inactivo temporalmente (creado pero no validado o desactivado por el usuario).
- **`suspended`**: Perfil bloqueado por moderación debido a infracciones editoriales.
- **`deleted`**: Perfil marcado para eliminación lógica (preservando autoría de contenidos históricos si es necesario, anonimizando datos personales).

---

## 2. Análisis de Seguridad: Tabla user_roles

### 2.1. Propósito y Relaciones
Tabla intermedia que asigna roles a perfiles, habilitando el control de accesos basado en roles (RBAC) y limitando el alcance territorial e institucional de las operaciones de escritura del CMS.

### 2.2. Campos Mínimos Sugeridos
* `id` (UUID, PK, default `gen_random_uuid()`).
* `profile_id` (UUID, FK a `profiles(id)`).
* `role_id` (UUID, FK a `roles(id)`).
* `scope_type` (TEXT, default `'global'`).
* `scope_id` (UUID, ID del territorio o institución asignada).
* `created_by` (UUID, referencia al administrador que asignó el rol).
* `created_at` (TIMESTAMPTZ, default `now()`).

### 2.3. Tipos de Alcance (`scope_type`)
- **`global`**: Rol aplicable a todo el portal sin límites espaciales (ej: `super_admin`, `federal_editor`).
- **`region`**: Limitado a una región geográfica específica.
- **`province`**: Limitado a una provincia de catálogo (ej: `provincial_editor` en Salta).
- **`municipality`**: Limitado a un municipio (ej: `municipal_editor` en Campo Quijano).
- **`institution`**: Limitado a una escuela, biblioteca o museo (ej: `validated_institution`).

---

## 3. Criterios de Seguridad y Políticas RLS Futuras

Para evitar riesgos de escalamiento de privilegios y fugas de información, se definen las siguientes reglas:

1. **Lectura y Escritura de Perfil**:
   - Todo usuario autenticado puede leer su propio registro en `profiles`.
   - Un usuario puede actualizar campos no críticos de su propio perfil (`display_name`, `avatar_url`, `province_id`, `municipality_id`).
   - **Bajo ninguna circunstancia** el propio usuario podrá actualizar su `membership_level_id` o `status` (estas columnas deben protegerse mediante políticas RLS o triggers que impidan su modificación desde clientes externos).
2. **Prevención de Escalamiento de Privilegios**:
   - Ningún usuario puede asignarse roles a sí mismo.
   - Las mutaciones (`INSERT`, `UPDATE`, `DELETE`) en la tabla `user_roles` están estrictamente restringidas a los roles `general_admin` y `super_admin`.
3. **Visibilidad de Datos**:
   - Los visitantes no autenticados (`visitor`) solo pueden ver perfiles públicos (autores y colaboradores). Los perfiles en estado `suspended` o `deleted` se excluyen de búsquedas generales.
   - Los editores pueden leer perfiles de colaboradores vinculados a contenidos bajo su misma jurisdicción territorial (`scope_id`).
4. **Trazabilidad (Auditoría)**:
   - Todo cambio de rol en `user_roles` debe gatillar una inserción automática en la tabla `audit_logs` registrando el creador de la asignación (`created_by`), el perfil afectado (`profile_id`) y el estado anterior/nuevo del rol.

---

## 4. Próximos Pasos

Esta revisión no crea tablas ni políticas de base de datos. La próxima migración a redactar se denominará:

```txt
supabase/migrations/0003_create_profiles_and_user_roles.sql
```
Esta migración se encargará de crear físicamente las tablas, los índices referenciales, los triggers de creación automática de perfiles desde Supabase Auth y las políticas RLS iniciales de control de accesos para perfiles y roles.
