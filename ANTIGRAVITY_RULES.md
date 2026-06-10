# Reglas obligatorias para agentes de desarrollo

Proyecto: La Gauchita Federal

## Contexto
La Gauchita Federal es un portal cultural argentino, federal, patrimonial, editorial y educativo. Su núcleo funcional es mostrar contenidos según:

- Fecha actual
- Ubicación seleccionada
- Nivel de usuario

## Stack obligatorio

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security
- Vercel

## Reglas de trabajo

1. No modificar archivos fuera del alcance de la tarea.
2. No trabajar sobre la rama main.
3. No crear tecnologías nuevas sin autorización.
4. No exponer credenciales.
5. No generar archivos .env reales.
6. No eliminar código existente sin explicar el motivo.
7. No sobrescribir componentes sin revisión.
8. Crear componentes reutilizables.
9. Usar TypeScript estricto.
10. Separar lógica, UI y acceso a datos.
11. Mantener diseño responsive.
12. Respetar accesibilidad básica.
13. Toda consulta a Supabase debe contemplar permisos.
14. Toda tabla sensible debe prever RLS.
15. No publicar contenido sin flujo editorial.
16. No implementar pagos en esta fase.
17. No implementar IA generativa en esta fase.
18. No implementar app nativa en esta fase.
19. Documentar brevemente cada módulo creado.
20. Al finalizar, informar archivos modificados y pruebas realizadas.

## Restricciones funcionales de V1

La Versión 1 prioriza:

- Home federal
- Efemérides
- Contenidos culturales
- Revista digital
- Publicaciones
- Eduardo Ceballos
- Instituto Cultural Andino
- Instituciones participantes
- Reconocimientos
- Cartelera docente básica
- CMS
- Roles y permisos
- Panel institucional

## Criterio de calidad

Un módulo se considera aceptado cuando:

- Compila sin errores.
- Es responsive.
- No rompe navegación.
- Tiene tipos definidos.
- No expone secretos.
- Respeta el diseño.
- Cumple el alcance indicado.
