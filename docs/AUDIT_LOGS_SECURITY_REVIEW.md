# Revision de Seguridad del Modelo de Auditoria y Trazabilidad (pre-migracion) — La Gauchita Federal

> [!IMPORTANT]
> Este documento tecnico es una especificacion de diseño de seguridad y datos previa a la creacion de la tabla de logs de auditoria.
> **No se deben generar archivos `.sql` reales, ejecutar Supabase CLI ni alterar la base de datos en esta tarea.**

---

## 1. Analisis del Modelo de Auditoria

### 1.1. Proposito General
El modelo de auditoria y trazabilidad de **La Gauchita Federal** tiene como finalidad registrar de forma inalterable y auditable cada una de las mutaciones de datos y eventos criticos del sistema. Esto permite garantizar la transparencia editorial, la rendicion de cuentas de los distintos roles de usuario y la proteccion contra manipulaciones o accesos no autorizados. En un sistema federal con multiples niveles de privilegios (editores municipales, provinciales, federales, administradores y colaboradores), la auditoria actua como la ultima linea de defensa y control reputacional de la informacion publica e institucional.

### 1.2. Eventos a Auditar
El sistema debe estar preparado para capturar logs detallados ante las siguientes acciones clave:
- **Cambios de roles de usuario**: Asignacion o revocacion de roles y scopes territoriales en `user_roles`.
- **Cambios de estado de perfiles**: Activacion, inactivacion, suspension o borrado de cuentas en `profiles`.
- **Acciones sobre contenidos**: Creacion, edicion, modificacion de estado editorial (borrador, revision, publicado, rechazado, archivado) en `contents`.
- **Cambios sobre instituciones**: Registro, modificacion de datos o cambio de estado de escuelas, museos, bibliotecas y peñas.
- **Cambios sobre miembros institucionales**: Altas, bajas o modificaciones de permisos en `institution_members`.
- **Cambios sobre archivos y media_assets**: Subidas, eliminaciones logicas, cambios de derechos de propiedad (`rights_status`) o visibilidad de archivos multimedia.
- **Cambios sobre reconocimientos**: Registro, edicion, destaque (`is_featured`) o modificacion de estado de distinciones en `recognitions`.
- **Cambios de visibilidad**: Alteraciones de visibilidad (`public`, `subscribers`, `institutional`, `private`) en cualquier entidad principal.
- **Cambios de membresia**: Modificaciones en el nivel de suscripcion y privilegios de acceso de los perfiles.
- **Intentos administrativos relevantes**: Acciones de configuracion global de la plataforma, bloqueo de perfiles y bypasses editoriales controlados.

---

## 2. Especificacion de Estructura de Datos (Futura Tabla `audit_logs`)

### 2.1. Estructura Sugerida de Campos
* `id` (UUID, PK, default `gen_random_uuid()`): Identificador unico del log de auditoria.
* `actor_profile_id` (UUID, FK a `profiles(id)`, opcional): ID del perfil del usuario autenticado que realiza la accion.
* `actor_auth_user_id` (UUID, opcional): ID de usuario de Supabase Auth (`auth.users.id`) que realiza la accion, util para rastrear sesiones activas.
* `action` (TEXT, obligatorio): Tipo de operacion realizada.
* `entity_table` (TEXT, obligatorio): Nombre de la tabla del sistema afectada (ej: `'contents'`, `'user_roles'`).
* `entity_id` (UUID, obligatorio): Identificador unico del registro afectado.
* `previous_data` (JSONB, opcional): Estado de las columnas antes del cambio.
* `new_data` (JSONB, opcional): Estado de las columnas despues del cambio.
* `reason` (TEXT, opcional): Justificacion escrita para cambios de moderacion o configuracion administrativa.
* `ip_address` (TEXT, opcional): Direccion IP de procedencia de la peticion.
* `user_agent` (TEXT, opcional): Cadena de agente de usuario del navegador del actor.
* `created_at` (TIMESTAMPTZ, default `now()`): Fecha y hora del registro del log.

