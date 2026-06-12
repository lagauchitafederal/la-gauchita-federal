# IMPLEMENTATION_PLAN_V1 — La Gauchita Federal

## 1. Propósito del documento

Este documento define el plan técnico de implementación V1 para **La Gauchita Federal**.

La Gauchita Federal es una plataforma cultural, histórica, editorial, educativa, patrimonial, comunitaria y federal. No debe ser desarrollada como un blog simple, una landing page institucional o un portal genérico de noticias.

El objetivo de este documento es ordenar el proceso de construcción posterior a la Fase -0, estableciendo fases controladas, entregables, restricciones, criterios de aceptación y riesgos.

---

## 2. Estado actual del proyecto

La Fase -0 dejó configurada una base técnica y documental inicial.

Estado actual:

```txt
Next.js 16.2.9
React 19
TypeScript
Tailwind CSS v4
App Router
src/
Git local
Antigravity configurado con permisos controlados
Build OK
```

Documentación existente:

```txt
AGENTS.md
PROJECT_CONTEXT.md
ANTIGRAVITY_RULES.md
TASK_TEMPLATE.md
docs/PROJECT_STRUCTURE.md
docs/DATA_MODEL_V1.md
docs/SECURITY_RLS_STRATEGY.md
docs/ENVIRONMENT_STRATEGY.md
docs/IMPLEMENTATION_PLAN_V1.md
```

La rama activa de trabajo es:

```txt
feature/setup-base
```

---

## 3. Principio rector del desarrollo

El desarrollo deberá respetar el núcleo funcional del proyecto:

```txt
Fecha actual + ubicación seleccionada + nivel de usuario
```

Toda decisión técnica debe facilitar que el portal pueda mostrar contenidos históricos, culturales, editoriales, educativos e institucionales según:

1. La fecha actual o fecha asociada.
2. El territorio seleccionado.
3. El rol, permisos o nivel de membresía del usuario.

---

## 4. Regla general de alcance V1

La V1 debe demostrar valor real sin sobredimensionar el MVP.

La V1 debe incluir:

* Portal público inicial.
* Home federal.
* Sistema visual base.
* Modelo territorial relacional simple.
* Supabase dev.
* Autenticación básica.
* Perfiles.
* CMS base.
* Efemérides.
* Contenidos culturales.
* Revista digital.
* Publicaciones.
* Instituciones participantes.
* Reconocimientos.
* Cartelera docente básica.
* Carruseles básicos.
* Preparación para staging.

La V1 no debe incluir todavía:

* Pagos automáticos.
* MercadoPago.
* IA generativa editorial.
* APIs públicas.
* Widgets externos.
* RSS público.
* Webhooks.
* App móvil nativa.
* Multi-tenant SaaS.
* Marketplace cultural.
* PostGIS obligatorio.
* Geolocalización avanzada obligatoria.
* Producción definitiva.

---

## 5. Criterio territorial del MVP

La V1 utilizará un modelo territorial relacional simple basado en:

```txt
País → Región → Provincia → Municipio / Localidad
```

Para el MVP inicial, la relación territorial se resolverá mediante IDs normalizados en tablas como:

```txt
regions
provinces
municipalities
```

PostGIS queda fuera del MVP inicial.

PostGIS podrá evaluarse en una fase posterior para:

* Mapas interactivos.
* Polígonos territoriales.
* Consultas por cercanía.
* Turismo cultural.
* Rutas patrimoniales.
* Ubicación automática del usuario.
* Visualización cartográfica avanzada.

No debe tratarse como dependencia obligatoria de V1.

---

# 6. Roadmap general V1

El desarrollo se organizará en fases controladas:

```txt
Fase 0  — Cierre de base y GitHub remoto
Fase 1  — Supabase dev y variables de entorno
Fase 2  — Sistema visual y layout base
Fase 3  — Portal público inicial
Fase 4  — Modelo de datos y migraciones dev
Fase 5  — Auth y perfiles
Fase 6  — CMS base
Fase 7  — Efemérides y contenidos culturales
Fase 8  — Revista digital y publicaciones
Fase 9  — Instituciones y reconocimientos
Fase 10 — Cartelera docente y carruseles
Fase 11 — Staging y beta cerrada
```

