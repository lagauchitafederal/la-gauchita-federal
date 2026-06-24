-- Migration 0031: Create editorial_assignments table and policies
-- Project: La Gauchita Federal
-- Scope: public.editorial_assignments

CREATE TABLE IF NOT EXISTS public.editorial_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL DEFAULT 'content',
    entity_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
    assigned_to_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by_profile_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT NULL,
    due_date TIMESTAMPTZ NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    completed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_editorial_assignments_entity_type CHECK (entity_type = 'content'),
    CONSTRAINT chk_editorial_assignments_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_editorial_assignments_entity_id ON public.editorial_assignments(entity_id);
CREATE INDEX IF NOT EXISTS idx_editorial_assignments_user_status ON public.editorial_assignments(assigned_to_profile_id, status);
CREATE INDEX IF NOT EXISTS idx_editorial_assignments_due_date ON public.editorial_assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_editorial_assignments_status ON public.editorial_assignments(status);
CREATE INDEX IF NOT EXISTS idx_editorial_assignments_created_at_desc ON public.editorial_assignments(created_at DESC);

-- Constraint: one active assignment per user per content (active is pending or in_progress)
CREATE UNIQUE INDEX IF NOT EXISTS idx_editorial_assignments_active_unique
ON public.editorial_assignments(entity_id, assigned_to_profile_id)
WHERE status IN ('pending', 'in_progress');

-- Enable RLS
ALTER TABLE public.editorial_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS select_editorial_assignments ON public.editorial_assignments;
DROP POLICY IF EXISTS insert_editorial_assignments ON public.editorial_assignments;
DROP POLICY IF EXISTS update_editorial_assignments ON public.editorial_assignments;
DROP POLICY IF EXISTS delete_editorial_assignments ON public.editorial_assignments;

-- 1. SELECT policy: admins/editors can see all; regular users only see their own tasks
CREATE POLICY select_editorial_assignments ON public.editorial_assignments
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin() OR 
        public.has_role('federal_editor') OR
        assigned_to_profile_id = public.current_profile_id()
    );

-- 2. INSERT policy: only admins/editors can assign/create tasks
CREATE POLICY insert_editorial_assignments ON public.editorial_assignments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin() OR 
        public.has_role('federal_editor')
    );

-- 3. UPDATE policy: only admins/editors can update assignments
-- En esta fase, las transiciones se administran desde el circuito editorial.
-- La autonomía de actualización del asignado quedará para la futura fase de roles territoriales y permisos específicos.
CREATE POLICY update_editorial_assignments ON public.editorial_assignments
    FOR UPDATE
    TO authenticated
    USING (
        public.is_admin() OR 
        public.has_role('federal_editor')
    )
    WITH CHECK (
        public.is_admin() OR 
        public.has_role('federal_editor')
    );

-- 4. DELETE policy: only admins/editors can delete assignments
CREATE POLICY delete_editorial_assignments ON public.editorial_assignments
    FOR DELETE
    TO authenticated
    USING (
        public.is_admin() OR 
        public.has_role('federal_editor')
    );

-- Grants
REVOKE ALL ON public.editorial_assignments FROM anon;
REVOKE ALL ON public.editorial_assignments FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.editorial_assignments TO authenticated;
