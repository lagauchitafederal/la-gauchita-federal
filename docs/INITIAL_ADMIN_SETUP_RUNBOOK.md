# Runbook Operativo: Creacion del Administrador Inicial (Desarrollo) — La Gauchita Federal

> [!IMPORTANT]
> Este documento contiene el procedimiento manual controlado para inicializar la primera cuenta administrativa en el entorno de desarrollo.
> **Este archivo no debe contener correos, identificadores UUID ni credenciales reales de ningun tipo.**

---

## 1. Objetivo del Runbook

Este runbook operativo provee los pasos detallados para realizar el bootstrap (inicializacion) manual y controlado del primer usuario administrador del sistema en el entorno de desarrollo (**Supabase dev**).
- **Rol a asignar**: `super_admin` (Administrador de Infraestructura y Politicas).
- **Tipo de Alcance**: `global` (acceso irrestricto en todos los municipios y provincias).
- **ID de Alcance**: `NULL` (no restringido territorialmente).

---

## 2. Advertencias Criticas de Operacion

> [!WARNING]
> - **Entorno Exclusivo**: Este procedimiento esta diseñado para el entorno de desarrollo (`la-gauchita-federal-dev`). Bajo ninguna circunstancia debe ejecutarse sobre el entorno de produccion sin la autorizacion de la mesa de arquitectura y la debida adecuacion de credenciales.
> - **Verificacion de Host**: Antes de ejecutar cualquier script en el SQL Editor de Supabase, verifique la URL de la pestaña activa del navegador para confirmar que se encuentra conectado al proyecto de desarrollo.
> - **Aislamiento de Git (PII)**: Queda terminantemente prohibido commitear o guardar en archivos versionados correos electronicos reales, identificadores UUID (`auth.users.id`) o contraseñas utilizadas en la operacion.
> - **Seguridad de Service Role Key**: No almacene ni pegue la clave maestra (`service_role`) en archivos locales desprotegidos, chats de mensajeria o repositorios publicos.
> - **Uso de Placeholders**: Utilice unicamente los bloques SQL con placeholders descritos en esta guia. Reemplace los valores dinamicamente en su editor interactivo de sesion y borre el historial de consultas al finalizar.

---

## 3. Precondiciones

Antes de iniciar la ejecucion de este procedimiento, certifique que se cumplen las siguientes condiciones:
1. Las migraciones `0001_create_catalog_tables.sql` a `0010_update_audit_logs_admin_policy.sql` han sido aplicadas exitosamente sobre la base de datos dev.
2. Los roles basicos del sistema (incluido `super_admin`) se encuentran cargados en la tabla `public.roles` (migracion `0002_seed_catalog_tables.sql`).
3. Las funciones helper de verificacion de permisos se encuentran creadas en el esquema `public` (migracion `0009_create_permission_helpers.sql`).
4. Las politicas de lectura restrictiva de logs de auditoria se encuentran configuradas (migracion `0010_update_audit_logs_admin_policy.sql`).
5. Se cuenta con acceso de operador al panel web de Supabase Dashboard del proyecto dev.

---

## 4. Procedimiento Paso a Paso

### Paso 1: Crear Usuario de Autenticacion
1. Ingrese a la consola web de Supabase dev.
2. Navegue a la seccion **Authentication -> Users**.
3. Haga clic en el boton **Add User** y seleccione **Create User**.
4. Ingrese el correo electronico y la contraseña provistos por la mesa de operaciones (no commitear estos datos).
5. Desactive la casilla *Auto-confirm User* si desea forzar validacion por correo, o dejela activa para un inicio inmediato de sesion en dev (recomendado para desarrollo local).
6. Haga clic en **Save**.
7. Localice al usuario recien creado en la lista de usuarios de Auth, copie el identificador UUID expuesto en la columna **User ID** y conservelo unicamente en la memoria de la sesion interactiva. Este valor se referenciara como `<AUTH_USER_ID>`.

### Paso 2: Crear el Perfil de Usuario en public.profiles
1. Dirigase a la seccion **SQL Editor** en el panel lateral de Supabase.
2. Abra una nueva consulta y ejecute la insercion del perfil de usuario, reemplazando el placeholder `<AUTH_USER_ID>` con el UUID copiado en el paso anterior y `<DISPLAY_NAME>` con el nombre representativo (ej: `'Bootstrap Admin'`):

```sql
-- Insertar perfil para el administrador de desarrollo
INSERT INTO public.profiles (auth_user_id, display_name, status)
VALUES (
    '<AUTH_USER_ID>', 
    '<DISPLAY_NAME>', 
    'active'
);
```

3. Verifique la creacion del perfil ejecutando la siguiente consulta y tome nota del `id` resultante (UUID de profiles). Este valor se referenciara como `<PROFILE_ID>`:

```sql
SELECT id, display_name, status 
FROM public.profiles 
WHERE auth_user_id = '<AUTH_USER_ID>';
```

### Paso 3: Obtener el Identificador del Rol super_admin
1. Para garantizar el correcto enlace relacional, busque el UUID del rol `super_admin` registrado en la base de datos:

```sql
SELECT id 
FROM public.roles 
WHERE code = 'super_admin' AND is_active = TRUE;
```
2. Copie el UUID resultante. Este valor se referenciara como `<ROLE_ID>`.

### Paso 4: Asignar el Rol Global de super_admin
1. Proceda a insertar la relacion en `user_roles` utilizando los UUIDs obtenidos. Configure explicitamente el `scope_type` como `'global'`, `scope_id` como `NULL`, y `created_by` como `NULL` para denotar que es la cuenta inicial de inicializacion del sistema:

```sql
INSERT INTO public.user_roles (
    profile_id, 
    role_id, 
    scope_type, 
    scope_id, 
    created_by
)
VALUES (
    '<PROFILE_ID>', 
    '<ROLE_ID>', 
    'global', 
    NULL, 
    NULL
);
```

---

## 5. Consultas de Verificacion

Ejecute las siguientes consultas en el SQL Editor para garantizar que la inicializacion y el control de accesos se configuraron de acuerdo con las especificaciones de seguridad:

### 1. Verificar asignacion de Rol Global
```sql
SELECT ur.id, p.display_name, r.code, ur.scope_type, ur.scope_id 
FROM public.user_roles ur
JOIN public.profiles p ON ur.profile_id = p.id
JOIN public.roles r ON ur.role_id = r.id
WHERE p.id = '<PROFILE_ID>';
```
*Resultado esperado: Una fila mostrando el rol `super_admin` con scope `global` y scope_id NULL.*

### 2. Verificar funciones helper de seguridad
Para probar el comportamiento de los helpers bajo la sesion activa del administrador, simule el contexto del usuario ejecutando:

```sql
-- Simular sesion activa del administrador en la conexion actual
-- Reemplace '<AUTH_USER_ID>' por el UUID del usuario de Auth creado
SET LOCAL request.jwt.claim.sub = '<AUTH_USER_ID>';

-- Comprobar si el helper resuelve correctamente el profile_id
SELECT public.current_profile_id() AS resolucion_perfil;
-- Resultado esperado: Deberia coincidir exactamente con su <PROFILE_ID>.

-- Comprobar si posee el rol super_admin
SELECT public.has_role('super_admin') AS es_super_admin;
-- Resultado esperado: true.

-- Comprobar si el sistema lo reconoce como administrador
SELECT public.is_admin() AS es_administrador;
-- Resultado esperado: true.

-- Comprobar si posee permisos para leer logs de auditoria
SELECT public.can_read_audit_logs() AS puede_leer_logs;
-- Resultado esperado: true.
```

### 3. Verificar aislamiento de Politica de Auditoria
Asegurese de que la politica RLS de logs de auditoria permite la visualizacion bajo el contexto de administrador:

```sql
-- Ejecutar select sobre logs simulando la sesion activa
SELECT * FROM public.audit_logs LIMIT 5;
-- Resultado esperado: Sin errores de base de datos (retornando vacio si no hay logs insertados).
```

---

## 6. Procedimiento de Rollback (Deshacer Cambios)

En caso de requerir la suspension, eliminacion o correccion de la cuenta inicial por configuracion defectuosa o errores de digitacion:

### Paso 1: Inhabilitar el Perfil (Recomendado para Preservar Trazabilidad)
Para evitar la perdida de datos y mantener los registros historicos de auditoria intactos, cambie el estado del perfil a `'suspended'` o `'deleted'`:

```sql
UPDATE public.profiles 
SET status = 'suspended' 
WHERE id = '<PROFILE_ID>';
```

### Paso 2: Remover Asignacion de Roles
Si requiere retirar los permisos de administracion de forma inmediata:

```sql
DELETE FROM public.user_roles 
WHERE profile_id = '<PROFILE_ID>' AND role_id = '<ROLE_ID>';
```

### Paso 3: Eliminacion Fisica (Solo para Re-inicializacion Completa en Entorno Dev)
Si necesita limpiar por completo el registro para re-iniciar el bootstrap:

```sql
-- 1. Eliminar asignacion de roles
DELETE FROM public.user_roles WHERE profile_id = '<PROFILE_ID>';

-- 2. Eliminar perfil logico
DELETE FROM public.profiles WHERE id = '<PROFILE_ID>';

-- 3. Eliminar usuario en Supabase Auth
-- La eliminacion fisica del usuario en auth.users debe ejecutarse desde el panel web de Supabase 
-- (Authentication > Users > Delete User) para asegurar la cascada y borrado de metadatos criptograficos.
```

---

## 7. Criterios de Aceptacion Operativa

El bootstrap se considera exitoso y aprobado cuando:
- Existe un registro activo en `public.profiles` cuyo `status` es `'active'` y esta asociado al UUID de Supabase Auth del operador.
- Existe un registro en `public.user_roles` que vincula el perfil con el rol `super_admin`.
- El campo `scope_type` es estrictamente `'global'` y `scope_id` es `NULL`.
- Las funciones helper `has_role('super_admin')` e `is_admin()` devuelven `true` al simular la sesion del administrador.
- El helper `can_read_audit_logs()` devuelve `true` bajo la sesion del administrador.
- **Validacion de Limpieza**: Ningun archivo versionado de Git contiene UUIDs, correos reales o secretos commiteados tras finalizar la operacion.

---

## 8. Criterios sobre lo que este Runbook NO Realiza

Para mayor claridad operativa, este documento:
- **No crea usuarios de forma automatica**: El registro de Auth debe ser gatillado interactivamente por el operador.
- **No inserta datos reales**: Todo identificador y correo se representa mediante placeholders abstractos.
- **No crea archivos de migracion SQL**: No altera el esquema fisico de la base de datos local ni remota.
- **No modifica codigo fuente**: Ninguna pantalla o modulo de Next.js es alterado.
- **No utiliza Supabase CLI**: Se apoya exclusivamente en el panel y SQL editor web de Supabase dev.
- **No guarda secretos**: No se persisten contraseñas ni service keys en la documentacion.