### 2.2. Valores Sugeridos para `action`
* `create`: Insercion de nuevos registros.
* `update`: Modificacion de registros existentes.
* `delete`: Eliminacion (normalmente logica) de registros.
* `publish`: Transicion de estado de contenido o reconocimiento a publicado/activo.
* `archive`: Retirada logica de registros del ambito publico.
* `reject`: Rechazo de una propuesta de contenido o distincion.
* `restore`: Recuperacion de un elemento previamente archivado o inhabilitado.
* `assign_role`: Otorgamiento de un nuevo rol o alcance en el sistema.
* `revoke_role`: Eliminacion de un rol de usuario existente.
* `change_visibility`: Modificacion en las restricciones de lectura (`visibility`).
* `change_status`: Cambios de estado en perfiles o instituciones.
* `upload`: Carga fisica de archivos multimedia a Supabase Storage.
* `review`: Evaluacion de propuestas por parte de moderadores o revisores.
* `other`: Acciones no estandarizadas que requieran registro.

### 2.3. Entidades Auditables
* `profiles` (Cambios de membresia o estados de cuenta).
* `user_roles` (Ascensos, cambios de jurisdiccion territorial).
* `institutions` (Registro, suspension de instituciones).
* `institution_members` (Roles internos de instituciones).
* `contents` (Flujo editorial del CMS).
* `media_assets` (Metadatos de almacenamiento).
* `recognitions` (Trayectorias y premios).
* *Future Storage Objects* (Carga/borrado fisico en Supabase Storage buckets).
* *Future Subscriptions* (Altas/bajas y renovaciones).
* *Future Payments* (Transacciones de patrocinio).
* *Future Admin Settings* (Variables de configuracion global).

---

## 3. Analisis de Riesgos de Seguridad y Privacidad

El almacenamiento de registros de auditoria expone al sistema a riesgos especificos que deben ser prevenidos:
1. **Manipulacion o Borrado de Logs**: Un atacante con privilegios elevados o un administrador deshonesto borrando logs para ocultar acciones maliciosas.
   - *Mitigacion*: RLS deniega por completo las operaciones `UPDATE` y `DELETE` para cualquier rol. La insercion se realiza unicamente por triggers o funciones SQL definidas con privilegios de sistema (`SECURITY DEFINER`).
2. **Exposicion de Datos Personales en `previous_data` o `new_data`**: Registrar contraseñas hashed, tokens de sesion, correos electronicos privados o telefonos dentro del dump JSONB.
   - *Mitigacion*: Filtrado estricto a nivel de triggers. El JSONB guardado solo debe capturar campos publicos o no sensibles del dominio, excluyendo columnas confidenciales de perfiles o autenticacion.
3. **Almacenamiento Excesivo de Informacion Sensible**: Registrar el cuerpo completo de un articulo largo (`body` en contents) en cada edicion menor, saturando el almacenamiento de la base de datos.
   - *Mitigacion*: Almacenar unicamente las diferencias (`diff`) de las columnas modificadas o guardar solo claves primarias y campos de estado del CMS en lugar de todo el cuerpo del texto.
4. **Falta de Trazabilidad sobre Cambios Criticos**: Modificar el rol de un usuario sin dejar constancia del actor que aprobo la promocion.
   - *Mitigacion*: Restricciones de base de datos que obliguen a registrar al `actor_profile_id` en cada mutacion de `user_roles`.
5. **Uso de `audit_logs` como Fuente Publica**: Vulnerabilidad de control de acceso que permita a cualquier usuario leer el historial de log.
   - *Mitigacion*: Politicas RLS estrictas y configuracion de esquemas que denieguen el acceso `SELECT` general.
6. **Crecimiento Excesivo de la Tabla**: Una tabla de logs con millones de filas que degrade el rendimiento general de PostgreSQL.
   - *Mitigacion*: Indices optimizados, consideracion de particionamiento de tablas por año y planificacion de politicas de retencion y purga historica (ej: archivar logs de mas de 2 años).
7. **Dificultad para Reconstruir Cambios Editoriales**: Logs vagos que solo digan "update" sin especificar si cambio el titulo o se aprobo para publicacion.
   - *Mitigacion*: Utilizar el campo `action` con verbos especificos como `'publish'` o `'reject'` en lugar de un `'update'` generico.
8. **Falta de Responsable Identificable**: Operaciones realizadas por el sistema o procesos automaticos sin un ID de actor.
   - *Mitigacion*: Definir un rol de sistema o ID nulo controlado que indique que la accion fue gatillada por un trigger o evento interno.

