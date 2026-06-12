# Plan de Implementación V1 — La Gauchita Federal

Este documento establece el roadmap técnico estructurado en fases sucesivas para la construcción del portal **La Gauchita Federal**, posterior al cierre de la etapa inicial de preparación de entorno (Fase 0).

---

## 1. Roadmap Técnico de Implementación

### Fase 0: Cierre de Base y GitHub Remoto
- **Objetivo**: Garantizar el andamiaje del proyecto Next.js 16 con carpetas modulares creadas, tipado TypeScript estricto preliminar y documentos de diseño base aprobados.
- **Entregables**: Carpetas creadas en `src/`, tipos base en `src/types/core.ts` y archivos `.gitkeep` registrados en el repositorio local.
- **Criterios de Aceptación**: Compilación exitosa, sin errores de ESLint, sin secretos expuestos.
- **Riesgos**: Confusión sobre permisos de archivos locales en la estación de desarrollo (Mitigación: uso de rutas explícitas y confirmación por el usuario).

### Fase 1: Supabase Dev y Variables de Entorno
- **Objetivo**: Inicializar el proyecto `la-gauchita-federal-dev` en la nube de Supabase y configurar los adaptadores/clientes locales.
- **Entregables**: Creación del cliente Supabase del navegador y del servidor en `src/lib/supabase/client.ts` y `server.ts`. Configuración de variables de entorno locales mediante archivo `.env.local` creado por el usuario.
- **Criterios de Aceptación**: Conexión de prueba exitosa (lectura/escritura) sin fugas de secretos en el cliente.
- **Riesgos**: Fuga accidental de la `service_role` key en el bundle de cliente (Mitigación: validación estricta y bloqueo de prefijo `NEXT_PUBLIC_`).

### Fase 2: Sistema Visual y Layout Base
- **Objetivo**: Configurar el motor estético del portal (inspiración andina, colores tierra, folklore) y establecer la estructura global responsiva del sitio.
- **Entregables**: Configuración de tokens de diseño `@theme` en `src/app/globals.css` utilizando Tailwind CSS v4. Implementación del Layout raíz en `src/app/layout.tsx` (Navbar, Sidebar móvil, Footer).
- **Criterios de Aceptación**: Renderizado adaptativo sin saltos acumulativos de diseño (CLS). Puntuación alta de accesibilidad en Lighthouse.
- **Riesgos**: Dificultades de compatibilidad de librerías visuales de terceros con React 19 y Next.js 16.

### Fase 3: Portal Público Inicial
- **Objetivo**: Construir la página de bienvenida (Home federal) con maquetación de secciones estáticas y carruseles temáticos preliminares.
- **Entregables**: Rutas públicas maquetadas en `src/app/page.tsx` con datos simulados locales (`src/data/mock/`).
- **Criterios de Aceptación**: Navegación fluida y carga de componentes a 60 FPS.
- **Riesgos**: Acoplamiento prematuro a llamadas asíncronas de base de datos.

### Fase 4: Modelo de Datos y Migraciones Dev
- **Objetivo**: Crear físicamente el esquema de base de datos PostgreSQL y PostGIS en `la-gauchita-federal-dev`.
- **Entregables**: Archivos de migración SQL en Supabase local/remoto que creen las 22 tablas principales y sus índices de búsqueda GiST espaciales.
- **Criterios de Aceptación**: Ejecución de migraciones sin errores. Inserción de semillas geográficas maestras (Regiones, Provincias, Municipios INDEC).
- **Riesgos**: Lentitud en joins espaciales debido a polígonos sobre-detallados.

### Fase 5: Auth y Perfiles
- **Objetivo**: Habilitar el flujo de registro, inicio de sesión y perfiles públicos de usuarios mediante Supabase Auth.
- **Entregables**: Componentes de Login/Registro en `src/components/auth/` y Middleware de redirección segura. Trigger de PostgreSQL para replicar usuarios a `profiles`.
- **Criterios de Aceptación**: Inicio de sesión exitoso, persistencia de perfiles y asignación automática de rol `'public'`.
- **Riesgos**: Vulnerabilidades en tokens JWT (Mitigación: validación del lado del servidor en Next.js Middleware).

### Fase 6: CMS Base
- **Objetivo**: Desarrollar el panel de administración centralizado para la carga y revisión de contenidos.
- **Entregables**: Ruta administrativa `/src/app/cms/` protegida por roles, formularios de creación/edición de contenidos.
- **Criterios de Aceptación**: Bloqueo estricto de acceso a roles no autorizados (revisores, colaboradores). Persistencia de contenidos en estado `'draft'`.
- **Riesgos**: Bypass de validación de roles en la API de carga (Mitigación: Validar permisos a nivel de RLS).

