'use server';

import { parseCsv, mapHeaders } from '../../../../lib/admin/ephemerides-import/csv-parser';
import { validateEphemeridesImport, RowValidationResult } from '../../../../lib/admin/ephemerides-import/import-validator';
import { createAuthenticatedServerSupabaseClient } from '../../../../lib/supabase/server';
import { logAdminActivity } from '../../../../lib/admin/admin-activity';
import crypto from 'crypto';

export interface ValidateCsvResponse {
  success: boolean;
  error?: string;
  results?: RowValidationResult[];
  summary?: {
    totalRows: number;
    validRows: number;
    warningRows: number;
    duplicateRows: number;
    errorRows: number;
  };
}

/**
 * Next.js Server Action to validate an uploaded CSV string.
 * This runs entirely on the server and is protected by the admin route layout auth checks.
 */
export async function validateEphemeridesCsvAction(csvText: string): Promise<ValidateCsvResponse> {
  try {
    if (!csvText || csvText.trim() === '') {
      return { success: false, error: 'El archivo está vacío.' };
    }

    // 1. Structural parsing
    const parsed = parseCsv(csvText);
    if (parsed.errors.length > 0) {
      return { success: false, error: parsed.errors.join(' ') };
    }

    // 2. Limit row validation checks (1,000 rows max as per spec)
    if (parsed.rows.length > 1000) {
      return { success: false, error: 'El archivo supera el límite máximo de 1.000 filas para previsualización.' };
    }

    // 3. Map and check mandatory headers
    const headersMapping = mapHeaders(parsed.headers);
    const requiredColumns = ['titulo', 'fecha_historica', 'alcance_territorial'];
    const missingColumns: string[] = [];

    requiredColumns.forEach(col => {
      if (headersMapping[col] === undefined) {
        // Map back to standard Spanish label for error clarity
        const labels: Record<string, string> = {
          titulo: 'titulo',
          fecha_historica: 'fecha_historica',
          alcance_territorial: 'alcance_territorial'
        };
        missingColumns.push(labels[col] || col);
      }
    });

    if (missingColumns.length > 0) {
      return { 
        success: false, 
        error: `El archivo CSV no contiene las columnas obligatorias requeridas: ${missingColumns.join(', ')}.` 
      };
    }

    // 4. Perform complete row-by-row validation using catalogs and unique slug generator
    const results = await validateEphemeridesImport(parsed.rows, headersMapping);

    // 5. Build summary metrics
    let validRows = 0;
    let warningRows = 0;
    let duplicateRows = 0;
    let errorRows = 0;

    results.forEach(r => {
      if (r.status === 'valida') validRows++;
      else if (r.status === 'valida_con_observaciones') warningRows++;
      else if (r.status === 'duplicado_probable') duplicateRows++;
      else if (r.status === 'error') errorRows++;
    });

    return {
      success: true,
      results,
      summary: {
        totalRows: results.length,
        validRows,
        warningRows,
        duplicateRows,
        errorRows
      }
    };
  } catch (err: any) {
    console.error('Error in validateEphemeridesCsvAction:', err);
    return {
      success: false,
      error: err.message || 'Ocurrió un error inesperado al procesar la validación.'
    };
  }
}

export interface SaveBatchResponse {
  success: boolean;
  error?: string;
  batchId?: string;
}

/**
 * Validates the structure and format of the payload in the server
 * to prevent malformed data from being inserted.
 */
