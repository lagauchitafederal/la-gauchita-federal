-- Migration 0035: Create ephemerides import execution RPC and alter admin activity logs constraint
-- Project: La Gauchita Federal
-- Scope: public.execute_ephemerides_import, public.admin_activity_logs
-- Note: All comments use ASCII encoding to avoid system-specific character issues.

-- 1. Alter check constraint on admin_activity_logs to allow 'import_batch' as entity_type
ALTER TABLE public.admin_activity_logs 
DROP CONSTRAINT IF EXISTS chk_admin_activity_logs_entity_type;

ALTER TABLE public.admin_activity_logs 
ADD CONSTRAINT chk_admin_activity_logs_entity_type 
CHECK (entity_type IN ('content', 'institution', 'recognition', 'media_asset', 'import_batch'));

-- 2. Create execute_ephemerides_import RPC function
CREATE OR REPLACE FUNCTION public.execute_ephemerides_import(p_batch_id UUID)
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
    v_total_rows INTEGER;
    v_valid_rows INTEGER;
    v_warning_rows INTEGER;
    v_duplicate_rows INTEGER;
    v_error_rows INTEGER;
    v_imported_count INTEGER := 0;
    v_skipped_count INTEGER := 0;
    v_final_status TEXT;
    v_content_type_id UUID;
    
    r_row RECORD;
    v_title TEXT;
    v_proposed_slug TEXT;
    v_current_slug TEXT;
    v_suffix_counter INTEGER;
    v_event_date DATE;
    v_category_id UUID;
    v_region_id UUID;
    v_province_id UUID;
    v_municipality_id UUID;
    v_source_reference TEXT;
    v_summary TEXT;
    v_body TEXT;
    v_subtitle TEXT;
    v_is_featured BOOLEAN;
    v_scope TEXT;
    
    v_new_content_id UUID;
    v_result JSONB;
    v_inserted BOOLEAN;
    v_slug_attempt_count INTEGER;
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
    SELECT batch_name, status, total_rows, valid_rows, warning_rows, duplicate_rows, error_rows
    INTO v_batch_name, v_batch_status, v_total_rows, v_valid_rows, v_warning_rows, v_duplicate_rows, v_error_rows
    FROM public.import_batches
    WHERE id = p_batch_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El lote de importacion no existe.';
    END IF;

    IF v_batch_status != 'validated' THEN
        RAISE EXCEPTION 'Operacion no permitida: el lote debe estar en estado validated.';
    END IF;

    -- 5. Transition batch to importing and set started_at
    UPDATE public.import_batches
    SET status = 'importing',
        started_at = pg_catalog.now()
    WHERE id = p_batch_id;

    -- 6. Retrieve content type ID for ephemeris
    SELECT id INTO v_content_type_id
    FROM public.content_types
    WHERE code = 'ephemeris';

    IF v_content_type_id IS NULL THEN
        RAISE EXCEPTION 'Error al crear el lote de importacion: Tipo de contenido ephemeris no encontrado.';
    END IF;

    -- 7. Loop and process rows
    FOR r_row IN 
        SELECT id, row_number, validation_status, execution_status, proposed_slug, raw_data, normalized_data
        FROM public.import_batch_rows
        WHERE batch_id = p_batch_id
        ORDER BY row_number ASC
    LOOP
        -- Verify row execution status is pending
        IF r_row.execution_status != 'pending' THEN
            RAISE EXCEPTION 'Error al guardar las filas de validacion: la fila % no esta pendiente.', r_row.row_number;
        END IF;

        IF r_row.validation_status IN ('valida', 'valida_con_observaciones') THEN
            -- Revalidate metadata values in SQL using exact keys from normalized_data schema
            v_title := r_row.normalized_data->>'title';
            
            IF v_title IS NULL OR pg_catalog.btrim(v_title) = '' THEN
                RAISE EXCEPTION 'Error al guardar las filas de validacion: el titulo de la fila % esta vacio.', r_row.row_number;
            END IF;

            v_proposed_slug := pg_catalog.btrim(r_row.proposed_slug);
            IF v_proposed_slug IS NULL OR v_proposed_slug = '' THEN
                RAISE EXCEPTION 'Error al guardar las filas de validacion: el slug propuesto de la fila % esta vacio.', r_row.row_number;
            END IF;

            -- Event date
            IF r_row.normalized_data->>'event_date' IS NULL THEN
                RAISE EXCEPTION 'Error al guardar las filas de validacion: la fecha historica de la fila % es requerida.', r_row.row_number;
            END IF;
            
            -- Strict format check YYYY-MM-DD using schema-qualified regexp_match
            IF pg_catalog.regexp_match(r_row.normalized_data->>'event_date', '^\d{4}-\d{2}-\d{2}$') IS NULL THEN
                RAISE EXCEPTION 'Error al guardar las filas de validacion: la fecha historica de la fila % no cumple con el formato YYYY-MM-DD.', r_row.row_number;
            END IF;

            BEGIN
                v_event_date := (r_row.normalized_data->>'event_date')::DATE;
            EXCEPTION WHEN OTHERS THEN
                RAISE EXCEPTION 'Error al guardar las filas de validacion: la fecha historica de la fila % no es valida.', r_row.row_number;
            END;

            -- Category
            v_category_id := NULL;
            IF r_row.normalized_data->>'category_id' IS NOT NULL THEN
                v_category_id := (r_row.normalized_data->>'category_id')::UUID;
                IF NOT EXISTS (SELECT 1 FROM public.categories WHERE id = v_category_id) THEN
                    RAISE EXCEPTION 'Error al guardar las filas de validacion: la categoria de la fila % no existe.', r_row.row_number;
                END IF;
            END IF;

            -- Region
            v_region_id := NULL;
            IF r_row.normalized_data->>'region_id' IS NOT NULL THEN
                v_region_id := (r_row.normalized_data->>'region_id')::UUID;
                IF NOT EXISTS (SELECT 1 FROM public.regions WHERE id = v_region_id) THEN
                    RAISE EXCEPTION 'Error al guardar las filas de validacion: la region de la fila % no existe.', r_row.row_number;
                END IF;
            END IF;

            -- Province
            v_province_id := NULL;
            IF r_row.normalized_data->>'province_id' IS NOT NULL THEN
                v_province_id := (r_row.normalized_data->>'province_id')::UUID;
                IF NOT EXISTS (SELECT 1 FROM public.provinces WHERE id = v_province_id) THEN
                    RAISE EXCEPTION 'Error al guardar las filas de validacion: la provincia de la fila % no existe.', r_row.row_number;
                END IF;
            END IF;

            -- Municipality
            v_municipality_id := NULL;
            IF r_row.normalized_data->>'municipality_id' IS NOT NULL THEN
                v_municipality_id := (r_row.normalized_data->>'municipality_id')::UUID;
                
                -- Verify municipality exists
                IF NOT EXISTS (
                    SELECT 1 
                    FROM public.municipalities 
                    WHERE id = v_municipality_id
                ) THEN
                    RAISE EXCEPTION 'Error al guardar las filas de validacion: el municipio de la fila % no existe.', r_row.row_number;
                END IF;
            END IF;

            -- Retrieve and validate scope from raw_data
            v_scope := pg_catalog.lower(
                pg_catalog.btrim(r_row.raw_data->>'scope')
            );

            IF v_scope NOT IN ('nacional', 'regional', 'provincial', 'municipal') THEN
                RAISE EXCEPTION 'Error al guardar las filas de validacion: el alcance territorial de la fila % debe ser nacional, regional, provincial o municipal.', r_row.row_number;
            END IF;

            -- Revalidate scope and hierarchy coherence
            IF v_scope = 'nacional' THEN
                IF v_region_id IS NOT NULL OR v_province_id IS NOT NULL OR v_municipality_id IS NOT NULL THEN
                    RAISE EXCEPTION 'Error al guardar las filas de validacion: el alcance nacional de la fila % no debe incluir region, provincia ni municipio.', r_row.row_number;
                END IF;
            ELSIF v_scope = 'regional' THEN
                IF v_region_id IS NULL THEN
                    RAISE EXCEPTION 'Error al guardar las filas de validacion: el alcance regional de la fila % requiere region.', r_row.row_number;
                END IF;
                IF v_province_id IS NOT NULL OR v_municipality_id IS NOT NULL THEN
                    RAISE EXCEPTION 'Error al guardar las filas de validacion: el alcance regional de la fila % no debe incluir provincia ni municipio.', r_row.row_number;
                END IF;
            ELSIF v_scope = 'provincial' THEN
                IF v_province_id IS NULL THEN
                    RAISE EXCEPTION 'Error al guardar las filas de validacion: el alcance provincial de la fila % requiere provincia.', r_row.row_number;
                END IF;
                IF v_municipality_id IS NOT NULL THEN
                    RAISE EXCEPTION 'Error al guardar las filas de validacion: el alcance provincial de la fila % no debe incluir municipio.', r_row.row_number;
                END IF;
            ELSIF v_scope = 'municipal' THEN
                IF v_municipality_id IS NULL OR v_province_id IS NULL THEN
                    RAISE EXCEPTION 'Error al guardar las filas de validacion: el alcance municipal de la fila % requiere municipio y provincia.', r_row.row_number;
                END IF;
            END IF;

            -- Verify municipality belongs to selected province (if municipal)
            IF v_scope = 'municipal' AND v_municipality_id IS NOT NULL THEN
                IF NOT EXISTS (
                    SELECT 1 
                    FROM public.municipalities 
                    WHERE id = v_municipality_id AND province_id = v_province_id
                ) THEN
                    RAISE EXCEPTION 'Error al guardar las filas de validacion: el municipio de la fila % no corresponde a la provincia seleccionada.', r_row.row_number;
                END IF;
            END IF;

            -- Check if province matches region (if both provided)
            IF v_province_id IS NOT NULL AND v_region_id IS NOT NULL THEN
                IF NOT EXISTS (
                    SELECT 1 
                    FROM public.provinces 
                    WHERE id = v_province_id AND region_id = v_region_id
                ) THEN
                    RAISE EXCEPTION 'Error al guardar las filas de validacion: la provincia de la fila % no corresponde a la region seleccionada.', r_row.row_number;
                END IF;
            END IF;

            -- Other optional text metadata (subtitle is excluded by validator schema contract)
            v_subtitle := NULL;
            v_summary := r_row.normalized_data->>'summary';
            v_body := r_row.normalized_data->>'body';
            v_source_reference := r_row.normalized_data->>'source_reference';
            v_is_featured := FALSE; -- Always draft and not featured in this phase

            -- Resolve slug collision dynamically using advisory locks on candidates
            v_current_slug := v_proposed_slug;
            v_suffix_counter := 1;
            v_inserted := FALSE;
            v_slug_attempt_count := 0;

            WHILE NOT v_inserted LOOP
                -- Increment attempt count
                v_slug_attempt_count := v_slug_attempt_count + 1;
                IF v_slug_attempt_count > 100 THEN
                    RAISE EXCEPTION 'Error al guardar las filas de validacion: limite de reintentos por colision de slug superado en la fila %.', r_row.row_number;
                END IF;

                -- Acquire advisory lock by base slug candidate to coordinate concurrent updates
                PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_current_slug));

                -- Verify existence in public.contents
                IF EXISTS (
                    SELECT 1 FROM public.contents WHERE slug = v_current_slug
                ) THEN
                    -- Slug exists, increment suffix for next attempt
                    v_current_slug := v_proposed_slug || '-' || v_suffix_counter;
                    v_suffix_counter := v_suffix_counter + 1;
                ELSE
                    -- Attempt insertion with unique violation protection
                    BEGIN
                        -- Insert the content in public.contents as draft and public visibility
                        INSERT INTO public.contents (
                            title, slug, subtitle, summary, body, 
                            content_type_id, category_id, author_profile_id, 
                            region_id, province_id, municipality_id, 
                            event_date, publish_date, status, visibility, 
                            is_featured, source_reference, import_batch_id
                        ) VALUES (
                            v_title, v_current_slug, v_subtitle, v_summary, v_body,
                            v_content_type_id, v_category_id, v_profile_id,
                            v_region_id, v_province_id, v_municipality_id,
                            v_event_date, NULL, 'draft', 'public',
                            v_is_featured, v_source_reference, p_batch_id
                        ) RETURNING id INTO v_new_content_id;

                        v_inserted := TRUE;
                    EXCEPTION WHEN unique_violation THEN
                        -- Increment suffix for next attempt
                        v_current_slug := v_proposed_slug || '-' || v_suffix_counter;
                        v_suffix_counter := v_suffix_counter + 1;
                    END;
                END IF;
            END LOOP;

            -- Create the content version snapshot with version_number = 1
            INSERT INTO public.content_versions (
                content_id, version_number, title, subtitle, summary, body, 
                content_type_id, category_id, institution_id, author_profile_id, 
                region_id, province_id, municipality_id, event_date, publish_date, 
                status, visibility, is_featured, source_reference, metadata, 
                change_summary, created_by_profile_id
            ) VALUES (
                v_new_content_id, 1, v_title, v_subtitle, v_summary, v_body,
                v_content_type_id, v_category_id, NULL, v_profile_id,
                v_region_id, v_province_id, v_municipality_id, v_event_date, NULL,
                'draft', 'public', v_is_featured, v_source_reference,
                pg_catalog.jsonb_build_object(
                    'import_type', 'ephemerides_csv',
                    'import_batch_id', p_batch_id,
                    'import_row_id', r_row.id
                ),
                'Creacion inicial desde importacion masiva de efemerides.',
                v_profile_id
            );

            -- Update row status to imported
            UPDATE public.import_batch_rows
            SET execution_status = 'imported',
                content_id = v_new_content_id,
                proposed_slug = v_current_slug,
                updated_at = pg_catalog.now()
            WHERE id = r_row.id;

            v_imported_count := v_imported_count + 1;

        ELSE
            -- validation_status is 'duplicado_probable' or 'error', mark as skipped
            UPDATE public.import_batch_rows
            SET execution_status = 'skipped',
                updated_at = pg_catalog.now()
            WHERE id = r_row.id;

            v_skipped_count := v_skipped_count + 1;
        END IF;

    END LOOP;

    -- 9. Determine final status
    IF v_skipped_count = 0 THEN
        v_final_status := 'completed';
    ELSE
        v_final_status := 'completed_with_observations';
    END IF;

    -- 10. Update batch header with JSONB fusion
    UPDATE public.import_batches
    SET status = v_final_status,
        imported_rows = v_imported_count,
        skipped_rows = v_skipped_count,
        completed_at = pg_catalog.now(),
        summary_report = COALESCE(summary_report, '{}'::jsonb) || pg_catalog.jsonb_build_object(
            'executed_by_profile_id', v_profile_id,
            'executed_at', pg_catalog.now(),
            'imported_rows', v_imported_count,
            'skipped_rows', v_skipped_count,
            'final_status', v_final_status
        )
    WHERE id = p_batch_id;

    -- 11. Insert log in public.admin_activity_logs
    INSERT INTO public.admin_activity_logs (
        actor_profile_id,
        action_type,
        entity_type,
        entity_id,
        entity_label,
        metadata
    ) VALUES (
        v_profile_id,
        'create',
        'import_batch',
        p_batch_id,
        v_batch_name,
        pg_catalog.jsonb_build_object(
            'imported_rows', v_imported_count,
            'skipped_rows', v_skipped_count,
            'final_status', v_final_status,
            'executed_at', pg_catalog.now()
        )
    );

    -- 12. Build return JSONB
    v_result := pg_catalog.jsonb_build_object(
        'success', TRUE,
        'batch_id', p_batch_id,
        'status', v_final_status,
        'imported_rows', v_imported_count,
        'skipped_rows', v_skipped_count
    );

    RETURN v_result;
END;
$$;

-- 3. Security configurations
REVOKE ALL ON FUNCTION public.execute_ephemerides_import(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.execute_ephemerides_import(UUID) TO authenticated;
