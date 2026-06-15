# Revision de Seguridad de Funciones Helper de Permisos y Roles (pre-migracion) — La Gauchita Federal

> [!IMPORTANT]
> Este documento tecnico es una especificacion de diseño de seguridad y datos previa a la creacion de funciones de validacion de permisos y roles en base de datos.
> **No se deben generar archivos `.sql` reales, ejecutar Supabase CLI ni alterar la base de datos en esta tarea.**

---

## 1. Analisis y Proposito de los Helpers de Permisos

### 1.1. Proposito General
Las funciones helper de permisos en **La Gauchita Federal** tienen como objetivo encapsular y centralizar la logica de autorizacion y resolucion de roles del sistema a nivel de base de datos PostgreSQL. Estas funciones permiten simplificar la redaccion de politicas RLS, optimizar las consultas de validacion y asegurar que las reglas de negocio de acceso se apliquen de forma uniforme en toda la plataforma.

### 1.2. Necesidad del Diseño Centralizado
El uso de funciones helper es fundamental para resolver los siguientes problemas y requerimientos de ingenieria:
- **Seguridad en Row Level Security (RLS)**: Las politicas RLS pueden volverse excesivamente complejas, redundantes y propensas a errores si cada tabla evalua de forma ad-hoc el rol del usuario actual.
- **Administracion Centralizada**: Permite modificar la jerarquia o definicion de un permiso en un unico lugar en vez de reescribir docenas de politicas en produccion.
- **Edicion Institucional**: Simplifica la comprobacion de si un usuario pertenece a una escuela, peña o biblioteca (`institution_members`) y que rol posee.
- **Edicion Territorial**: Facilita la validacion de alcances locales (`municipality_id`), provinciales (`province_id`) o regionales (`region_id`) para los editores.
- **Revision de Contenidos**: Agiliza la validacion de si un moderador tiene asignado el rol de revisor para el tipo de contenido propuesto.
- **Publicacion Controlada**: Asegura que el cambio de estado de un articulo a `'published'` sea auditado y verificado frente a los privilegios territoriales.
- **Gestion de Auditoria**: Restringe de manera segura el acceso a los historiales de logs unicamente a perfiles administrativos.
- **Evitar la Recursion Infinita en RLS**: Un error comun en Supabase es la evaluacion cruzada infinita de politicas (ej: validar el perfil leyendo la tabla de roles, y la tabla de roles requiere validar el perfil). Las funciones helper definidas como `SECURITY DEFINER` de forma controlada pueden resolver esto de manera limpia.

---

## 2. Matriz de Roles Previstos en el Dominio

La Gauchita Federal opera bajo una taxonomia de roles estructurada jerarquicamente y por alcances territoriales:
1. **`visitor`**: Usuario anonimo no registrado. Lectura publica general.
2. **`subscriber`**: Usuario autenticado. Acceso a contenidos premium.
3. **`cultural_collaborator`**: Autores independientes y docentes. Creacion de borradores.
4. **`validated_institution`**: Cuentas institucionales validadas de escuelas, museos, etc.
5. **`reviewer`**: Moderadores academicos y de contenido. Evaluacion de borradores.
6. **`municipal_editor`**: Editores de contenido limitados a un municipio.
7. **`provincial_editor`**: Editores con alcance en una provincia completa.
8. **`federal_editor`**: Editores generales con alcance nacional sin restricciones territoriales.
9. **`general_admin`**: Administradores de la plataforma (gestion de usuarios e instituciones).
10. **`super_admin`**: Administradores de infraestructura, mantenimiento y bypass total.

---

## 3. Especificacion de Futuras Funciones Helper

Se proponen las siguientes firmas y comportamientos para las futuras funciones de validacion en PostgreSQL:

### 3.1. Funciones de Contexto y Rol Basico
- **`current_profile_id() RETURNS UUID`**: Resuelve el `id` de la tabla `public.profiles` del usuario autenticado en base a su `auth.uid()`.
- **`has_role(role_code TEXT) RETURNS BOOLEAN`**: Evalua si el usuario autenticado posee asignado el rol indicado de alcance global.
- **`has_any_role(role_codes TEXT[]) RETURNS BOOLEAN`**: Comprueba si el usuario autenticado posee al menos uno de los roles provistos en el arreglo.

### 3.2. Funciones de Administracion
- **`is_super_admin() RETURNS BOOLEAN`**: Retorna true si el usuario actual posee el rol `super_admin` con privilegios globales.
- **`is_general_admin() RETURNS BOOLEAN`**: Retorna true si el usuario posee el rol `general_admin` o `super_admin`.
- **`is_admin() RETURNS BOOLEAN`**: Retorna true si el usuario es administrador general o super_admin.

### 3.3. Funciones de Alcance Institucional y de Moderacion
- **`can_manage_institution(institution_id UUID) RETURNS BOOLEAN`**: Evalua si el usuario es administrador (`'admin'`), propietario (`'owner'`) o miembro editor autorizado de la institucion indicada.
- **`can_review_content(content_id UUID) RETURNS BOOLEAN`**: Comprueba si el usuario actual posee permisos territoriales o institucionales validos para actuar como revisor sobre el contenido indicado.
- **`can_manage_content(content_id UUID) RETURNS BOOLEAN`**: Determina si el usuario es el autor del contenido en estado borrador, o es un editor con jurisdiccion coincidente con el municipio/provincia del contenido.
- **`can_publish_content(content_id UUID) RETURNS BOOLEAN`**: Valida si el usuario actual posee el rol de editor territorial (provincial/federal) necesario para cambiar el estado de un contenido a publicado.
- **`can_manage_recognition(recognition_id UUID) RETURNS BOOLEAN`**: Determina si el usuario es el creador del registro del reconocimiento, o pertenece a la institucion que lo otorga, o posee rol de editor.
- **`can_read_audit_logs() RETURNS BOOLEAN`**: Valida si el usuario posee rol administrativo explico (`general_admin` o `super_admin`) para consultar la tabla `audit_logs`.