function validateServerPayload(
  batchName: string,
  fileName: string | null,
  results: RowValidationResult[]
): { isValid: boolean; error?: string } {
  if (!batchName || typeof batchName !== 'string' || batchName.trim() === '' || batchName.length > 255) {
    return { isValid: false, error: 'El nombre del lote no es válido o supera el límite de longitud.' };
  }

  if (fileName !== null && (typeof fileName !== 'string' || fileName.length > 255)) {
    return { isValid: false, error: 'El nombre del archivo no es válido o supera el límite de longitud.' };
  }

  if (!Array.isArray(results)) {
    return { isValid: false, error: 'Los resultados de validación deben ser un array.' };
  }

  if (results.length === 0) {
    return { isValid: false, error: 'No hay resultados de validación para guardar.' };
  }

  if (results.length > 1000) {
    return { isValid: false, error: 'El lote supera el límite máximo de 1.000 filas.' };
  }

  const allowedStatuses = ['valida', 'valida_con_observaciones', 'duplicado_probable', 'error'];
  const seenRowNumbers = new Set<number>();

  for (const row of results) {
    if (!row || typeof row !== 'object') {
      return { isValid: false, error: 'Formato de fila inválido.' };
    }

    const { rowNumber, status, errors, warnings, rawData, normalizedData, proposedSlug } = row;

    if (typeof rowNumber !== 'number' || rowNumber <= 0 || !Number.isInteger(rowNumber)) {
      return { isValid: false, error: 'Cada fila debe tener un número de fila entero positivo.' };
    }

    if (seenRowNumbers.has(rowNumber)) {
      return { isValid: false, error: `Número de fila duplicado detectado: ${rowNumber}.` };
    }
    seenRowNumbers.add(rowNumber);

    if (!allowedStatuses.includes(status)) {
      return { isValid: false, error: `Estado de validación no permitido: ${status}.` };
    }

    if (!Array.isArray(errors) || !Array.isArray(warnings)) {
      return { isValid: false, error: 'Errores y advertencias deben ser arrays.' };
    }

    if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
      return { isValid: false, error: 'Los datos originales (rawData) deben ser un objeto seguro.' };
    }

    if (normalizedData !== undefined && normalizedData !== null) {
      if (typeof normalizedData !== 'object' || Array.isArray(normalizedData)) {
        return { isValid: false, error: 'Los datos normalizados deben ser un objeto seguro.' };
      }
    }

    if (proposedSlug !== undefined && proposedSlug !== null && typeof proposedSlug !== 'string') {
      return { isValid: false, error: 'El slug propuesto debe ser una cadena de texto.' };
    }
  }

  return { isValid: true };
}

/**
 * Next.js Server Action to persist a validated CSV import batch.
 */
