-- Migration 0034: Create ephemerides import batches tables and relationship
-- Project: La Gauchita Federal
-- Scope: public.import_batches, public.import_batch_rows, public.contents
-- Note: All comments use ASCII encoding to avoid system-specific character issues.

-- 1. Create public.import_batches table
CREATE TABLE IF NOT EXISTS public.import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_type TEXT NOT NULL,
    batch_name TEXT NOT NULL,
    source_file_name TEXT NULL,
    file_hash TEXT NULL,
    status TEXT NOT NULL DEFAULT 'draft_validation',
    total_rows INTEGER NOT NULL DEFAULT 0,
    valid_rows INTEGER NOT NULL DEFAULT 0,
    warning_rows INTEGER NOT NULL DEFAULT 0,
    duplicate_rows INTEGER NOT NULL DEFAULT 0,
    error_rows INTEGER NOT NULL DEFAULT 0,
    imported_rows INTEGER NOT NULL DEFAULT 0,
    skipped_rows INTEGER NOT NULL DEFAULT 0,
    created_by_profile_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    validated_at TIMESTAMPTZ NULL,
    started_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    reverted_at TIMESTAMPTZ NULL,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    summary_report JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT chk_import_batches_type CHECK (import_type = 'ephemerides_csv'),
    CONSTRAINT chk_import_batches_status CHECK (status IN (
        'draft_validation', 'validated', 'importing', 'completed', 
        'completed_with_observations', 'failed', 'reverted', 
        'partially_reverted', 'cancelled'
    )),
    CONSTRAINT chk_import_batches_counters CHECK (
        total_rows >= 0 AND 
        valid_rows >= 0 AND 
        warning_rows >= 0 AND 
        duplicate_rows >= 0 AND 
        error_rows >= 0 AND 
        imported_rows >= 0 AND 
        skipped_rows >= 0
    )
);

-- 2. Create public.import_batch_rows table
CREATE TABLE IF NOT EXISTS public.import_batch_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.import_batches(id) ON DELETE RESTRICT,
    row_number INTEGER NOT NULL,
    validation_status TEXT NOT NULL,
    execution_status TEXT NOT NULL DEFAULT 'pending',
    proposed_slug TEXT NULL,
    content_id UUID NULL REFERENCES public.contents(id) ON DELETE SET NULL,
    raw_data JSONB NOT NULL,
    normalized_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    validation_messages JSONB NOT NULL DEFAULT '{"errors":[],"warnings":[]}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_import_batch_rows_validation CHECK (validation_status IN (
        'valida', 'valida_con_observaciones', 'duplicado_probable', 'error'
    )),
    CONSTRAINT chk_import_batch_rows_execution CHECK (execution_status IN (
        'pending', 'imported', 'skipped', 'blocked_manual_review', 
        'reverted', 'reversal_manual_review', 'failed'
    ))
);

-- 3. Link contents table to import_batches
ALTER TABLE public.contents 
ADD COLUMN IF NOT EXISTS import_batch_id UUID NULL REFERENCES public.import_batches(id) ON DELETE SET NULL;

-- 4. Create Indexes
-- Lote por estado y fecha
CREATE INDEX IF NOT EXISTS idx_import_batches_status_date 
ON public.import_batches(status, created_at DESC);

-- Filas por lote y numero (unique composite)
CREATE UNIQUE INDEX IF NOT EXISTS idx_import_batch_rows_batch_row 
ON public.import_batch_rows(batch_id, row_number);

-- Filas por lote y estado de validacion
CREATE INDEX IF NOT EXISTS idx_import_batch_rows_batch_val_status 
ON public.import_batch_rows(batch_id, validation_status);

-- Filas por content_id
CREATE INDEX IF NOT EXISTS idx_import_batch_rows_content_id 
ON public.import_batch_rows(content_id);

-- Contenidos por import_batch_id
CREATE INDEX IF NOT EXISTS idx_contents_import_batch_id 
ON public.contents(import_batch_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batch_rows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to ensure idempotency
DROP POLICY IF EXISTS select_admin_batches ON public.import_batches;
DROP POLICY IF EXISTS insert_admin_batches ON public.import_batches;
DROP POLICY IF EXISTS update_admin_batches ON public.import_batches;
DROP POLICY IF EXISTS select_admin_batch_rows ON public.import_batch_rows;
DROP POLICY IF EXISTS insert_admin_batch_rows ON public.import_batch_rows;
DROP POLICY IF EXISTS update_admin_batch_rows ON public.import_batch_rows;

-- 6. Define RLS Policies
-- Only super_admin, general_admin, and federal_editor can select/insert/update. No deletion allowed.
CREATE POLICY select_admin_batches ON public.import_batches
    FOR SELECT
    TO authenticated
    USING (public.is_admin() OR public.has_role('federal_editor'));

CREATE POLICY insert_admin_batches ON public.import_batches
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (public.is_admin() OR public.has_role('federal_editor'))
        AND created_by_profile_id IS NOT NULL
        AND created_by_profile_id = (
            SELECT id FROM public.profiles 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY update_admin_batches ON public.import_batches
    FOR UPDATE
    TO authenticated
    USING (public.is_admin() OR public.has_role('federal_editor'))
    WITH CHECK (public.is_admin() OR public.has_role('federal_editor'));

CREATE POLICY select_admin_batch_rows ON public.import_batch_rows
    FOR SELECT
    TO authenticated
    USING (public.is_admin() OR public.has_role('federal_editor'));

CREATE POLICY insert_admin_batch_rows ON public.import_batch_rows
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin() OR public.has_role('federal_editor'));

CREATE POLICY update_admin_batch_rows ON public.import_batch_rows
    FOR UPDATE
    TO authenticated
    USING (public.is_admin() OR public.has_role('federal_editor'))
    WITH CHECK (public.is_admin() OR public.has_role('federal_editor'));

-- 7. Grant Privileges
-- Revoke all default privileges from public roles
REVOKE ALL ON public.import_batches FROM anon;
REVOKE ALL ON public.import_batches FROM authenticated;
REVOKE ALL ON public.import_batch_rows FROM anon;
REVOKE ALL ON public.import_batch_rows FROM authenticated;

-- Grant selective privileges
GRANT SELECT, INSERT, UPDATE ON public.import_batches TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.import_batch_rows TO authenticated;
