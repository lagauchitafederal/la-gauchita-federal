# Integración de Supabase — La Gauchita Federal

Este directorio contiene la inicialización de los clientes de Supabase para su uso en el navegador y en el servidor.

## Estado de la Integración

- **Cliente de Supabase**: Configurado e instalado mediante `@supabase/supabase-js`.
- **Ambiente de Desarrollo**: Preparado para el proyecto `la-gauchita-federal-dev`.
- **Tipo de Integración**: Mínima/Preparatoria.
- **Base de Datos**: No se han creado tablas reales en el servidor todavía.
- **Migraciones**: No se han instanciado ni ejecutado archivos de migración todavía.
- **Llaves Secretas**: **No se utiliza la Service Role Key ni ninguna clave secreta en esta fase.** Toda la comunicación inicial se realiza usando las llaves públicas.
- **Seguridad**: RLS (Row Level Security) debe ser formalmente definido e implementado en la base de datos antes de exponer o manipular información sensible.

## Estructura de Archivos

- [env.ts](file:///e:/DEV/PROYECTOS/LA_GAUCHITA_FEDERAL/base/02_codigo/app/src/lib/supabase/env.ts): Valida en tiempo de ejecución las variables de entorno requeridas.
- [client.ts](file:///e:/DEV/PROYECTOS/LA_GAUCHITA_FEDERAL/base/02_codigo/app/src/lib/supabase/client.ts): Exporta el cliente singleton de Supabase para componentes del lado del cliente (`"use client"`).
- [server.ts](file:///e:/DEV/PROYECTOS/LA_GAUCHITA_FEDERAL/base/02_codigo/app/src/lib/supabase/server.ts): Exporta una función helper para instanciar clientes de Supabase en Server Components, Server Actions o API Routes.
