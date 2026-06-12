-- Migration 0001: Create base catalog tables
-- Project: La Gauchita Federal
-- Scope: regions, provinces, municipalities, roles, membership_levels, categories, content_types
-- Notes:
-- - PostGIS is not required for MVP V1.
-- - Locations are handled through a relational territorial model.
-- - This migration must be applied first in la-gauchita-federal-dev.
-- - No sensitive tables are created in this migration.
-- - No seed data is inserted in this migration.

-- Required extension for UUID generation.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================================
-- TABLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS provinces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS municipalities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    province_id UUID NOT NULL REFERENCES provinces(id) ON DELETE RESTRICT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    is_capital BOOLEAN DEFAULT false NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT true NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS membership_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    currency TEXT DEFAULT 'ARS' NOT NULL,
    benefits JSONB DEFAULT '[]'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS content_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =========================================================================
-- INDEXES
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_provinces_region_id ON provinces(region_id);
CREATE INDEX IF NOT EXISTS idx_municipalities_province_id ON municipalities(province_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

CREATE INDEX IF NOT EXISTS idx_regions_is_active ON regions(is_active);
CREATE INDEX IF NOT EXISTS idx_provinces_is_active ON provinces(is_active);
CREATE INDEX IF NOT EXISTS idx_municipalities_is_active ON municipalities(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_membership_levels_is_active ON membership_levels(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_content_types_is_active ON content_types(is_active);

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================

ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_types ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- PUBLIC READ POLICIES FOR ACTIVE CATALOG RECORDS
-- =========================================================================

DROP POLICY IF EXISTS select_active_regions ON regions;
CREATE POLICY select_active_regions ON regions
    FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS select_active_provinces ON provinces;
CREATE POLICY select_active_provinces ON provinces
    FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS select_active_municipalities ON municipalities;
CREATE POLICY select_active_municipalities ON municipalities
    FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS select_active_roles ON roles;
CREATE POLICY select_active_roles ON roles
    FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS select_active_membership_levels ON membership_levels;
CREATE POLICY select_active_membership_levels ON membership_levels
    FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS select_active_categories ON categories;
CREATE POLICY select_active_categories ON categories
    FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS select_active_content_types ON content_types;
CREATE POLICY select_active_content_types ON content_types
    FOR SELECT
    USING (is_active = true);

-- =========================================================================
-- GRANTS
-- =========================================================================

GRANT SELECT ON regions TO anon, authenticated;
GRANT SELECT ON provinces TO anon, authenticated;
GRANT SELECT ON municipalities TO anon, authenticated;
GRANT SELECT ON roles TO anon, authenticated;
GRANT SELECT ON membership_levels TO anon, authenticated;
GRANT SELECT ON categories TO anon, authenticated;
GRANT SELECT ON content_types TO anon, authenticated;

-- No public insert, update or delete grants are defined in this migration.
-- Catalog writes must remain restricted to future administrative flows.