Cada fase debe avanzar con:

1. Tarea precisa.
2. Rama controlada.
3. Revisión manual.
4. Build obligatorio.
5. Commit manual.
6. Sin deploy automático salvo autorización.

---

# 7. Fase 0 — Cierre de base y GitHub remoto

## Objetivo

Cerrar la base local actual y subir el proyecto a un repositorio remoto privado de GitHub.

## Entregables

* Repositorio privado en GitHub.
* Remote `origin` configurado.
* Ramas subidas:

  * `main`
  * `develop`
  * `feature/setup-base`
* Verificación de `.gitignore`.
* Confirmación de que no existen secretos en el repositorio.
* Primer backup de base documental.

## Restricciones

* No conectar Supabase todavía.
* No conectar Vercel todavía.
* No crear `.env` real.
* No subir credenciales.
* No hacer merge a `main` sin revisión.

## Criterios de aceptación

* `git status` limpio.
* Repositorio remoto creado.
* Ramas subidas correctamente.
* GitHub no contiene `.env`.
* Build local OK.

## Riesgos

* Subir secretos por error.
* Subir una rama equivocada.
* Mezclar historial viejo.
* Crear repositorio público accidentalmente.

---

# 8. Fase 1 — Supabase dev y variables de entorno

## Objetivo

Crear y configurar solamente el ambiente Supabase de desarrollo.

## Entregables

* Proyecto Supabase dev:

  * `la-gauchita-federal-dev`
* Variables documentadas.
* `.env.example` validado.
* `.env.local` creado manualmente por el usuario, no por Antigravity.
* Estrategia de claves clara:

  * `NEXT_PUBLIC_SUPABASE_URL`
  * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  * `SUPABASE_SERVICE_ROLE_KEY`

## Restricciones

* No crear Supabase production.
* No crear Supabase staging todavía si no es necesario.
* No exponer service role key.
* No usar service role key en cliente.
* No crear tablas todavía.
* No crear migraciones todavía.

## Criterios de aceptación

* Supabase dev creado.
* Variables locales configuradas manualmente.
* `.env.local` no aparece en Git.
* Build local OK.
* Documentación actualizada si corresponde.

## Riesgos

* Usar claves reales en archivos versionados.
* Confundir anon key con service role key.
* Conectar producción antes de tiempo.
* Delegar configuración de secretos a agentes.

---

# 9. Fase 2 — Sistema visual y layout base

## Objetivo

Crear la primera base visual del portal respetando la identidad cultural, editorial y andina del proyecto.

## Entregables

* Layout público base.
* Header.
* Footer.
* Navegación inicial.
* Tokens de color en Tailwind CSS v4.
* Estilo editorial sobrio.
* Estructura responsive.
* Página Home todavía con contenido estático o mock controlado.

## Restricciones

* No conectar Supabase.
* No crear CMS todavía.
* No implementar auth.
* No instalar librerías UI sin validación.
* No usar estética genérica de startup.
* No modificar modelo de datos.

## Criterios de aceptación

* Build OK.
* Responsive básico.
* Identidad visual alineada.
* Código organizado en `src/components/layout` y `src/components/ui`.
* Sin credenciales.
* Sin dependencias innecesarias.

## Riesgos

* Crear una estética genérica.
* Sobrecargar el Home.
* Introducir librerías incompatibles con React 19.
* Confundir diseño inicial con producto final.

---

# 10. Fase 3 — Portal público inicial

## Objetivo

Construir el primer portal público navegable con secciones estáticas o datos mock, antes de conectar la base real.

## Entregables

* Home federal inicial.
* Bloque “Un día como hoy”.
* Bloque Revista La Gauchita.
* Bloque Eduardo Ceballos.
* Bloque Instituto Cultural Andino.
* Bloque Red Federal.
* Bloque Reconocimientos.
* Bloque Cartelera docente.
* Carruseles básicos visuales.
* Selectores visuales iniciales:

  * Fecha.
  * Territorio.
  * Nivel de usuario.

