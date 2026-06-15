# Revision de Seguridad para la Creacion del Administrador Inicial (pre-migracion) — La Gauchita Federal

> [!IMPORTANT]
> Este documento tecnico es una especificacion de diseño de seguridad y datos previa al establecimiento del procedimiento de bootstrap para el primer administrador.
> **No se deben crear usuarios reales, insertar datos confidenciales ni ejecutar cambios en Supabase en esta tarea.**

---

## 1. Proposito del Administrador Inicial

El primer administrador (o administrador de bootstrap) en **La Gauchita Federal** tiene como finalidad inicializar el sistema de control de accesos y moderacion editorial en entornos limpios. Dado que la plataforma opera con politicas RLS estrictas y requiere aprobaciones explicitas para activar instituciones, publicar contenidos y auditar acciones, es indispensable contar con una cuenta con privilegios globales (`super_admin`) que pueda ejecutar las primeras tareas de administracion operativa. Sus funciones clave incluyen:
* Configurar e invitar a los primeros editores territoriales (municipales y provinciales).
* Validar y activar las primeras cuentas de instituciones (escuelas, peñas, bibliotecas y museos).
* Gestionar las categorias del CMS y configuraciones globales de la aplicacion.
* Monitorear los primeros logs de auditoria para validar el correcto aislamiento del RLS.

---

## 2. Raciocinio Contra la Automatizacion Insegura (Anti-Patterns de Bootstrap)

Es una practica comun pero sumamente insegura automatizar la creacion del primer administrador mediante scripts de seed publicos o archivos SQL de migracion versionados. En **La Gauchita Federal**, se prohibe este enfoque por los siguientes motivos:
1. **Vulnerabilidad de Datos Confidenciales en Git**: Incluir correos electronicos reales, identificadores UUID fijos o credenciales de administracion en el repositorio de codigo expone al proyecto a secuestro de cuentas inmediato al pasar a produccion.
2. **Conflictos e Inconsistencias de Entorno**: Las bases de datos de desarrollo (local), staging y produccion tienen ciclos de vida independientes. Utilizar el mismo UUID de usuario para Supabase Auth en todos los entornos causa colisiones de integridad referencial.
3. **Violacion de Privacidad**: Comprometer correos personales o de la administracion cultural en el historial publico de Git infringe politicas de proteccion de datos de caracter personal (PII).
4. **Bypass del Flujo de Autenticacion**: Inyectar registros directamente en la tabla `auth.users` sin pasar por el flujo criptografico del proveedor de identidad de Supabase Auth puede generar usuarios corruptos o sin metadatos de claims necesarios.

---

## 3. Entidades Involucradas en el Bootstrap

El procedimiento de creacion e inicializacion del administrador inicial interactua con las siguientes entidades del esquema de base de datos de Supabase:
- **Supabase Auth User (`auth.users`)**: El registro del usuario gestionado por la suite de autenticacion de Supabase (proveedor GoTrue).
- **Public Profiles (`public.profiles`)**: El registro de perfil del dominio de la aplicacion que vincula al usuario de Auth (`auth_user_id`) con su informacion basica y nivel de membresia.
- **Public Roles (`public.roles`)**: La tabla catalogo de roles del sistema, en especial el registro con `code = 'super_admin'`.
- **Public User Roles (`public.user_roles`)**: La relacion que asigna al perfil el rol correspondiente (`super_admin`) con alcance global.
- **Funciones Helper de Permisos**: Funciones como `public.is_super_admin()` y `public.can_read_audit_logs()` que validaran inmediatamente el acceso.
- **Audit Logs (`public.audit_logs`)**: Registro historico inalterable que capturara las subsiguientes acciones administrativas para garantizar la trazabilidad operativa.

---

## 4. Procedimiento Conceptual Recomendado (Bootstrap Controlado)

Para inicializar el primer administrador sin comprometer secretos ni datos sensibles, se sugeriere el siguiente flujo de ejecucion manual supervisado por un DevOps:

1. **Creacion en Supabase Auth**: Crear el usuario administrador utilizando la interfaz de consola de la nube de Supabase (seccion *Authentication -> Users -> Add User*) o a traves del comando controlado local de Supabase CLI en fase de desarrollo. Esto asegura que Supabase encripte la contraseña y configure los claims iniciales del JWT de forma nativa.
2. **Obtencion del Identificador**: Recuperar el UUID autogenerado de la columna `id` de la tabla `auth.users` para el usuario creado, sin exponerlo en variables de entorno o repositorios.
3. **Asociacion del Perfil**: Insertar manualmente en la tabla `public.profiles` un registro asociado al `auth_user_id` obtenido, asegurando que el campo `status` se establezca como `'active'`.
4. **Asignacion del Rol Global**:
   - Localizar el UUID de la tabla `public.roles` que posea el `code = 'super_admin'`.
   - Insertar un registro en `public.user_roles` enlazando el `profile_id` del administrador con el `role_id` de `super_admin`.
   - Configurar obligatoriamente el campo `scope_type = 'global'` y mantener `scope_id = NULL` para denotar que sus facultades no estan acotadas a ningun territorio o institucion.
   - Dejar el campo `created_by` como `NULL` para documentar a nivel de base de datos que el registro corresponde a una inicializacion de bootstrap del sistema.
5. **Verificacion Operativa**: Loguearse en la plataforma con las credenciales creadas y verificar mediante consolas de testeo que las funciones helper (como `current_profile_id()`, `has_role('super_admin')` y `can_read_audit_logs()`) retornen true, permitiendo la lectura exitosa de logs de auditoria.

---

## 5. Decisiones Arquitectonicas Recomendadas