export async function saveEphemeridesImportBatchAction(
  batchName: string,
  fileName: string | null,
  results: RowValidationResult[]
): Promise<SaveBatchResponse> {
  try {
    // 1. Validate payload format in the server
    const validation = validateServerPayload(batchName, fileName, results);
    if (!validation.isValid) {
      return { success: false, error: validation.error || 'Ocurrió un error inesperado al guardar el lote de importación.' };
    }

    // 2. Initialize authenticated Supabase client using server-side project helper
    let supabase;
    try {
      const clientInfo = await createAuthenticatedServerSupabaseClient();
      supabase = clientInfo.supabase;
    } catch (err: any) {
      return { success: false, error: 'No autorizado: sesión no válida.' };
    }

    // 3. Authenticate User and verify active profile
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      return { success: false, error: 'No autorizado: sesión no válida.' };
    }
    if (!user) {
      return { success: false, error: 'No autorizado: usuario no válido.' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, status')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (profileError || !profile || profile.status !== 'active') {
      return { success: false, error: 'No autorizado: usuario no válido.' };
    }

    // 4. Fetch roles to verify administrative/editorial privileges
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role_id, roles(code)')
      .eq('profile_id', profile.id);

    if (rolesError) {
      return { success: false, error: 'Error al verificar privilegios de rol.' };
    }

    const roleCodes: string[] = (userRoles || [])
      .map((ur: any) => ur.roles ? (Array.isArray(ur.roles) ? ur.roles[0]?.code : ur.roles.code) : null)
      .filter(Boolean);

    const hasAdminRole = roleCodes.some(code => ['super_admin', 'general_admin', 'federal_editor'].includes(code));
    if (!hasAdminRole) {
      return { success: false, error: 'No autorizado: usuario no válido.' };
    }

    // 5. Calculate statistics and metadata
    let validRows = 0;
    let warningRows = 0;
    let duplicateRows = 0;
    let errorRows = 0;

    results.forEach(r => {
      if (r.status === 'valida') validRows++;
      else if (r.status === 'valida_con_observaciones') warningRows++;
      else if (r.status === 'duplicado_probable') duplicateRows++;
      else if (r.status === 'error') errorRows++;
    });

    const totalRows = results.length;
    const fileHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(results))
      .digest('hex');

    // 6. Insert batch header
    const { data: batch, error: batchError } = await supabase
      .from('import_batches')
      .insert({
        import_type: 'ephemerides_csv',
        batch_name: batchName.trim(),
        source_file_name: fileName || null,
        file_hash: fileHash,
        status: 'validated',
        total_rows: totalRows,
        valid_rows: validRows,
        warning_rows: warningRows,
        duplicate_rows: duplicateRows,
        error_rows: errorRows,
        imported_rows: 0,
        skipped_rows: 0,
        created_by_profile_id: profile.id,
        validated_at: new Date().toISOString(),
        config: {},
        summary_report: {
          total_rows: totalRows,
          valid_rows: validRows,
          warning_rows: warningRows,
          duplicate_rows: duplicateRows,
          error_rows: errorRows
        }
      })
      .select('id')
      .single();

    if (batchError || !batch) {
      return { success: false, error: `Error al crear el lote de importación: ${batchError?.message || 'Error desconocido'}` };
    }

    const batchId = batch.id;
    let partialInsertError: any = null;
    let rowsInsertedSuccessfully = true;

    // 7. Insert batch rows in chunks
    const rowsToInsert = results.map(r => ({
      batch_id: batchId,
      row_number: r.rowNumber,
      validation_status: r.status,
      execution_status: 'pending',
      proposed_slug: r.proposedSlug || null,
      raw_data: r.rawData,
      normalized_data: r.normalizedData || {},
      validation_messages: {
        errors: r.errors || [],
        warnings: r.warnings || []
      }
    }));

    const chunkSize = 200;
    for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
      const chunk = rowsToInsert.slice(i, i + chunkSize);
      const { error: rowsError } = await supabase
        .from('import_batch_rows')
        .insert(chunk);

      if (rowsError) {
        rowsInsertedSuccessfully = false;
        partialInsertError = rowsError;
        break;
      }
    }

    // 8. Handle partial failures (fallback status update)
    if (!rowsInsertedSuccessfully) {
      await supabase
        .from('import_batches')
        .update({
          status: 'failed',
          summary_report: {
            total_rows: totalRows,
            valid_rows: validRows,
            warning_rows: warningRows,
            duplicate_rows: duplicateRows,
            error_rows: errorRows,
            technical_error: partialInsertError?.message || 'Error al guardar filas de validación'
          }
        })
        .eq('id', batchId);

      return {
        success: false,
        error: `Error al guardar las filas de validación: ${partialInsertError?.message || 'Error desconocido'}`
      };
    }

    // 9. Log administrative activity (entity_type: 'import_batch')
    await logAdminActivity({
      action_type: 'create',
      entity_type: 'import_batch',
      entity_id: batchId,
      entity_label: `Lote de importación: ${batchName.trim()}`,
      metadata: {
        import_type: 'ephemerides_csv',
        batch_id: batchId,
        total_rows: totalRows,
        valid_rows: validRows,
        warning_rows: warningRows,
        duplicate_rows: duplicateRows,
        error_rows: errorRows,
        source_file_name: fileName || null,
      }
    });

    return { success: true, batchId };
  } catch (err: any) {
    console.error('Error in saveEphemeridesImportBatchAction:', err);
    return {
      success: false,
      error: 'Ocurrió un error inesperado al guardar el lote de importación.'
    };
  }
}

