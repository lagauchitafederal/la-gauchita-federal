-- Migration 0008: Create audit_logs table
-- Project: La Gauchita Federal
-- Scope: public.audit_logs
-- Note: All comments use ASCII encoding to avoid system-specific character issues.

-- =========================================================================
-- TABLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_table TEXT NOT NULL,
    entity_id UUID,
    previous_data JSONB,
    new_data JSONB,
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints for domain validation
    CONSTRAINT chk_audit_logs_action CHECK (action IN (
        'create', 'update', 'delete', 'publish', 'archive', 'reject',
        'restore', 'assign_role', 'revoke_role', 'change_visibility',
        'change_status', 'upload', 'review', 'other'
    )),
    CONSTRAINT chk_audit_logs_entity_table CHECK (entity_table IN (
        'profiles', 'user_roles', 'institutions', 'institution_members',
        'contents', 'media_assets', 'recognitions', 'storage_objects',
        'subscriptions', 'payments', 'admin_settings', 'other'
    ))
);

-- =========================================================================
-- INDEXES
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_profile_id ON public.audit_logs(actor_profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_auth_user_id ON public.audit_logs(actor_auth_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_table ON public.audit_logs(entity_table);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Compound index for entity lookup optimization over time
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_search ON public.audit_logs(entity_table, entity_id, created_at DESC);

-- Compound index for actor activity lookup optimization over time
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_activity ON public.audit_logs(actor_profile_id, created_at DESC);

-- Compound index for action history optimization over time
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_history ON public.audit_logs(action, created_at DESC);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- No permissive policies are defined in this migration.
-- By enabling RLS and defining no select, insert, update or delete policies,
-- all direct client operations from anon and authenticated remain completely denied.

-- =========================================================================
-- GRANTS
-- =========================================================================

-- Revoke all default privileges from public roles
REVOKE ALL ON public.audit_logs FROM anon;
REVOKE ALL ON public.audit_logs FROM authenticated;

-- No select, insert, update or delete grants are provided to anon or authenticated.
-- Audit logs should only be populated via internal triggers or backend services.