## Restricciones

* No implementar consultas reales todavía.
* No conectar Supabase.
* No crear rutas CMS.
* No implementar pagos.
* No implementar IA.
* No usar contenido sin fuente.

## Criterios de aceptación

* Home navegable.
* Diseño responsive.
* Build OK.
* Componentes reutilizables.
* Sin datos sensibles.
* Sin dependencias innecesarias.

## Riesgos

* Convertir el portal en un blog común.
* Mezclar datos mock con datos reales sin control.
* Sobrecargar la portada.
* Definir mal la jerarquía visual.

---

# 11. Fase 4 — Modelo de datos y migraciones dev

## Objetivo

Crear las primeras migraciones reales en Supabase dev, partiendo de `docs/DATA_MODEL_V1.md`.

## Entregables

* Migraciones versionadas.
* Tablas territoriales.
* Tablas de roles.
* Tablas de perfiles.
* Tablas base de contenidos.
* Tablas de instituciones.
* Tablas de reconocimientos.
* Tablas de multimedia.
* Seeds mínimos para roles, membresías, regiones, provincias y categorías.

## Restricciones

* Solo Supabase dev.
* No production.
* No staging si aún no está definido.
* No PostGIS obligatorio.
* No geometrías avanzadas en MVP.
* No migraciones sin revisión.
* No RLS improvisado sin revisar `SECURITY_RLS_STRATEGY.md`.

## Criterios de aceptación

* Migraciones aplicadas en Supabase dev.
* Seeds mínimos cargados.
* No hay datos reales sensibles.
* Build OK.
* Documentación actualizada.
* RLS planificado antes de exponer datos.

## Riesgos

* Crear tablas con nombres inconsistentes.
* Usar valores técnicos en español.
* Olvidar índices.
* No contemplar RLS.
* Hacer migraciones manuales no versionadas.

---

# 12. Fase 5 — Auth y perfiles

## Objetivo

Implementar autenticación y perfiles de usuario.

## Entregables

* Supabase Auth conectado en dev.
* Login.
* Logout.
* Perfil básico.
* Lectura de sesión.
* Creación o sincronización de `profiles`.
* Middleware o helpers iniciales.
* Protección de rutas futuras.

## Restricciones

* No implementar roles complejos sin RLS.
* No usar service role en cliente.
* No exponer datos personales.
* No habilitar registro público sin política definida.
* No conectar producción.

## Criterios de aceptación

* Login funciona en dev.
* Logout funciona.
* Perfil vinculado.
* Build OK.
* `.env.local` no versionado.
* No hay secretos expuestos.

## Riesgos

* Exponer service role key.
* Crear perfiles duplicados.
* No sincronizar Auth con profiles.
* Proteger rutas solo en frontend.

---

# 13. Fase 6 — CMS base

## Objetivo

Crear la primera versión del CMS interno para administración de contenidos.

## Entregables

* Ruta `/admin` protegida.
* Layout CMS.
* Dashboard básico.
* Listado de contenidos.
* Formulario de contenido inicial.
* Estados editoriales:

  * `draft`
  * `in_review`
  * `observed`
  * `approved`
  * `scheduled`
  * `published`
  * `archived`
  * `rejected`
* Control de acceso por rol inicial.

## Restricciones

* No permitir publicación directa a usuarios externos.
* No implementar todo el CMS de una vez.
* No crear panel institucional dentro del CMS general.
* No omitir auditoría futura.
* No usar datos reales sin backup.

## Criterios de aceptación

* CMS protegido.
* Build OK.
* Usuarios sin rol no acceden.
* Flujo editorial básico representado.
* Código organizado en `src/components/cms`.

## Riesgos

* CMS demasiado grande para la primera versión.
* Falta de control editorial.
* Exposición accidental de borradores.
* Mezclar panel institucional con administración general.

---

