import { createAuthenticatedServerSupabaseClient } from '../supabase/server';

export interface ImportBatch {
  id: string;
  import_type: string;
  batch_name: string;
  source_file_name: string | null;
  file_hash: string | null;
  status: string;
  total_rows: number;
  valid_rows: number;
  warning_rows: number;
  duplicate_rows: number;
  error_rows: number;
  imported_rows: number;
  skipped_rows: number;
  created_by_profile_id: string | null;
  created_at: string;
  validated_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  reverted_at: string | null;
  config: any;
  summary_report: any;
  created_by?: { display_name: string | null } | null;
}

export interface ImportBatchRow {
  id: string;
  batch_id: string;
  row_number: number;
  validation_status: 'valida' | 'valida_con_observaciones' | 'duplicado_probable' | 'error';
  execution_status: string;
  proposed_slug: string | null;
  content_id: string | null;
  raw_data: any;
  normalized_data: any;
  validation_messages: {
    errors: string[];
    warnings: string[];
  };
  created_at: string;
  updated_at: string;
}

/**
 * Gets a paginated list of import batches, ordered by created_at DESC.
 */
export async function getImportBatchesList(page: number = 1, pageSize: number = 20): Promise<{ data: ImportBatch[]; count: number }> {
  try {
    const { supabase } = await createAuthenticatedServerSupabaseClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('import_batches')
      .select(`
        *,
        profiles:created_by_profile_id(display_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching import batches:', error);
      throw error;
    }

    const formattedData = (data || []).map((b: any) => ({
      ...b,
      created_by: Array.isArray(b.profiles) ? b.profiles[0] || null : b.profiles || null
    })) as ImportBatch[];

    return {
      data: formattedData,
      count: count || 0
    };
  } catch (err) {
    console.error('Unexpected error in getImportBatchesList:', err);
    throw err;
  }
}

/**
 * Gets a single import batch by ID.
 */
export async function getImportBatchById(id: string): Promise<ImportBatch | null> {
  try {
    const { supabase } = await createAuthenticatedServerSupabaseClient();
    const { data, error } = await supabase
      .from('import_batches')
      .select(`
        *,
        profiles:created_by_profile_id(display_name)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching import batch by id:', error);
      throw error;
    }

    if (!data) return null;

    return {
      ...data,
      created_by: Array.isArray(data.profiles) ? data.profiles[0] || null : data.profiles || null
    } as ImportBatch;
  } catch (err) {
    console.error('Unexpected error in getImportBatchById:', err);
    throw err;
  }
}

/**
 * Gets a paginated list of batch rows for a specific batch ID, with filter options.
 */
export async function getBatchRows(
  batchId: string,
  page: number = 1,
  pageSize: number = 20,
  filter: 'todos' | 'valida' | 'valida_con_observaciones' | 'duplicado_probable' | 'error' = 'todos'
): Promise<{ data: ImportBatchRow[]; count: number }> {
  try {
    const { supabase } = await createAuthenticatedServerSupabaseClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('import_batch_rows')
      .select('*', { count: 'exact' })
      .eq('batch_id', batchId);

    if (filter !== 'todos') {
      query = query.eq('validation_status', filter);
    }

    const { data, error, count } = await query
      .order('row_number', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Error fetching batch rows:', error);
      throw error;
    }

    return {
      data: (data || []) as ImportBatchRow[],
      count: count || 0
    };
  } catch (err) {
    console.error('Unexpected error in getBatchRows:', err);
    throw err;
  }
}
