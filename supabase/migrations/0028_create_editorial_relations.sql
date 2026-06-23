-- Migration 0028: Create editorial_relations table
-- Project: La Gauchita Federal
-- Scope: public.editorial_relations

/*
=========================================================================
CONSIDERACIONES DE DISEÑO Y ARQUITECTURA (RELACIONES POLIMÓRFICAS)
=========================================================================
1. DISEÑO POLIMÓRFICO:
   Esta tabla implementa un diseño de relación polimórfica en el que 'source_entity_type'
   y 'target_entity_type' definen a qué tabla física del sistema pertenece cada registro.
   Esto permite modelar relaciones N:M entre cualquier par de entidades sin necesidad de
   crear tablas puente independientes para cada combinación (ej. content_person, person_institution, etc.).

2. AUSENCIA DE CLAVES FORÁNEAS DIRECTAS:
   Debido a que PostgreSQL no admite claves foráneas polimórficas (es decir, una FK que apunte
   dinámicamente a tablas distintas como contents, people o institutions según el valor de otra columna),
   no existen constraints REFERENCES directos sobre 'source_entity_id' y 'target_entity_id'.
   La integridad referencial lógica se controlará en la capa de aplicación y mediante consultas cruzadas.

3. VÍNCULOS SIMÉTRICOS (RELACIONES BIDIRECCIONALES):
   Para vínculos simétricos (ej. 'relacionado_con'), la relación es conceptualmente bidireccional.
   Para evitar duplicidad física (fila A->B y fila B->A), se almacena una única fila y la bidireccionalidad
   debe normalizarse/consultarse en la capa de aplicación (usando UNION ALL o filtros cruzados en las queries).

4. VALIDACIÓN DE VISIBILIDAD EN CONSULTAS PÚBLICAS:
   Para maximizar el rendimiento y evitar "recursión de políticas RLS" (deadlocks o latencias elevadas al
   evaluar RLS), las políticas de lectura pública de esta tabla solo validan que la relación en sí
   esté en estado 'active' y visibilidad 'public'. La validez pública de los extremos (que el contenido
   esté publicado y a fecha, que el personaje esté publicado, etc.) se resolverá en las consultas públicas
   de la aplicación haciendo los correspondientes JOINs indexados, no dentro del motor de políticas de Supabase.

5. FUTURA EXTENSIBILIDAD:
   Entidades como 'place', 'tradition', 'publication' o 'event' no se habilitan en las restricciones
   de esta migración, pero quedan documentadas para incorporarse en una fase futura mediante la modificación
   o alteración del constraint 'chk_editorial_relations_source_type' y 'chk_editorial_relations_target_type'.
=========================================================================
*/

CREATE TABLE IF NOT EXISTS public.editorial_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_entity_type TEXT NOT NULL,
    source_entity_id UUID NOT NULL,
    target_entity_type TEXT NOT NULL,
    target_entity_id UUID NOT NULL,
    relation_type TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    visibility TEXT NOT NULL DEFAULT 'public',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints para limitar tipos de entidades actualmente soportados
    CONSTRAINT chk_editorial_relations_source_type CHECK (source_entity_type IN (
        'content', 'person', 'institution', 'recognition', 'media_asset'
    )),
    CONSTRAINT chk_editorial_relations_target_type CHECK (target_entity_type IN (
        'content', 'person', 'institution', 'recognition', 'media_asset'
    )),
    
    -- Constraints para tipos de relación permitidos
    CONSTRAINT chk_editorial_relations_relation_type CHECK (relation_type IN (
        'protagonista_de',
        'relacionado_con',
        'autor_de',
        'mencionado_en',
        'vinculado_a_institucion',
        'reconocimiento_de',
        'parte_de_coleccion',
        'lectura_recomendada'
    )),

    -- Restricciones de estado y visibilidad
    CONSTRAINT chk_editorial_relations_status CHECK (status IN (
        'draft', 'active', 'archived'
    )),
    CONSTRAINT chk_editorial_relations_visibility CHECK (visibility IN (
        'public', 'private'
    )),

    -- Prevención de autorreferencia exacta
    CONSTRAINT chk_editorial_relations_no_self CHECK (
        NOT (source_entity_type = target_entity_type AND source_entity_id = target_entity_id)
    )
);