---

## 4. Criterios de Privacidad y Acceso

1. **Aislamiento Total del Publico**: La tabla `audit_logs` y sus vistas asociadas estan completamente ocultas de accesos externos basicos.
2. **Denegacion de Acceso Anonimo y Comun**:
   - `anon` no posee ningun permiso sobre la tabla (lectura, escritura o borrado).
   - `authenticated` (suscriptores, colaboradores, editores institucionales) no posee permisos de lectura general.
3. **Restriccion Administrativa**: Solo los roles `general_admin` o `super_admin` con credenciales validas podran realizar consultas de lectura (`SELECT`) sobre los logs.
4. **Prevencion de Registro de Secretos**: Ninguna funcion de base de datos o backend debe volcar credenciales, claves API, tokens JWT o informacion confidencial de pago en las columnas de datos.
5. **Retencion y Limpieza Controlada**: Se debe diseñar en una fase posterior una tarea programada (cron job) para transferir logs antiguos a un almacenamiento frio (cold storage) o eliminarlos tras cumplir el periodo legal de conservacion.

---

## 5. Criterios de Politicas RLS Futuras

La futura implementacion de Row Level Security para la tabla de logs se basara en los siguientes lineamientos:
- **`ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;`**
- **Lectura Restringida**:
  - Las politicas de `SELECT` solo permitiran la lectura a usuarios autenticados cuyos claims en JWT coincidan con `super_admin` o `general_admin`.
- **Denegacion de Modificacion Directa**:
  - Las operaciones `UPDATE` y `DELETE` estaran explicitamente denegadas para todos los usuarios sin excepcion. Los registros son permanentes y de solo adicion.
- **Insercion Controlada**:
  - La operacion `INSERT` estara denegada para conexiones directas de clientes.
  - La creacion de registros se realizara exclusivamente mediante funciones de base de datos seguras (`SECURITY DEFINER`) ejecutadas bajo el rol del sistema o triggers internos que bypassen RLS.
- **Trazabilidad Indivdual de Administradores**:
  - Un administrador no podra modificar sus propios logs de acciones pasadas ni eliminar su historial de intervenciones.

---

## 6. Estrategia Tecnica Propuesta

Para una implementacion limpia y escalable de la auditoria en la nube de Supabase:
1. **Creacion de la Tabla**: Instanciar `audit_logs` como una tabla relacional tradicional con tipos de datos adecuados e indices clave.
2. **Indices de Alto Rendimiento**:
   - Indices por `entity_table` y `entity_id` para buscar el historial de un objeto especifico.
   - Indices por `actor_profile_id` para auditar el comportamiento de un usuario especifico.
   - Indices por `action` y `created_at` para reportes cronologicos de actividad.
3. **Funciones Helper**: Crear una funcion centralizada `public.log_audit_event` declarada como `SECURITY DEFINER` que capture el actor usando `auth.uid()`, resuelva su `profile_id` de forma interna e inserte de manera segura el registro en `audit_logs`.
4. **Enfoque Hibrido para Triggers**:
   - En lugar de aplicar triggers complejos en todas las tablas del sistema (lo cual puede ralentizar transacciones sencillas y dificultar migraciones), se priorizaran triggers en tablas criticas de seguridad: `user_roles` y `profiles`.
   - Para flujos editoriales en `contents` y `recognitions`, se registraran los logs directamente mediante llamadas a la funcion helper desde la API del backend o funciones de moderacion.
5. **JSONB Acotado**: Las columnas `previous_data` y `new_data` utilizaran funciones como `jsonb_build_object` o recortes especificos para persistir unicamente las columnas alteradas en lugar de clonar el registro entero.

---

## 7. Proximos Pasos de la Implementacion

Esta revision no realiza modificaciones fisicas sobre la base de datos ni crea recursos de almacenamiento. La proxima migracion a redactar se denominará:

```txt
supabase/migrations/0008_create_audit_logs.sql
```

Dicha migracion instanciara fisicamente la tabla `audit_logs`, los indices de rendimiento necesarios para consultas de monitoreo, y habilitara el aislamiento RLS preliminar junto con sus correspondientes grants.
