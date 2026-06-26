import { getCategories } from '../../catalogs/catalogs';
import { validateTerritory } from '../territory-validation';
import { validateHistoricalDate } from '../../utils/date';
import { getUniqueContentSlugsBatch } from '../batch-slug-utils';
import { generateSlug } from '../slug-utils';
import { createServerSupabaseClient } from '../../supabase/server';

export interface RowValidationResult {
  rowNumber: number;
  status: 'valida' | 'valida_con_observaciones' | 'duplicado_probable' | 'error';
  errors: string[];
  warnings: string[];
  proposedSlug: string;
  normalizedData?: {
    title: string;
    event_date: string;
    summary: string | null;
    body: string | null;
    category_id: string | null;
    region_id: string | null;
    province_id: string | null;
    municipality_id: string | null;
    source_reference: string | null;
    is_featured: boolean;
    observaciones: string | null;
  };
  rawData: {
    title: string;
    date: string;
    scope: string;
    category: string;
    region: string;
    province: string;
    municipality: string;
    source: string;
    featured: string;
    observaciones: string;
  };
}

/**
 * Normalizes title strings for strict duplicate comparison.
 */
function normalizeTitle(val: string): string {
  return val
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validates a parsed CSV row collection for bulk ephemerides loading.
 * Queries existing database records in a highly optimized manner.
 */
export async function validateEphemeridesImport(
  rows: string[][],
  headersMapping: { [key: string]: number }
): Promise<RowValidationResult[]> {
  const results: RowValidationResult[] = [];
  
  if (!rows || rows.length === 0) return [];

  const supabase = createServerSupabaseClient();
  const categoriesCatalog = await getCategories();

  // 1. Prepare proposed slugs batch in memory using the optimized helper
  const titles = rows.map(row => {
    const titleVal = row[headersMapping['titulo']];
    return titleVal && titleVal.trim() !== '' ? titleVal.trim() : 'sin-titulo';
  });
  
  const proposedSlugs = await getUniqueContentSlugsBatch(titles);

  // 2. Query database in a single bulk select for base slugs to check conflicts
  const baseSlugs = titles.map(t => generateSlug(t));
  const dbExistingSlugs = new Set<string>();

  if (baseSlugs.length > 0) {
    const chunkSize = 500;
    for (let i = 0; i < baseSlugs.length; i += chunkSize) {
      const chunk = baseSlugs.slice(i, i + chunkSize);
      const { data, error } = await supabase
        .from('contents')
        .select('slug')
        .in('slug', chunk);

      if (error) {
        console.error('Error al consultar slugs en base de datos para importador:', error);
      } else if (data) {
        for (const row of data) {
          dbExistingSlugs.add(row.slug);
        }
      }
    }
  }

  // 3. Tracking sets for inside-file duplicates detection
  const fileDuplicateKeys = new Set<string>();

  // 4. Validate each row sequentially
  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const rowNumber = idx + 2; // Row 1 is headers
    const proposedSlug = proposedSlugs[idx];
    
    const errors: string[] = [];
    const warnings: string[] = [];

    // Extract raw fields safely based on header mappings
    const rawTitle = headersMapping['titulo'] !== undefined ? row[headersMapping['titulo']] : '';
    const rawDate = headersMapping['fecha_historica'] !== undefined ? row[headersMapping['fecha_historica']] : '';
    const rawScope = headersMapping['alcance_territorial'] !== undefined ? row[headersMapping['alcance_territorial']] : '';
    
    const rawSummary = headersMapping['resumen'] !== undefined ? row[headersMapping['resumen']] : '';
    const rawBody = headersMapping['cuerpo'] !== undefined ? row[headersMapping['cuerpo']] : '';
    const rawCategory = headersMapping['categoria'] !== undefined ? row[headersMapping['categoria']] : '';
    const rawRegion = headersMapping['region'] !== undefined ? row[headersMapping['region']] : '';
    const rawProvince = headersMapping['provincia'] !== undefined ? row[headersMapping['provincia']] : '';
    const rawMunicipio = headersMapping['municipio'] !== undefined ? row[headersMapping['municipio']] : '';
    const rawSource = headersMapping['fuente'] !== undefined ? row[headersMapping['fuente']] : '';
    const rawFeatured = headersMapping['destacado'] !== undefined ? row[headersMapping['destacado']] : '';
    const rawObs = headersMapping['observaciones'] !== undefined ? row[headersMapping['observaciones']] : '';

    // A. Validate Title
    const title = rawTitle ? rawTitle.trim() : '';
    if (!title) {
      errors.push('El t\u00edtulo es obligatorio.');
    } else if (title.length > 180) {
      errors.push('El t\u00edtulo supera el l\u00edmite de 180 caracteres.');
    }

    // B. Validate Date
    const dateStr = rawDate ? rawDate.trim() : '';
    const dateValidation = validateHistoricalDate(dateStr);
    if (!dateValidation.isValid) {
      errors.push(dateValidation.error || 'Fecha inv\u00e1lida.');
    }

    // C. Validate Territorial Scope & Hierarchy
    const scope = rawScope ? rawScope.trim().toLowerCase() : '';
    let resolvedRegionId: string | null = null;
    let resolvedProvinceId: string | null = null;
    let resolvedMunicipalityId: string | null = null;

    if (!scope) {
      errors.push('El alcance territorial es obligatorio.');
    } else if (!['nacional', 'regional', 'provincial', 'municipal'].includes(scope)) {
      errors.push('El alcance territorial debe ser: nacional, regional, provincial o municipal.');
    } else {
      const territoryRes = await validateTerritory({
        alcance: scope as any,
        regionCodeOrNameOrId: rawRegion,
        provinciaNameOrSlugOrId: rawProvince,
        municipioNameOrSlugOrId: rawMunicipio
      });

      if (!territoryRes.isValid) {
        errors.push(...territoryRes.errors);
      } else if (territoryRes.resolved) {
        resolvedRegionId = territoryRes.resolved.regionId;
        resolvedProvinceId = territoryRes.resolved.provinceId;
        resolvedMunicipalityId = territoryRes.resolved.municipalityId;
      }
    }

    // D. Validate Category
    let resolvedCategoryId: string | null = null;
    const cleanCategory = rawCategory ? rawCategory.trim() : '';
    
    if (cleanCategory) {
      const normCat = cleanCategory.toLowerCase();
      const matchedCat = categoriesCatalog.find(
        c => c.id === cleanCategory || c.slug.toLowerCase() === normCat || c.code.toLowerCase() === normCat || c.name.toLowerCase() === normCat
      );

      if (!matchedCat) {
        errors.push(`La categor\u00eda especificada no existe en el cat\u00e1logo: "${cleanCategory}".`);
      } else {
        resolvedCategoryId = matchedCat.id;
      }
    }

    // E. Validate Source
    const sourceRef = rawSource ? rawSource.trim() : '';
    if (!sourceRef) {
      warnings.push('Se recomienda ingresar una fuente o referencia documental.');
    }

    // F. Validate Featured Status
    let isFeatured = false;
    const cleanFeatured = rawFeatured ? rawFeatured.trim().toLowerCase() : '';
    if (cleanFeatured) {
      const trueValues = ['si', 's\u00ed', 'true', '1'];
      const falseValues = ['no', 'false', '0'];
      
      if (trueValues.includes(cleanFeatured)) {
        isFeatured = true;
      } else if (!falseValues.includes(cleanFeatured)) {
        warnings.push('Valor de destacado no reconocido. Se aplicar\u00e1 "no" por defecto.');
      }
    }

    // G. Inside-File Duplicates Check
    let isDuplicateRow = false;
    if (errors.length === 0 && title && dateStr) {
      const uniqueFileKey = `${normalizeTitle(title)}|${dateStr}|${resolvedRegionId || ''}|${resolvedProvinceId || ''}|${resolvedMunicipalityId || ''}`;
      if (fileDuplicateKeys.has(uniqueFileKey)) {
        isDuplicateRow = true;
        warnings.push('Esta efem\u00e9ride est\u00e1 duplicada dentro del mismo archivo.');
      } else {
        fileDuplicateKeys.add(uniqueFileKey);
      }
    }

    // H. DB Slug Conflict Check
    let isDbSlugClash = false;
    if (errors.length === 0 && title) {
      const slugCandidate = generateSlug(title);
      if (dbExistingSlugs.has(slugCandidate)) {
        isDbSlugClash = true;
        warnings.push('Ya existe un contenido con el mismo slug en la base de datos (duplicado probable).');
      }
    }

    // Determine Final Row Status
    let status: RowValidationResult['status'] = 'valida';
    if (errors.length > 0) {
      status = 'error';
    } else if (isDuplicateRow || isDbSlugClash) {
      status = 'duplicado_probable';
    } else if (warnings.length > 0) {
      status = 'valida_con_observaciones';
    }

    const resolvedData: RowValidationResult['normalizedData'] = errors.length === 0 ? {
      title,
      event_date: dateStr,
      summary: rawSummary ? rawSummary.trim() : null,
      body: rawBody ? rawBody.trim() : null,
      category_id: resolvedCategoryId,
      region_id: resolvedRegionId,
      province_id: resolvedProvinceId,
      municipality_id: resolvedMunicipalityId,
      source_reference: sourceRef || null,
      is_featured: isFeatured,
      observaciones: rawObs ? rawObs.trim() : null
    } : undefined;

    const rawData = {
      title: rawTitle ? String(rawTitle) : '',
      date: rawDate ? String(rawDate) : '',
      scope: rawScope ? String(rawScope) : '',
      category: rawCategory ? String(rawCategory) : '',
      region: rawRegion ? String(rawRegion) : '',
      province: rawProvince ? String(rawProvince) : '',
      municipality: rawMunicipio ? String(rawMunicipio) : '',
      source: rawSource ? String(rawSource) : '',
      featured: rawFeatured ? String(rawFeatured) : '',
      observaciones: rawObs ? String(rawObs) : ''
    };

    results.push({
      rowNumber,
      status,
      errors,
      warnings,
      proposedSlug,
      normalizedData: resolvedData,
      rawData
    });
  }

  return results;
}