-- =========================================================================
-- INDEXES FOR PERFORMANCE AND UNICITY
-- =========================================================================

-- Evitar duplicados exactos para la misma dirección y tipo de relación
CREATE UNIQUE INDEX IF NOT EXISTS idx_editorial_relations_unique 
ON public.editorial_relations (
    source_entity_type, source_entity_id, 
    target_entity_type, target_entity_id, 
    relation_type
);

-- Búsquedas rápidas indexadas por extremos
CREATE INDEX IF NOT EXISTS idx_editorial_relations_source 
ON public.editorial_relations (source_entity_type, source_entity_id);

CREATE INDEX IF NOT EXISTS idx_editorial_relations_target 
ON public.editorial_relations (target_entity_type, target_entity_id);

-- Consultas de listado y filtrado por estado
CREATE INDEX IF NOT EXISTS idx_editorial_relations_lookup 
ON public.editorial_relations (relation_type, status, visibility);

-- Ordenación editorial
CREATE INDEX IF NOT EXISTS idx_editorial_relations_sort 
ON public.editorial_relations (sort_order);


-- =========================================================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- =========================================================================

ALTER TABLE public.editorial_relations ENABLE ROW LEVEL SECURITY;

-- Eliminación de políticas previas para garantizar idempotencia
DROP POLICY IF EXISTS select_public_active_relations_anon ON public.editorial_relations;
DROP POLICY IF EXISTS select_public_active_relations_auth ON public.editorial_relations;
DROP POLICY IF EXISTS select_admin_relations ON public.editorial_relations;
DROP POLICY IF EXISTS insert_admin_relations ON public.editorial_relations;
DROP POLICY IF EXISTS update_admin_relations ON public.editorial_relations;
DROP POLICY IF EXISTS delete_admin_relations ON public.editorial_relations;

-- 1. Lectura pública para usuarios anónimos (solo activas y públicas)
CREATE POLICY select_public_active_relations_anon ON public.editorial_relations
    FOR SELECT
    TO anon
    USING (status = 'active' AND visibility = 'public');

-- 2. Lectura pública para usuarios autenticados (solo activas y públicas)
CREATE POLICY select_public_active_relations_auth ON public.editorial_relations
    FOR SELECT
    TO authenticated
    USING (status = 'active' AND visibility = 'public');

-- 3. Lectura administrativa total para administradores y editores federales
CREATE POLICY select_admin_relations ON public.editorial_relations
    FOR SELECT
    TO authenticated
    USING (public.is_admin() OR public.has_role('federal_editor'));

-- 4. Escritura administrativa: Creación
CREATE POLICY insert_admin_relations ON public.editorial_relations
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin() OR public.has_role('federal_editor'));

-- 5. Escritura administrativa: Actualización
CREATE POLICY update_admin_relations ON public.editorial_relations
    FOR UPDATE
    TO authenticated
    USING (public.is_admin() OR public.has_role('federal_editor'))
    WITH CHECK (public.is_admin() OR public.has_role('federal_editor'));

-- 6. Escritura administrativa: Eliminación
CREATE POLICY delete_admin_relations ON public.editorial_relations
    FOR DELETE
    TO authenticated
    USING (public.is_admin() OR public.has_role('federal_editor'));


-- =========================================================================
-- GRANTS & PRIVILEGES
-- =========================================================================

REVOKE ALL ON public.editorial_relations FROM anon;
REVOKE ALL ON public.editorial_relations FROM authenticated;

-- Permisos específicos para accesos autorizados respetando RLS
GRANT SELECT ON public.editorial_relations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.editorial_relations TO authenticated;
