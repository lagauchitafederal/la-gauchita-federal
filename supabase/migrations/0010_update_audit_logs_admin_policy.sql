-- Migration 0010: Update audit_logs admin policy
-- Project: La Gauchita Federal
-- Scope: public.audit_logs policy and grants
-- Note: All comments use ASCII encoding to avoid system-specific character issues.

-- =========================================================================
-- POLICIES
-- =========================================================================

-- Drop existing administrative read policy if it exists for idempotency
DROP POLICY IF EXISTS select_audit_logs_admins ON public.audit_logs;

-- Create administrative read policy for audit_logs
CREATE POLICY select_audit_logs_admins ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (public.can_read_audit_logs());

-- =========================================================================
-- GRANTS AND PRIVILEGES
-- =========================================================================

-- Revoke all default privileges from public roles on audit_logs
REVOKE ALL ON public.audit_logs FROM anon;
REVOKE ALL ON public.audit_logs FROM authenticated;

-- Grant select privilege selectively to authenticated users
-- Access to specific rows will be filtered by the select_audit_logs_admins RLS policy.
GRANT SELECT ON public.audit_logs TO authenticated;

-- No insert, update, or delete grants are provided to authenticated or anon roles.
-- No select grant is provided to anon.