# 14. Fase 7 — Efemérides y contenidos culturales

## Objetivo

Implementar el corazón editorial del portal: efemérides y contenidos culturales.

## Entregables

* CRUD básico de efemérides en CMS.
* Visualización pública de efemérides publicadas.
* Filtro por día y mes.
* Filtro territorial inicial.
* Listado de contenidos culturales.
* Detalle de contenido.
* Relación con personas y lugares, si corresponde.

## Restricciones

* No publicar contenido sin estado `published`.
* No permitir carga pública directa.
* No omitir fuente.
* No implementar buscador semántico todavía.
* No implementar IA editorial todavía.

## Criterios de aceptación

* Efemérides publicadas visibles.
* Borradores no visibles.
* Filtro por fecha funcional.
* Build OK.
* RLS aplicado si ya existe conexión real.

## Riesgos

* Datos históricos sin fuente.
* Duplicación de efemérides.
* Mal diseño de fechas sin año.
* Mezclar contenido nacional y local sin herencia territorial.

---

# 15. Fase 8 — Revista digital y publicaciones

## Objetivo

Implementar archivo de Revista La Gauchita y publicaciones del Instituto Cultural Andino.

## Entregables

* Módulo de ediciones de revista.
* Tapa.
* PDF.
* Número de edición.
* Año.
* Fecha.
* Descripción.
* Publicaciones:

  * libros
  * revistas
  * CDs
  * obras especiales
* Fichas públicas.

## Restricciones

* No subir material sin derecho de uso.
* No habilitar descarga premium sin control.
* No implementar pagos todavía.
* No mezclar archivo histórico con publicaciones comerciales sin criterio.

## Criterios de aceptación

* Ediciones listadas.
* Ficha de revista funcional.
* Publicaciones listadas.
* Build OK.
* Control de acceso básico.

## Riesgos

* Problemas de derechos de autor.
* PDFs pesados.
* Mala visualización mobile.
* Falta de metadatos editoriales.

---

# 16. Fase 9 — Instituciones y reconocimientos

## Objetivo

Implementar la Red Federal de instituciones participantes y el módulo de reconocimientos.

## Entregables

* Listado de instituciones.
* Ficha institucional.
* Tipos de institución.
* Estado de validación.
* Listado de reconocimientos.
* Ficha de reconocimiento.
* Relación con persona, obra, institución o proyecto.

## Restricciones

* Las instituciones no acceden al CMS completo.
* No permitir publicación directa institucional en V1.
* No publicar logos sin autorización.
* No publicar reconocimientos sin respaldo documental.

## Criterios de aceptación

* Instituciones visibles.
* Reconocimientos visibles.
* Carga administrada desde CMS.
* Build OK.
* Estados de validación respetados.

## Riesgos

* Uso indebido de logos.
* Instituciones sin autorización.
* Reconocimientos sin documento.
* Falta de trazabilidad.

---

# 17. Fase 10 — Cartelera docente y carruseles

## Objetivo

Implementar recursos básicos para docentes y carruseles territoriales.

## Entregables

* Cartelera docente básica.
* Recursos por fecha.
* Recursos por territorio.
* Recursos por nivel educativo.
* Carruseles:

  * peñas
  * bibliotecas
  * museos
  * gastronomía
  * centros culturales
  * instituciones
* Estado orgánico/destacado/patrocinado como preparación futura.

## Restricciones

* No implementar pagos.
* No implementar anuncios automáticos.
* No publicar material educativo sensible sin revisión.
* No usar imágenes sin derechos.

## Criterios de aceptación

* Cartelera visible.
* Carruseles visibles.
* Filtros básicos.
* Build OK.
* Datos administrables.

## Riesgos

* Contenido docente no validado.
* Exceso de carruseles.
* Confusión entre contenido cultural y publicidad.
* Falta de identificación de patrocinados en fases futuras.

---

# 18. Fase 11 — Staging y beta cerrada

## Objetivo

Preparar una beta cerrada antes de producción.

## Entregables

