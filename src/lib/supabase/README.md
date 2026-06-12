# Integración de Supabase — La Gauchita Federal

Este directorio contiene la inicialización de los clientes de Supabase para su uso en el navegador y en el servidor, junto con funciones de verificación de sanidad de entorno.

## Estado de la Integración

- **Cliente de Supabase**: Configurado e instalado mediante `@supabase/supabase-js`.
- **Ambiente de Desarrollo**: Preparado para el proyecto `la-gauchita-federal-dev`.
- **Tipo de Integración**: Mínima/Preparatoria.
- **Base de Datos**: No se han creado tablas reales en el servidor todavía.
- **Migraciones**: No se han instanciado ni ejecutado archivos de migración todavía.
- **Llaves Secretas**: **No se utiliza la Service Role Key ni ninguna clave secreta en esta fase.** Toda la comunicación inicial se realiza usando las llaves públicas.
- **Seguridad**: RLS (Row Level Security) debe ser formalmente definido e implementado en la base de datos antes de exponer o manipular información sensible.

## Verificación de Sanidad de Entorno (`healthcheck.ts`)

La función `checkSupabaseEnvironment()` de [healthcheck.ts](file:///e:/DEV/PROYECTOS/LA_GAUCHITA_FEDERAL/base/02_codigo/app/src/lib/supabase/healthcheck.ts) provee un método seguro para validar la configuración de las variables de entorno de Supabase en tiempo de ejecución:

- **Funcionamiento**: Valida de manera estricta que existan las variables de entorno requeridas en el host actual (`NEXT_PUBLIC_SUPABASE_URL` y la clave pública anónima de API). Comprueba mediante la API nativa de JavaScript `URL` que la URL del servidor posea un formato de protocolo web válido (`http:` o `https:`).
- **Aislamiento**: **No realiza llamadas de red, no realiza consultas (queries) SQL, ni interactúa con tablas de base de datos.**
- **Seguridad RLS**: Esta función **no valida permisos de RLS (Row Level Security)** en este estado del proyecto, debido a la ausencia de lógica relacional en la base de datos.
- **Tratamiento de Secretos**: Bajo ninguna circunstancia se imprimen o retornan las claves de API en la consola o en los resultados de diagnóstico. Su propósito es exclusivamente de verificación de presencia y formato (con éxito o error descriptivo).
- **Verificación de Enlace Real**: La validación de conectividad real punto a punto (de extremo a extremo) contra el servidor Supabase en la nube se programará en fases posteriores, cuando se definan las primeras tablas públicas de contenidos y se requieran lecturas reales.

## Estructura de Archivos

- [env.ts](file:///e:/DEV/PROYECTOS/LA_GAUCHITA_FEDERAL/base/02_codigo/app/src/lib/supabase/env.ts): Valida en tiempo de ejecución las variables de entorno requeridas.
- [client.ts](file:///e:/DEV/PROYECTOS/LA_GAUCHITA_FEDERAL/base/02_codigo/app/src/lib/supabase/client.ts): Exporta el cliente singleton de Supabase para componentes del lado del cliente (`"use client"`).
- [server.ts](file:///e:/DEV/PROYECTOS/LA_GAUCHITA_FEDERAL/base/02_codigo/app/src/lib/supabase/server.ts): Exporta una función helper para instanciar clientes de Supabase en Server Components, Server Actions o API Routes.
- [healthcheck.ts](file:///e:/DEV/PROYECTOS/LA_GAUCHITA_FEDERAL/base/02_codigo/app/src/lib/supabase/healthcheck.ts): Diagnóstico preventivo de configuración de variables de entorno de Supabase.
