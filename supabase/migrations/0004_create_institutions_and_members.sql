-- Migration 0004: Create institutions and institution_members tables
-- Project: La Gauchita Federal
-- Scope: public.institutions, public.institution_members
-- Note: All comments use ASCII encoding to avoid system-specific character issues.

-- 1. Create institutions table
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    institution_type TEXT NOT NULL,
    description TEXT,
    website_url TEXT,
    logo_url TEXT,
    region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
    province_id UUID REFERENCES public.provinces(id) ON DELETE SET NULL,
    municipality_id UUID REFERENCES public.municipalities(id) ON DELETE SET NULL,
    address TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_institutions_type CHECK (institution_type IN (
        'cultural_institute', 'municipality', 'province', 'government_agency', 
        'school', 'library', 'museum', 'association', 'pena', 
        'gastronomic_place', 'cultural_center', 'media', 'other'
    )),
    CONSTRAINT chk_institutions_status CHECK (status IN ('draft', 'active', 'inactive', 'archived'))
);

-- 2. Create institution_members table
CREATE TABLE IF NOT EXISTS public.institution_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    member_role TEXT NOT NULL DEFAULT 'member',
    status TEXT NOT NULL DEFAULT 'active',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_institution_members_role CHECK (member_role IN ('owner', 'admin', 'editor', 'contributor', 'reviewer', 'member')),
    CONSTRAINT chk_institution_members_status CHECK (status IN ('active', 'inactive', 'suspended'))
);

-- 3. Unique Index to prevent duplicate profile assignments in the same institution
CREATE UNIQUE INDEX IF NOT EXISTS idx_institution_members_unique_profile 
ON public.institution_members (institution_id, profile_id);

-- 4. Create Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_institutions_institution_type ON public.institutions(institution_type);
CREATE INDEX IF NOT EXISTS idx_institutions_status ON public.institutions(status);
CREATE INDEX IF NOT EXISTS idx_institutions_region_id ON public.institutions(region_id);
CREATE INDEX IF NOT EXISTS idx_institutions_province_id ON public.institutions(province_id);
CREATE INDEX IF NOT EXISTS idx_institutions_municipality_id ON public.institutions(municipality_id);
CREATE INDEX IF NOT EXISTS idx_institutions_created_by ON public.institutions(created_by);
CREATE INDEX IF NOT EXISTS idx_institutions_is_featured ON public.institutions(is_featured);

CREATE INDEX IF NOT EXISTS idx_institution_members_institution_id ON public.institution_members(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_members_profile_id ON public.institution_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_institution_members_member_role ON public.institution_members(member_role);
CREATE INDEX IF NOT EXISTS idx_institution_members_status ON public.institution_members(status);
CREATE INDEX IF NOT EXISTS idx_institution_members_created_by ON public.institution_members(created_by);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_members ENABLE ROW LEVEL SECURITY;

-- 6. Define RLS Policies

-- Drop existing policies to ensure idempotency
DROP POLICY IF EXISTS select_active_institutions_anon ON public.institutions;
DROP POLICY IF EXISTS select_active_institutions_auth ON public.institutions;
DROP POLICY IF EXISTS select_own_created_institutions ON public.institutions;
DROP POLICY IF EXISTS select_own_memberships ON public.institution_members;

-- Institutions Policies
CREATE POLICY select_active_institutions_anon ON public.institutions
    FOR SELECT
    TO anon
    USING (status = 'active');

CREATE POLICY select_active_institutions_auth ON public.institutions
    FOR SELECT
    TO authenticated
    USING (status = 'active');

CREATE POLICY select_own_created_institutions ON public.institutions
    FOR SELECT
    TO authenticated
    USING (created_by IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    ));

-- Institution Members Policies
CREATE POLICY select_own_memberships ON public.institution_members
    FOR SELECT
    TO authenticated
    USING (profile_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    ));

-- 7. Grant Privileges
-- Revoke all default privileges from public roles
REVOKE ALL ON public.institutions FROM anon;
REVOKE ALL ON public.institution_members FROM anon;
REVOKE ALL ON public.institutions FROM authenticated;
REVOKE ALL ON public.institution_members FROM authenticated;

-- Grant selective privileges
GRANT SELECT ON public.institutions TO anon, authenticated;
GRANT SELECT ON public.institution_members TO authenticated;
