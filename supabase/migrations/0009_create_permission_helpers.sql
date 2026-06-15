-- Migration 0009: Create permission helpers functions
-- Project: La Gauchita Federal
-- Scope: public.current_profile_id, public.has_role, public.has_any_role, public.is_super_admin, public.is_general_admin, public.is_admin, public.can_read_audit_logs
-- Note: All comments use ASCII encoding to avoid system-specific character issues.

-- =========================================================================
-- FUNCTIONS
-- =========================================================================

-- 1. Get the profile id for the currently authenticated user
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_profile_id UUID;
BEGIN
    SELECT id INTO v_profile_id
FROM public.profiles
WHERE auth_user_id = auth.uid()
  AND status = 'active'
LIMIT 1;

    RETURN v_profile_id;
END;
$$;

-- 2. Verify if the currently authenticated user has the specified active global role
CREATE OR REPLACE FUNCTION public.has_role(role_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_profile_id UUID;
    v_has_role BOOLEAN;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT EXISTS (
        SELECT 1 
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.profile_id = v_profile_id
          AND r.code = role_code
          AND r.is_active = TRUE
    ) INTO v_has_role;

    RETURN v_has_role;
END;
$$;

-- 3. Verify if the currently authenticated user has any of the specified active global roles
CREATE OR REPLACE FUNCTION public.has_any_role(role_codes TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_profile_id UUID;
    v_has_role BOOLEAN;
BEGIN
    IF role_codes IS NULL OR cardinality(role_codes) = 0 THEN
        RETURN FALSE;
    END IF;

    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT EXISTS (
        SELECT 1 
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.profile_id = v_profile_id
          AND r.code = ANY(role_codes)
          AND r.is_active = TRUE
    ) INTO v_has_role;

    RETURN v_has_role;
END;
$$;

-- 4. Helper to check if the currently authenticated user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    RETURN public.has_role('super_admin');
END;
$$;

-- 5. Helper to check if the currently authenticated user is a general admin
CREATE OR REPLACE FUNCTION public.is_general_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    RETURN public.has_role('general_admin');
END;
$$;

-- 6. Helper to check if the currently authenticated user is any admin (super_admin or general_admin)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    RETURN public.has_role('super_admin') OR public.has_role('general_admin');
END;
$$;

-- 7. Helper to check if the user is authorized to read audit logs
CREATE OR REPLACE FUNCTION public.can_read_audit_logs()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    RETURN public.is_admin();
END;
$$;

-- =========================================================================
-- GRANTS AND PRIVILEGES
-- =========================================================================

-- Revoke all default execution rights from public (which includes anon)
REVOKE ALL ON FUNCTION public.current_profile_id() FROM public;
REVOKE ALL ON FUNCTION public.has_role(TEXT) FROM public;
REVOKE ALL ON FUNCTION public.has_any_role(TEXT[]) FROM public;
REVOKE ALL ON FUNCTION public.is_super_admin() FROM public;
REVOKE ALL ON FUNCTION public.is_general_admin() FROM public;
REVOKE ALL ON FUNCTION public.is_admin() FROM public;
REVOKE ALL ON FUNCTION public.can_read_audit_logs() FROM public;

-- Grant execution privilege selectively to authenticated users
GRANT EXECUTE ON FUNCTION public.current_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_general_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_audit_logs() TO authenticated;
