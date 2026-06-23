-- Migration 0025: Create admin_activity_logs table
-- Project: La Gauchita Federal
-- Scope: public.admin_activity_logs

CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    entity_label TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    CONSTRAINT chk_admin_activity_logs_action_type CHECK (action_type IN ('create', 'update', 'upload')),
    CONSTRAINT chk_admin_activity_logs_entity_type CHECK (entity_type IN ('content', 'institution', 'recognition', 'media_asset'))
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_actor_profile_id ON public.admin_activity_logs(actor_profile_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_action_type ON public.admin_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_entity_type ON public.admin_activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON public.admin_activity_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists (for safety)
DROP POLICY IF EXISTS select_admin_activity_logs ON public.admin_activity_logs;
DROP POLICY IF EXISTS insert_admin_activity_logs ON public.admin_activity_logs;

-- Select policy: super_admin or general_admin (via public.is_admin())
CREATE POLICY select_admin_activity_logs ON public.admin_activity_logs
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Insert policy: admins and editors
CREATE POLICY insert_admin_activity_logs ON public.admin_activity_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin() OR public.has_role('federal_editor')
    );

-- Grants
REVOKE ALL ON public.admin_activity_logs FROM anon;
REVOKE ALL ON public.admin_activity_logs FROM authenticated;

GRANT SELECT, INSERT ON public.admin_activity_logs TO authenticated;