export interface ExecuteBatchResponse {
  success: boolean;
  error?: string;
  data?: {
    success: boolean;
    batch_id: string;
    status: string;
    imported_rows: number;
    skipped_rows: number;
  };
}

/**
 * Next.js Server Action to execute a validated import batch.
 * Invokes public.execute_ephemerides_import inside PostgreSQL.
 */
export async function executeEphemeridesImportAction(batchId: string): Promise<ExecuteBatchResponse> {
  try {
    // 1. Revalidate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!batchId || !uuidRegex.test(batchId)) {
      return { success: false, error: 'Identificador de lote no válido (formato UUID incorrecto).' };
    }

    // 2. Initialize authenticated Supabase client using server-side helper
    let supabase;
    try {
      const clientObj = await createAuthenticatedServerSupabaseClient();
      supabase = clientObj.supabase;
    } catch (authError) {
      console.error('Auth helper initialization failed:', authError);
      return { success: false, error: 'No autorizado: sesión no válida.' };
    }

    // 3. Execute the import process via RPC
    const { data, error } = await supabase.rpc('execute_ephemerides_import', {
      p_batch_id: batchId
    });

    if (error) {
      console.error('RPC execute_ephemerides_import failed:', error);
      return { 
        success: false, 
        error: error.message || 'Error al ejecutar la importación en la base de datos.' 
      };
    }

    // Since RPC returns a JSONB, we cast and verify it
    const res = data as any;
    if (!res || !res.success) {
      return { 
        success: false, 
        error: 'La ejecución del lote falló o no devolvió un resultado exitoso.' 
      };
    }

    return {
      success: true,
      data: {
        success: res.success,
        batch_id: res.batch_id,
        status: res.status,
        imported_rows: res.imported_rows,
        skipped_rows: res.skipped_rows
      }
    };
  } catch (err: any) {
    console.error('Error in executeEphemeridesImportAction:', err);
    return {
      success: false,
      error: 'Ocurrió un error inesperado al ejecutar el lote de importación.'
    };
  }
}

export interface RevertBatchResponse {
  success: boolean;
  error?: string;
  data?: {
    success: boolean;
    batch_id: string;
    status: string;
    reverted_rows: number;
    manual_review_rows: number;
  };
}

/**
 * Next.js Server Action to revert an executed import batch.
 * Invokes public.revert_ephemerides_import inside PostgreSQL.
 */
export async function revertEphemeridesImportAction(batchId: string): Promise<RevertBatchResponse> {
  try {
    // 1. Revalidate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!batchId || !uuidRegex.test(batchId)) {
      return { success: false, error: 'Identificador de lote no válido (formato UUID incorrecto).' };
    }

    // 2. Initialize authenticated Supabase client using server-side helper
    let supabase;
    try {
      const clientObj = await createAuthenticatedServerSupabaseClient();
      supabase = clientObj.supabase;
    } catch (authError) {
      console.error('Auth helper initialization failed:', authError);
      return { success: false, error: 'No autorizado: sesión no válida.' };
    }

    // 3. Execute the reversion process via RPC
    const { data, error } = await supabase.rpc('revert_ephemerides_import', {
      p_batch_id: batchId
    });

    if (error) {
      console.error('RPC revert_ephemerides_import failed:', error);
      return { 
        success: false, 
        error: error.message || 'Error al revertir la importación en la base de datos.' 
      };
    }

    const res = data as any;
    if (!res || !res.success) {
      return { 
        success: false, 
        error: 'La reversión del lote falló o no devolvió un resultado exitoso.' 
      };
    }

    return {
      success: true,
      data: {
        success: res.success,
        batch_id: res.batch_id,
        status: res.status,
        reverted_rows: res.reverted_rows,
        manual_review_rows: res.manual_review_rows
      }
    };
  } catch (err: any) {
    console.error('Error in revertEphemeridesImportAction:', err);
    return {
      success: false,
      error: 'Ocurrió un error inesperado al revertir el lote de importación.'
    };
  }
}
