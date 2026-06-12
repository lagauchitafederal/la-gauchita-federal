# DATA_MODEL_V1 — La Gauchita Federal

## 1. Propósito del documento

Este documento define la especificación inicial del modelo de datos V1 para **La Gauchita Federal**.

La Gauchita Federal es una plataforma cultural, histórica, editorial, educativa, patrimonial, comunitaria y federal. No debe ser tratada como un blog simple ni como un portal genérico de noticias.

El objetivo de este documento es establecer una base de datos inicial clara, escalable y segura antes de crear tablas reales, migraciones o conexiones con Supabase.

---

## 2. Estado de esta especificación

Este documento es una **especificación previa**.

En esta etapa:

- No se crean tablas reales.
- No se crean migraciones.
- No se conecta Supabase.
- No se agregan claves.
- No se modifican archivos `.env`.
- No se implementa Row Level Security todavía.
- No se implementa lógica de backend.
- No se implementa CMS.
- No se implementa panel institucional.

La implementación física deberá realizarse posteriormente mediante migraciones versionadas, revisadas y controladas.

---

## 3. Principio funcional central

El núcleo lógico de La Gauchita Federal será:

```txt
Fecha actual + ubicación seleccionada + nivel de usuario