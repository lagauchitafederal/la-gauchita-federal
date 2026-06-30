-- Migration 0036: Create ephemerides import reversion RPC
-- Project: La Gauchita Federal
-- Scope: public.revert_ephemerides_import
-- Note: All comments use ASCII encoding to avoid system-specific character issues.

-- 1. Create revert_ephemerides_import RPC function
CREATE OR REPLACE FUNCTION public.revert_ephemerides_import(p_batch_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_profile_id UUID;
    v_user_id UUID;
    v_batch_name TEXT;
    v_batch_status TEXT;
    v_reverted_count INTEGER := 0;
    v_manual_review_count INTEGER := 0;
    v_final_status TEXT;
    v_version_count INTEGER;
    v_v1_version_number INTEGER;
    
    r_row RECORD;
    v_is_eligible BOOLEAN;
    v_result JSONB;
    
    -- Version 1 snapshot values
    v_v1_title TEXT;
    v_v1_subtitle TEXT;
    v_v1_summary TEXT;
    v_v1_body TEXT;
    v_v1_content_type_id UUID;
    v_v1_category_id UUID;
    v_v1_institution_id UUID;
    v_v1_author_profile_id UUID;
    v_v1_region_id UUID;
    v_v1_province_id UUID;
    v_v1_municipality_id UUID;
    v_v1_event_date DATE;
    v_v1_publish_date TIMESTAMPTZ;
    v_v1_status TEXT;
    v_v1_visibility TEXT;
    v_v1_is_featured BOOLEAN;
    v_v1_source_reference TEXT;
    v_v1_metadata JSONB;
    
    -- Current content values
    v_c_title TEXT;
    v_c_subtitle TEXT;
    v_c_summary TEXT;
    v_c_body TEXT;
    v_c_content_type_id UUID;
    v_c_category_id UUID;
    v_c_institution_id UUID;
    v_c_author_profile_id UUID;
    v_c_region_id UUID;
    v_c_province_id UUID;
    v_c_municipality_id UUID;
    v_c_event_date DATE;
    v_c_publish_date TIMESTAMPTZ;
    v_c_status TEXT;
    v_c_visibility TEXT;
    v_c_is_featured BOOLEAN;
    v_c_source_reference TEXT;
    v_c_slug TEXT;
    v_c_import_batch_id UUID;
BEGIN
    -- 1. Resolve authentication context
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No autorizado: sesion no valida.';
    END IF;

    -- 2. Resolve active profile
    SELECT id INTO v_profile_id
    FROM public.profiles
    WHERE auth_user_id = v_user_id AND status = 'active';

    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'No autorizado: usuario no valido.';
    END IF;

    -- 3. Verify administrative roles
    IF NOT EXISTS (
        SELECT 1 
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.profile_id = v_profile_id 
          AND r.code IN ('super_admin', 'general_admin', 'federal_editor')
    ) THEN
        RAISE EXCEPTION 'No autorizado: usuario no valido.';
    END IF;

    -- 4. Lock the batch and verify status
    SELECT batch_name, status
    INTO v_batch_name, v_batch_status
    FROM public.import_batches
    WHERE id = p_batch_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El lote de importacion no existe.';
    END IF;

    IF v_batch_status NOT IN ('completed', 'completed_with_observations') THEN
        RAISE EXCEPTION 'Operacion no permitida: el lote debe estar en estado completed o completed_with_observations.';
    END IF;

    -- 5. Verify there are rows to revert
    IF NOT EXISTS (
        SELECT 1 
        FROM public.import_batch_rows
        WHERE batch_id = p_batch_id 
          AND execution_status = 'imported' 
          AND content_id IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'No hay filas importadas para revertir.';
    END IF;

    -- 6. Loop and process candidate rows
    FOR r_row IN 
        SELECT id, row_number, content_id, proposed_slug
        FROM public.import_batch_rows
        WHERE batch_id = p_batch_id
          AND execution_status = 'imported'
          AND content_id IS NOT NULL
        ORDER BY row_number ASC
    LOOP
        v_is_eligible := TRUE;

        -- A. Fetch current content properties
        SELECT title, subtitle, summary, body, content_type_id, category_id, institution_id,
               author_profile_id, region_id, province_id, municipality_id, event_date,
               publish_date, status, visibility, is_featured, source_reference, slug, import_batch_id
        INTO v_c_title, v_c_subtitle, v_c_summary, v_c_body, v_c_content_type_id, v_c_category_id, v_c_institution_id,
             v_c_author_profile_id, v_c_region_id, v_c_province_id, v_c_municipality_id, v_c_event_date,
             v_c_publish_date, v_c_status, v_c_visibility, v_c_is_featured, v_c_source_reference, v_c_slug, v_c_import_batch_id
        FROM public.contents
        WHERE id = r_row.content_id
        FOR UPDATE;

        IF NOT FOUND THEN
            v_is_eligible := FALSE;
        END IF;

        -- B. Verify row/lote/content consistent linking
        IF v_is_eligible THEN
            IF v_c_import_batch_id IS DISTINCT FROM p_batch_id OR 
               v_c_slug IS DISTINCT FROM r_row.proposed_slug THEN
                v_is_eligible := FALSE;
            END IF;
        END IF;

        -- C. Verify content is in draft status
        IF v_is_eligible THEN
            IF v_c_status IS DISTINCT FROM 'draft' THEN
                v_is_eligible := FALSE;
            END IF;
        END IF;

        -- D. Verify exactly one version (version_number = 1) exists in public.content_versions
        IF v_is_eligible THEN
            SELECT COUNT(*), MAX(version_number) INTO v_version_count, v_v1_version_number
            FROM public.content_versions
            WHERE content_id = r_row.content_id;

            IF v_version_count != 1 OR v_v1_version_number != 1 THEN
                v_is_eligible := FALSE;
            END IF;
        END IF;

        -- E. Read version 1 and compare each shared column (slug is excluded)
        IF v_is_eligible THEN
            SELECT title, subtitle, summary, body, content_type_id, category_id, institution_id,
                   author_profile_id, region_id, province_id, municipality_id, event_date,
                   publish_date, status, visibility, is_featured, source_reference, metadata
            INTO v_v1_title, v_v1_subtitle, v_v1_summary, v_v1_body, v_v1_content_type_id, v_v1_category_id, v_v1_institution_id,
                 v_v1_author_profile_id, v_v1_region_id, v_v1_province_id, v_v1_municipality_id, v_v1_event_date,
                 v_v1_publish_date, v_v1_status, v_v1_visibility, v_v1_is_featured, v_v1_source_reference, v_v1_metadata
            FROM public.content_versions
            WHERE content_id = r_row.content_id AND version_number = 1;

            IF NOT FOUND THEN
                v_is_eligible := FALSE;
            ELSE
                IF v_c_title IS DISTINCT FROM v_v1_title OR
                   v_c_subtitle IS DISTINCT FROM v_v1_subtitle OR
                   v_c_summary IS DISTINCT FROM v_v1_summary OR
                   v_c_body IS DISTINCT FROM v_v1_body OR
                   v_c_content_type_id IS DISTINCT FROM v_v1_content_type_id OR
                   v_c_category_id IS DISTINCT FROM v_v1_category_id OR
                   v_c_institution_id IS DISTINCT FROM v_v1_institution_id OR
                   v_c_author_profile_id IS DISTINCT FROM v_v1_author_profile_id OR
                   v_c_region_id IS DISTINCT FROM v_v1_region_id OR
                   v_c_province_id IS DISTINCT FROM v_v1_province_id OR
                   v_c_municipality_id IS DISTINCT FROM v_v1_municipality_id OR
                   v_c_event_date IS DISTINCT FROM v_v1_event_date OR
                   v_c_publish_date IS DISTINCT FROM v_v1_publish_date OR
                   v_c_status IS DISTINCT FROM v_v1_status OR
                   v_c_visibility IS DISTINCT FROM v_v1_visibility OR
                   v_c_is_featured IS DISTINCT FROM v_v1_is_featured OR
                   v_c_source_reference IS DISTINCT FROM v_v1_source_reference THEN
                    v_is_eligible := FALSE;
                END IF;
            END IF;
        END IF;

        -- F. Verify no editorial dependencies exist
        -- Check media assets
        IF v_is_eligible THEN
            IF EXISTS (SELECT 1 FROM public.media_assets WHERE content_id = r_row.content_id) THEN
                v_is_eligible := FALSE;
            END IF;
        END IF;

        -- Check editorial assignments
        IF v_is_eligible THEN
            IF EXISTS (
                SELECT 1 FROM public.editorial_assignments 
                WHERE entity_type = 'content' AND entity_id = r_row.content_id
            ) THEN
                v_is_eligible := FALSE;
            END IF;
        END IF;

        -- Check editorial relations (both source and target)
        IF v_is_eligible THEN
            IF EXISTS (
                SELECT 1 FROM public.editorial_relations 
                WHERE (source_entity_type = 'content' AND source_entity_id = r_row.content_id)
                   OR (target_entity_type = 'content' AND target_entity_id = r_row.content_id)
            ) THEN
                v_is_eligible := FALSE;
            END IF;
        END IF;

        -- G. Process reversion or manual review
        IF v_is_eligible THEN
            -- Create version 2 snapshot with status archived
            INSERT INTO public.content_versions (
                content_id, version_number, title, subtitle, summary, body, 
                content_type_id, category_id, institution_id, author_profile_id, 
                region_id, province_id, municipality_id, event_date, publish_date, 
                status, visibility, is_featured, source_reference, metadata, 
                change_summary, created_by_profile_id
            ) VALUES (
                r_row.content_id, 2, v_c_title, v_c_subtitle, v_c_summary, v_c_body,
                v_c_content_type_id, v_c_category_id, v_c_institution_id, v_c_author_profile_id,
                v_c_region_id, v_c_province_id, v_c_municipality_id, v_c_event_date, v_c_publish_date,
                'archived', v_c_visibility, v_c_is_featured, v_c_source_reference,
                COALESCE(v_v1_metadata, '{}'::jsonb) || pg_catalog.jsonb_build_object(
                    'reversion_type', 'automatic_batch_reversal',
                    'reverted_from_batch_id', p_batch_id,
                    'reverted_row_id', r_row.id
                ),
                'Reversion automatica de lote',
                v_profile_id
            );

            -- Update content status to archived
            UPDATE public.contents
            SET status = 'archived',
                updated_at = pg_catalog.now()
            WHERE id = r_row.content_id;

            -- Update row status to reverted
            UPDATE public.import_batch_rows
            SET execution_status = 'reverted',
                updated_at = pg_catalog.now()
            WHERE id = r_row.id;

            v_reverted_count := v_reverted_count + 1;
        ELSE
            -- Flag row as requiring manual review
            UPDATE public.import_batch_rows
            SET execution_status = 'reversal_manual_review',
                updated_at = pg_catalog.now()
            WHERE id = r_row.id;

            v_manual_review_count := v_manual_review_count + 1;
        END IF;

    END LOOP;

    -- 7. Determine final status
    IF v_manual_review_count = 0 THEN
        v_final_status := 'reverted';
    ELSE
        v_final_status := 'partially_reverted';
    END IF;

    -- 8. Update batch header with JSONB fusion
    UPDATE public.import_batches
    SET status = v_final_status,
        reverted_at = pg_catalog.now(),
        summary_report = COALESCE(summary_report, '{}'::jsonb) || pg_catalog.jsonb_build_object(
            'reverted_by_profile_id', v_profile_id,
            'reverted_at', pg_catalog.now(),
            'reverted_rows', v_reverted_count,
            'manual_review_rows', v_manual_review_count,
            'final_status', v_final_status
        )
    WHERE id = p_batch_id;

    -- 9. Insert log in public.admin_activity_logs
    INSERT INTO public.admin_activity_logs (
        actor_profile_id,
        action_type,
        entity_type,
        entity_id,
        entity_label,
        metadata
    ) VALUES (
        v_profile_id,
        'update',
        'import_batch',
        p_batch_id,
        v_batch_name,
        pg_catalog.jsonb_build_object(
            'reverted_rows', v_reverted_count,
            'manual_review_rows', v_manual_review_count,
            'final_status', v_final_status,
            'reverted_at', pg_catalog.now()
        )
    );

    -- 10. Build return JSONB
    v_result := pg_catalog.jsonb_build_object(
        'success', TRUE,
        'batch_id', p_batch_id,
        'status', v_final_status,
        'reverted_rows', v_reverted_count,
        'manual_review_rows', v_manual_review_count
    );

    RETURN v_result;
END;
$$;

-- 3. Security configurations
REVOKE ALL ON FUNCTION public.revert_ephemerides_import(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revert_ephemerides_import(UUID) TO authenticated;