- **Rol Inicial del Bootstrap**: `super_admin` (alcance de control total de infraestructura y politicas).
- **Tipo de Alcance**: `global` (acceso a todos los municipios, provincias y recursos).
- **ID de Alcance**: `NULL` (sin restricciones geograficas).
- **No Automatizacion en Git**: La creacion del usuario y asignacion del rol administrativo debe documentarse como un procedimiento de despliegue manual en produccion y desarrollo, prohibiendo seeds hardcodeados en codigo fuente versionado.

---

## 6. Analisis de Riesgos de Operacion

Se identifican los siguientes riesgos operativos durante la fase de bootstrap:
1. **Exposicion de Credenciales en Git**: Registrar correos electronicos reales o variables de entorno confidenciales en commits.
   - *Mitigacion*: Uso de variables de entorno locales no commiteadas (`.env.local` excluido en `.gitignore`) y creacion manual en paneles interactivos.
2. **Creacion de Administradores Accidentales en Produccion**: Ejecutar scripts de seed de prueba de desarrollo en la base de datos de produccion.
   - *Mitigacion*: Desacoplamiento total del script de seed. Los seeds de pruebas locales en desarrollo no deben contener inserciones de roles administrativos globales.
3. **Asignacion del Rol a un Usuario Incorrecto**: Copiar un UUID equivocado durante el procedimiento manual, otorgando privilegios de `super_admin` a una cuenta basica de suscriptor.
   - *Mitigacion*: Verificacion por query SQL antes y despues de la insercion en `user_roles`.
4. **Perfiles Inactivos con Roles Activos**: Suspender un perfil de usuario pero mantener su registro en `user_roles` con privilegios vigentes.
   - *Mitigacion*: Diseñar a futuro que las funciones helper validen que `profiles.status = 'active'` antes de evaluar los roles asociados.
5. **Uso Inseguro de la Service Role Key**: Utilizar la clave maestra de Supabase (`service_role`) en el codigo del frontend para forzar la creacion de perfiles.
   - *Mitigacion*: La service role key debe permanecer estrictamente en el entorno del servidor y nunca exponerse al cliente Web.
6. **Inserciones sin Trazabilidad**: Modificaciones directas en la base de datos sin dejar rastro de quien realizo la alteracion.
   - *Mitigacion*: Las mutaciones del bootstrap en `user_roles` se registran con `created_by = NULL` (bootstrap inicial) y las acciones subsiguientes seran auditadas bajo su `profile_id` correspondiente en `audit_logs`.
7. **Bucle de Conexiones por entorno equivocado**: DevOps ejecutando consultas en caliente sobre el servidor de produccion creyendo que esta en local.
   - *Mitigacion*: Forzar el uso de prompts de conexion interactivos que muestren el nombre del host actual (`la-gauchita-federal-prod` vs `local-dev`).

---

## 7. Controles de Seguridad y Checklists

Antes de proceder con el bootstrap de administradores en cualquier entorno, el operador debe cumplir con la siguiente lista de verificacion:
- [ ] **Aislamiento de Git**: Confirmar que ningun archivo con emails o claves reales se encuentre en staging de Git (`git status`).
- [ ] **Ambiente Correcto**: Verificar la URL del proyecto y el Host de base de datos de la sesion actual.
- [ ] **Verificacion de Usuario**: Confirmar que el usuario de Auth existe previamente en `auth.users`.
- [ ] **Trazabilidad del Perfil**: Asegurar que el perfil asociado en `public.profiles` este en estado `'active'`.
- [ ] **Alcance Global Estricto**: Comprobar que en `user_roles` se inserte `scope_type = 'global'` y `scope_id` sea explicitamente `NULL`.
- [ ] **Prueba de Lectura Segura**: Ejecutar el helper `can_read_audit_logs()` y certificar que devuelva `true` solo cuando la sesion activa pertenezca al administrador.

---

## 8. Consultas de Verificacion (Query templates sin datos reales)

A continuacion se presentan las consultas SQL de diagnostico recomendadas para verificar la correcta ejecucion del bootstrap:

```sql
-- 1. Verificar perfiles activos registrados en el sistema
SELECT id, auth_user_id, display_name, status 
FROM public.profiles 
WHERE status = 'active';

-- 2. Verificar los roles del sistema disponibles
SELECT id, code, name, is_active 
FROM public.roles;

-- 3. Listar las asignaciones de roles globales vigentes
SELECT ur.id, p.display_name, r.code, ur.scope_type, ur.scope_id 
FROM public.user_roles ur
JOIN public.profiles p ON ur.profile_id = p.id
JOIN public.roles r ON ur.role_id = r.id
WHERE ur.scope_type = 'global';

-- 4. Validar el profile_id de la sesion actual
SELECT public.current_profile_id();

-- 5. Comprobar si el usuario conectado posee el rol de super_admin
SELECT public.has_role('super_admin');

-- 6. Comprobar si el usuario conectado puede leer logs de auditoria
SELECT public.can_read_audit_logs();
```

---

## 9. Proximos Pasos

Esta revision no realiza modificaciones fisicas sobre la base de datos ni crea recursos de almacenamiento o cuentas de usuario. La proxima documentacion a redactar se denominará:

```txt
docs/INITIAL_ADMIN_SETUP_RUNBOOK.md
```

Dicho runbook contendra los pasos de ejecucion y los templates de consultas SQL necesarios para guiar al administrador de sistemas en el bootstrap inicial en un ambiente limpio de desarrollo o produccion de Supabase, manteniendo siempre el aislamiento de claves y metadatos de usuario confidenciales.