---

## 4. Criterios de Seguridad de las Funciones

Para evitar vulnerabilidades de elevacion de privilegios o ejecucion insegura, se establecen las siguientes directrices de programacion en PostgreSQL:
1. **Uso Restringido de `SECURITY DEFINER`**:
   - Por defecto, las funciones deben declararse como `SECURITY INVOKER` para ejecutar con los privilegios del usuario conectado.
   - Solo se utilizara `SECURITY DEFINER` de forma excepcional cuando la funcion deba bypassear politicas RLS de tablas internas (como `user_roles` o `profiles`) para evitar bucles recursivos en RLS.
2. **search_path Seguro Obligatorio**:
   - Toda funcion declarada como `SECURITY DEFINER` debe fijar obligatoriamente un `search_path` de forma explicita (ej: `SET search_path = public, pg_temp`) para evitar ataques de busqueda y secuestro de funciones (`search_path hijacking`).
3. **No Exposicion de Datos Sensibles**:
   - Las funciones de validacion deben retornar valores booleanos (`BOOLEAN`) o identificadores (`UUID`) especificos. Bajo ninguna circunstancia deben volcar registros completos de roles, contraseñas o datos personales.
4. **Evitar la Escalacion Accidental de Privilegios**:
   - Controlar estrictamente los `GRANT` de ejecucion sobre estas funciones. Las funciones administrativas no deben ser ejecutables por usuarios anónimos.
5. **Simplicidad y Auditabilidad**:
   - El codigo de las funciones debe ser minimalista, evitando logicas de negocio difusas que dificulten las pruebas y la auditoria de base de datos.
6. **Optimizado para RLS**:
   - Las consultas internas de las funciones deben estar optimizadas con indices adecuados en `user_roles(profile_id, role_id)` para asegurar tiempos de respuesta infimos durante las consultas de RLS.

---

## 5. Analisis de Riesgos de Implementacion

Se identifican las siguientes amenazas de diseño para las funciones helper:
1. **Configuracion Erronea de `SECURITY DEFINER`**: Una funcion de escritura declarada como `SECURITY DEFINER` que permita a un colaborador basico promover su propio rol.
   - *Mitigacion*: Las funciones helper iniciales deben ser estrictamente de solo lectura de permisos. No deben existir helpers de modificacion de datos en la primera fase.
2. **Vulnerabilidad por search_path Inseguro**: Omision de la clausula `SET search_path` en funciones `SECURITY DEFINER`.
   - *Mitigacion*: Control estricto de sintaxis en el codigo SQL de la migración y revision automatizada.
3. **Recursion RLS por Helpers de Consulta Directa**: Helpers que consultan una tabla y la politica RLS de esa tabla consulta el mismo helper.
   - *Mitigacion*: Las funciones helper de RLS deben interactuar con tablas basicas usando tecnicas de deshabilitacion temporal de RLS o consultas directas internas validadas.
4. **Grants Excesivos**: El rol `anon` ejecutando de forma directa helpers de validacion de roles administrativos para deducir la estructura del sistema.
   - *Mitigacion*: Revocar implicitamente todos los privilegios a `public` y asignar privilegios selectivos unicamente a los roles requeridos.
5. **Mezcla Inadecuada de Permisos (Global vs Local)**: Confundir un permiso global con uno territorial (ej: un editor municipal de Salta editando contenido de Jujuy).
   - *Mitigacion*: Validar explicitamente la correspondencia territorial (`scope_type = 'municipality' AND scope_id = target_municipality_id`).

---

## 6. Estrategia y Alcance Futuro de Jerarquia de Permisos

### 6.1. Jerarquia de Alcances (Scopes)
Para el modelado fisico en `user_roles`, se deben contemplar los siguientes niveles de alcance:
- **`global`**: El rol se aplica a toda la plataforma nacional (ej: `super_admin`, `federal_editor`).
- **`region`**: Limitado a una region geografica (ej: Noroeste Argentino).
- **`province`**: Restringido a una provincia especifica (ej: Provincia de Salta).
- **`municipality`**: Restringido a un municipio local (ej: San Lorenzo).
- **`institution`**: Restringido a una escuela, biblioteca o museo validado.

### 6.2. Hoja de Ruta de Implementacion
1. **Comenzar con Helpers de Solo Lectura**: Implementar primero funciones de obtencion del perfil actual y comprobacion basica de roles.
2. **Preservar user_roles como Fuente de Verdad**: La tabla `user_roles` mapeada con indices de rendimiento seguira siendo la unica fuente autoritativa.
3. **Migracion Progresiva**: No sobreescribir todas las politicas RLS actuales de inmediato. Se implementaran las funciones en un archivo nuevo y se iran acoplamiento de forma paulatina en las politicas RLS de contenidos, reconocimientos y logs de auditoria.

---

## 7. Proximos Pasos de la Implementacion

Esta revision no realiza modificaciones fisicas sobre la base de datos ni crea recursos de almacenamiento o funciones SQL. La proxima migracion a redactar se denominará:

```txt
supabase/migrations/0009_create_permission_helpers.sql
```

Dicha migracion sera la encargada de instanciar las firmas plpgsql de las funciones helper, asegurar sus configuraciones de search_path y seguridad, y otorgar los privilegios selectivos adecuados a los roles operativos del sistema.
