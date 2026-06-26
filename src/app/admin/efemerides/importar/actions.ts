'use server';

import { parseCsv, mapHeaders } from '../../../../lib/admin/ephemerides-import/csv-parser';
import { validateEphemeridesImport, RowValidationResult } from '../../../../lib/admin/ephemerides-import/import-validator';

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
 * Next.js Server Action to validate a uploaded CSV string.
 * This runs entirely on the server and is protected by the admin route layout auth checks.
 */
export async function validateEphemeridesCsvAction(csvText: string): Promise<ValidateCsvResponse> {
  try {
    if (!csvText || csvText.trim() === '') {
      return { success: false, error: 'El archivo est\u00e1 vac\u00edo.' };
    }

    // 1. Structural parsing
    const parsed = parseCsv(csvText);
    if (parsed.errors.length > 0) {
      return { success: false, error: parsed.errors.join(' ') };
    }

    // 2. Limit row validation checks (1,000 rows max as per spec)
    if (parsed.rows.length > 1000) {
      return { success: false, error: 'El archivo supera el l\u00edmite m\u00e1ximo de 1.000 filas para previsualizaci\u00f3n.' };
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
      error: err.message || 'Ocurri\u00f3 un error inesperado al procesar la validaci\u00f3n.'
    };
  }
}