### Fase 7: Efemérides y Contenidos Culturales
- **Objetivo**: Implementar la lógica del núcleo funcional dinámico para contenidos y efemérides georreferenciadas.
- **Entregables**: Listados y filtros dinámicos en la home de contenidos filtrando por Fecha Actual + Localización + Acceso de Usuario.
- **Criterios de Aceptación**: Al seleccionar una provincia, se debe mostrar el contenido local de la misma, más el contenido federal superior aplicable.
- **Riesgos**: Complejidad en las queries de herencia territorial de PostGIS.

### Fase 8: Revista Digital y Publicaciones
- **Objetivo**: Desarrollar el visor de ediciones mensuales digitales de la Revista La Gauchita.
- **Entregables**: Gestión y visualización de PDFs de revistas, restringiendo las ediciones premium a usuarios con membresías de pago (`adherente` o `patrocinador`).
- **Criterios de Aceptación**: Los usuarios sin membresía premium solo leen la portada/resumen. RLS restringe el acceso al binario del PDF.
- **Riesgos**: Exposición del link del PDF en almacenamiento de Supabase sin firma temporal.

### Fase 9: Instituciones y Reconocimientos
- **Objetivo**: Vincular escuelas, bibliotecas y museos locales a la plataforma, y listar menciones o premios de trayectoria.
- **Entregables**: Panel institucional `/src/app/institution/` para la auto-gestión y carga de reconocimientos.
- **Criterios de Aceptación**: Los usuarios de una institución solo modifican los datos y reconocimientos propios.
- **Riesgos**: Usurpación de perfiles institucionales.

### Fase 10: Cartelera Docente y Carruseles Territoriales
- **Objetivo**: Implementar secciones interactivas para educadores y carruseles dinámicos alimentados territorialmente.
- **Entregables**: Cartelera de avisos educativos locales y barra de estado de efemérides provinciales/municipales.
- **Criterios de Aceptación**: Despliegue de contenidos específicos y avisos docentes por región/municipio sin solapamiento de datos.
- **Riesgos**: Saturación de peticiones SQL paralelas en la carga de la home.

### Fase 11: Staging y Beta Cerrada
- **Objetivo**: Configurar el entorno de pre-producción `la-gauchita-federal-staging` y realizar pruebas con usuarios reales (QA).
- **Entregables**: Despliegue en staging, importación de datos reales anonimizados de Revista La Gauchita, y pruebas editoriales.
- **Criterios de Aceptación**: Cero fugas de información, velocidad de renderizado óptima (Core Web Vitals en verde), aprobación por parte de la mesa editorial.
- **Riesgos**: Descubrimiento de fallos estructurales de rendimiento en bases de datos que exijan refactorización.

---

## 2. Reglas de Trabajo para Agentes (Antigravity)

1. **Una Tarea por Vez**: El agente abordará exclusivamente una sola sub-tarea acotada por mensaje. No se permite realizar implementaciones masivas multimodulares simultáneas.
2. **Ramas de Trabajo Coherentes**: Todo desarrollo se realizará en una rama específica (`feature/nombre-modulo`) derivada de `develop`. El agente **nunca** operará directamente sobre `main` o `develop`.
3. **Revisión Manual**: El agente solicitará al usuario la revisión de cambios importantes en código antes de declarar una tarea como completada.
4. **Verificación de Compilación Mandatoria**: Al concluir cualquier edición de código, el agente ejecutará de forma obligatoria `npm run lint` y `npm run build` para garantizar que la salud de compilación del repositorio es del 100%.
5. **Confirmación de Commits**: El usuario final de desarrollo es el único responsable de ejecutar `git commit`, `git add`, `git push` y fusiones de ramas (merges). El agente tiene restringido el uso de comandos Git de mutación.

---

## 3. Limitación de Alcance de la V1 (Fuera del MVP)

Para garantizar un lanzamiento estable en los plazos previstos, las siguientes características quedan explícitamente **fuera del MVP V1**:
- **Pasarelas de Pago Integradas (MercadoPago/Stripe)**: La gestión de suscripciones premium se realizará inicialmente de forma manual o mediante enlaces de transferencia bancaria directa (alias/CBU) administrados vía CMS.
- **Inteligencia Artificial Generativa**: No se incorporarán traductores automáticos, generadores de resúmenes o asistentes virtuales basados en LLMs.
- **APIs Públicas de Terceros**: No se expondrán endpoints públicos de datos para consumo externo.
- **Widgets de Redes Sociales Complejos**: La interacción social se limitará al sistema nativo de Me Gusta (`likes`) de la plataforma.
- **Base de Datos de Producción Temprana**: No se creará la instancia `la-gauchita-federal-prod` en Supabase hasta que la instancia de `staging` esté completamente estable y validada por la mesa de control editorial.
