# Estructura Local de Migraciones — La Gauchita Federal

> [!IMPORTANT]
> Este directorio contiene el andamiaje local para la gestión de migraciones y esquemas de base de datos utilizando **Supabase CLI**.
> **No se deben crear migraciones SQL activas, inicializar el CLI o conectar la base de datos en esta tarea.**

## Especificaciones del Estado de la Base de Datos

- **Migraciones Futuras**: Este directorio contendrá la secuencia ordenada de archivos de migración `.sql` para versionar la base de datos del proyecto.
- **Sin Migraciones SQL Reales**: Todavía no se han creado archivos `.sql` de migración en esta carpeta.
- **Sin Ejecución del CLI**: No se ha ejecutado el comando `supabase init` ni ningún comando de Supabase CLI en este workspace.
- **Sin Proyecto Remoto Conectado**: No se ha enlazado el CLI local a ningún proyecto en la nube de Supabase.
- **Sin Tablas ni Políticas**: No se han creado tablas físicas, triggers o políticas RLS en base de datos.

## Directrices para Futuras Migraciones

1. **Alineación con el Modelo de Datos**: Las futuras migraciones relacionales y PostGIS deberán partir estrictamente del documento técnico de diseño [DATA_MODEL_V1.md](file:///e:/DEV/PROYECTOS/LA_GAUCHITA_FEDERAL/base/02_codigo/app/docs/DATA_MODEL_V1.md).
2. **Alineación con la Estrategia RLS**: Las futuras directivas de seguridad a nivel de fila y asignación de permisos deberán partir estrictamente de la especificación [SECURITY_RLS_STRATEGY.md](file:///e:/DEV/PROYECTOS/LA_GAUCHITA_FEDERAL/base/02_codigo/app/docs/SECURITY_RLS_STRATEGY.md).
3. **Revisión Obligatoria**: Toda migración redactada en SQL debe someterse a una revisión técnica de pares y validación sintáctica local antes de ser desplegada.
4. **Ciclo de Despliegue**:
   - Toda migración se aplicará y probará en primera instancia en el entorno de desarrollo `la-gauchita-federal-dev`.
   - **Bajo ninguna circunstancia** se aplicarán migraciones o cambios estructurales directamente sobre la base de datos de producción (`la-gauchita-federal-prod`) sin haber completado el ciclo previo de validación en desarrollo y staging.
