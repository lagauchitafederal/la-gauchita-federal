-- Migration 0032: Create homepage_slots table
-- Project: La Gauchita Federal
-- Scope: public.homepage_slots
-- Note: All comments use ASCII encoding to avoid character issues.


CREATE TABLE IF NOT EXISTS public.homepage_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_code TEXT NOT NULL,
    content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
    province_id UUID NULL REFERENCES public.provinces(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    starts_at TIMESTAMPTZ NULL,
    ends_at TIMESTAMPTZ NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    assigned_by_profile_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_homepage_slots_slot_code CHECK (slot_code IN ('lead_story', 'featured_1', 'featured_2', 'featured_3', 'featured_4')),
    CONSTRAINT chk_homepage_slots_dates CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_homepage_slots_query ON public.homepage_slots (slot_code, province_id, is_active);
CREATE INDEX IF NOT EXISTS idx_homepage_slots_content_id ON public.homepage_slots (content_id);
CREATE INDEX IF NOT EXISTS idx_homepage_slots_starts_at ON public.homepage_slots (starts_at);
CREATE INDEX IF NOT EXISTS idx_homepage_slots_ends_at ON public.homepage_slots (ends_at);
CREATE INDEX IF NOT EXISTS idx_homepage_slots_sort_order ON public.homepage_slots (sort_order);

-- Required for equality operators on text and UUID within EXCLUDE USING gist.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Exclusion constraint to prevent overlapping active assignments for the same slot_code and territorial scope.
-- Treats NULL province_id as federal scope using COALESCE with the nil UUID.
-- Allows scheduling future active slots for the same scope as long as their dates do not overlap.
-- Consecutive scheduling (start of one exactly at the end of the previous one) is permitted using semi-open ranges [).
-- Inactive/historical slots (is_active = false) are not checked, preserving layout history.
ALTER TABLE public.homepage_slots DROP CONSTRAINT IF EXISTS exclude_homepage_slots_overlap;
ALTER TABLE public.homepage_slots ADD CONSTRAINT exclude_homepage_slots_overlap
    EXCLUDE USING gist (
        slot_code WITH =,
        (COALESCE(province_id, '00000000-0000-0000-0000-000000000000'::uuid)) WITH =,
        (tstzrange(COALESCE(starts_at, '-infinity'::timestamptz), COALESCE(ends_at, 'infinity'::timestamptz), '[)')) WITH &&
    )
    WHERE (is_active = true);

-- Enable Row Level Security (RLS)
ALTER TABLE public.homepage_slots ENABLE ROW LEVEL SECURITY;

-- Define RLS Policies
DROP POLICY IF EXISTS select_public_homepage_slots ON public.homepage_slots;
DROP POLICY IF EXISTS select_admin_homepage_slots ON public.homepage_slots;
DROP POLICY IF EXISTS insert_homepage_slots ON public.homepage_slots;
DROP POLICY IF EXISTS update_homepage_slots ON public.homepage_slots;
DROP POLICY IF EXISTS delete_homepage_slots ON public.homepage_slots;

-- 1. SELECT policy: public reads active and currently active slots
CREATE POLICY select_public_homepage_slots ON public.homepage_slots
    FOR SELECT
    TO anon, authenticated
    USING (
        is_active = true 
        AND (starts_at IS NULL OR starts_at <= now())
        AND (ends_at IS NULL OR ends_at > now())
    );

-- 2. SELECT policy: admin/editor reads all slots (historical, inactive, future)
CREATE POLICY select_admin_homepage_slots ON public.homepage_slots
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin() OR 
        public.has_role('federal_editor')
    );

-- 3. INSERT policy: only admin/editor can assign slots
CREATE POLICY insert_homepage_slots ON public.homepage_slots
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin() OR 
        public.has_role('federal_editor')
    );

-- 4. UPDATE policy: only admin/editor can modify slots
CREATE POLICY update_homepage_slots ON public.homepage_slots
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

-- 5. DELETE policy: only admin/editor can delete slot records
CREATE POLICY delete_homepage_slots ON public.homepage_slots
    FOR DELETE
    TO authenticated
    USING (
        public.is_admin() OR 
        public.has_role('federal_editor')
    );

-- Grant Privileges
REVOKE ALL ON public.homepage_slots FROM anon;
REVOKE ALL ON public.homepage_slots FROM authenticated;

GRANT SELECT ON public.homepage_slots TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.homepage_slots TO authenticated;