* Ambiente staging.
* Supabase staging.
* Vercel preview/staging.
* Datos de prueba.
* Usuarios de prueba.
* Checklist editorial.
* Checklist técnico.
* Revisión mobile.
* Revisión de permisos.
* Revisión de RLS.
* Revisión de performance básica.

## Restricciones

* No conectar producción.
* No abrir al público general.
* No usar datos personales reales sin necesidad.
* No hacer deploy production.
* No habilitar pagos.
* No habilitar APIs públicas.

## Criterios de aceptación

* Staging funcional.
* Roles probados.
* Contenidos publicados visibles.
* Borradores protegidos.
* Instituciones restringidas.
* Build OK.
* Pruebas mobile OK.
* Revisión editorial OK.

## Riesgos

* Saltar directo a producción.
* Usar datos reales sin respaldo.
* Errores de permisos.
* Mala experiencia mobile.
* Falta de contenido inicial.

---

# 19. Reglas de trabajo con Antigravity

Antigravity debe trabajar bajo estas reglas:

```txt
Una tarea por vez.
Una rama feature/* por bloque funcional.
No trabajar directo sobre main.
No ejecutar commits automáticamente.
No ejecutar push automáticamente.
No instalar paquetes sin autorización.
No crear .env reales.
No conectar servicios externos sin autorización.
No borrar archivos.
No modificar fuera del alcance.
```

Cada tarea debe incluir:

* Objetivo.
* Alcance.
* Restricciones.
* Archivos permitidos.
* Criterios de aceptación.
* Pruebas esperadas.

---

# 20. Flujo obligatorio por tarea

Cada tarea debe seguir este flujo:

```txt
1. Definir tarea.
2. Confirmar rama.
3. Ejecutar tarea.
4. Revisar cambios.
5. npm run lint.
6. npm run build.
7. git status.
8. Commit manual.
9. Documentar resultado.
```

---

# 21. Estrategia de ramas

Ramas principales:

```txt
main
develop
feature/*
```

Uso:

```txt
main       → producción estable futura
develop    → integración y staging futuro
feature/*  → desarrollo controlado por tarea
```

Reglas:

* `main` no recibe cambios directos.
* `develop` recibe integraciones revisadas.
* `feature/*` se usa para tareas específicas.
* Los merges deben ser manuales y revisados.
* Los despliegues productivos solo salen de `main`.

---

# 22. Producción

No se debe conectar producción hasta tener staging validado.

No se debe crear Supabase production hasta estabilizar:

1. Modelo de datos dev.
2. RLS dev.
3. Auth dev.
4. CMS base dev.
5. Staging funcional.
6. Revisión editorial.
7. Revisión de permisos.
8. Backup inicial.

Producción será una fase posterior.

---

# 23. Exclusiones del MVP inicial

Quedan fuera del MVP inicial:

```txt
MercadoPago
Stripe
Pagos automáticos
IA generativa editorial
APIs públicas
Widgets externos
RSS público
Webhooks
App móvil nativa
Multi-tenant SaaS
Marketplace cultural
PostGIS obligatorio
Buscador semántico
Newsletter automatizada
Notificaciones push
```

Estas capacidades podrán evaluarse en fases posteriores.

---

# 24. Próximo paso inmediato

El próximo paso operativo recomendado es:

```txt
Crear repositorio remoto privado en GitHub y subir la base controlada.
```

Luego:

```txt
Preparar merge de feature/setup-base hacia develop.
```

Después:

```txt
Iniciar Fase 1: Supabase dev y variables de entorno.
```

---

# 25. Conclusión

Este plan de implementación V1 establece una ruta técnica ordenada, segura y realista.

La prioridad es construir una plataforma sólida antes de acelerar funcionalidades.

El criterio rector será:

```txt
Primero base segura.
Luego datos.
Luego diseño.
Luego portal.
Luego CMS.
Luego comunidad.
Luego staging.
Finalmente producción.
```

La Gauchita Federal debe crecer de forma controlada, con identidad cultural, rigor técnico, trazabilidad editorial y capacidad real de escalar federalmente.
