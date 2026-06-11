# AGENTS.md

## Proyecto
La Gauchita Federal

## Naturaleza del sistema
La Gauchita Federal es una plataforma web cultural, federal, patrimonial, editorial, educativa y comunitaria.

No debe ser tratada como:
- Un blog simple.
- Un diario de noticias genérico.
- Una landing page institucional básica.
- Una app móvil nativa inicial.

Debe construirse como:
- Portal público federal.
- CMS administrable.
- Banco de información histórica y cultural.
- Plataforma escalable para instituciones, municipios, provincias, bibliotecas, museos, escuelas, medios aliados y colaboradores culturales.

## Frase conceptual
"Donde late la historia de cada argentino."

## Núcleo funcional obligatorio
Toda arquitectura, pantalla, consulta y componente debe considerar progresivamente estos tres filtros:

1. Fecha actual.
2. Ubicación seleccionada.
3. Nivel de usuario.

La experiencia ideal del sistema es mostrar contenidos relevantes según:
Fecha + Territorio + Nivel de acceso.

## Stack obligatorio
- Next.js App Router.
- React.
- TypeScript.
- Tailwind CSS.
- ESLint.
- Supabase.
- PostgreSQL.
- Supabase Auth.
- Supabase Storage.
- Row Level Security.
- Vercel.

## Estructura esperada
El código debe organizarse dentro de `src/`.

Estructura base sugerida:

```txt
src/
├── app/
├── components/
│   ├── layout/
│   ├── public/
│   ├── cms/
│   ├── institution/
│   ├── cards/
│   ├── filters/
│   └── ui/
├── lib/
│   ├── supabase/
│   ├── auth/
│   ├── permissions/
│   ├── utils/
│   └── validations/
├── types/
├── hooks/
└── data/