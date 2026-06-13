-- Migration 0003: Create profiles and user_roles tables
-- Project: La Gauchita Federal
-- Scope: public.profiles, public.user_roles
-- Note: All comments use ASCII encoding to avoid system-specific character issues.

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    province_id UUID REFERENCES public.provinces(id) ON DELETE SET NULL,
    municipality_id UUID REFERENCES public.municipalities(id) ON DELETE SET NULL,
    membership_level_id UUID REFERENCES public.membership_levels(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_profiles_status CHECK (status IN ('active', 'inactive', 'suspended', 'deleted'))
);

-- 2. Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    scope_type TEXT NOT NULL DEFAULT 'global',
    scope_id UUID,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_user_roles_scope_type CHECK (scope_type IN ('global', 'region', 'province', 'municipality', 'institution'))
);

-- 3. Unique Constraints for user_roles (handling NULL values for global scope safely)
-- Unique index when scope_id is NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_unique_with_scope 
ON public.user_roles (profile_id, role_id, scope_type, scope_id) 
WHERE scope_id IS NOT NULL;

-- Unique index when scope_id is NULL (e.g. global scope)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_unique_without_scope 
ON public.user_roles (profile_id, role_id, scope_type) 
WHERE scope_id IS NULL;

-- 4. Create Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON public.profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_province_id ON public.profiles(province_id);
CREATE INDEX IF NOT EXISTS idx_profiles_municipality_id ON public.profiles(municipality_id);
CREATE INDEX IF NOT EXISTS idx_profiles_membership_level_id ON public.profiles(membership_level_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_profile_id ON public.user_roles(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_scope_type ON public.user_roles(scope_type);
CREATE INDEX IF NOT EXISTS idx_user_roles_created_by ON public.user_roles(created_by);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6. Define RLS Policies

-- Drop existing policies to ensure idempotency
DROP POLICY IF EXISTS select_own_profile ON public.profiles;
DROP POLICY IF EXISTS update_own_profile ON public.profiles;
DROP POLICY IF EXISTS select_own_roles ON public.user_roles;

-- Profiles Policies
CREATE POLICY select_own_profile ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = auth_user_id);

CREATE POLICY update_own_profile ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

-- User Roles Policies
CREATE POLICY select_own_roles ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (profile_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    ));

-- 7. Grant Privileges
-- Revoke anonymous access.
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.user_roles FROM anon;

-- Revoke broad authenticated access before applying narrow grants.
REVOKE ALL ON public.profiles FROM authenticated;
REVOKE ALL ON public.user_roles FROM authenticated;

-- Authenticated users can read their own profile through RLS.
GRANT SELECT ON public.profiles TO authenticated;

-- Authenticated users can update only non-sensitive fields on their own profile.
-- RLS still enforces ownership through auth.uid() = auth_user_id.
GRANT UPDATE (
    display_name,
    avatar_url,
    province_id,
    municipality_id
) ON public.profiles TO authenticated;

-- Authenticated users can read only their own roles through RLS.
-- No insert, update or delete grants are provided for user_roles.
GRANT SELECT ON public.user_roles TO authenticated;
