import { getRegions, getProvinces, getMunicipalities, Region, Province, Municipality } from '../catalogs/catalogs';

export interface TerritoryValidationInput {
  alcance: 'nacional' | 'regional' | 'provincial' | 'municipal';
  regionCodeOrNameOrId?: string | null;
  provinciaNameOrSlugOrId?: string | null;
  municipioNameOrSlugOrId?: string | null;
}

export interface TerritoryValidationResult {
  isValid: boolean;
  errors: string[];
  resolved?: {
    regionId: string | null;
    provinceId: string | null;
    municipalityId: string | null;
    regionName: string | null;
    provinceName: string | null;
    municipalityName: string | null;
  };
}

/**
 * Normalizes strings to allow flexible spelling matches (removes accents, transforms to lowercase, trims whitespace).
 */
function normalize(val: string): string {
  return val
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Validates territorial scope and hierarchy for La Gauchita Federal.
 * 
 * SOLID Rationale:
 * - Single Responsibility: Dedicated to checking territorial hierarchy and scope consistency.
 * - Interface Segregation: Takes a clean TerritoryValidationInput interface.
 */
export async function validateTerritory(input: TerritoryValidationInput): Promise<TerritoryValidationResult> {
  const result: TerritoryValidationResult = {
    isValid: true,
    errors: [],
    resolved: {
      regionId: null,
      provinceId: null,
      municipalityId: null,
      regionName: null,
      provinceName: null,
      municipalityName: null,
    }
  };

  const [regions, provinces, municipalities] = await Promise.all([
    getRegions(),
    getProvinces(),
    getMunicipalities()
  ]);

  const rawRegion = input.regionCodeOrNameOrId ? input.regionCodeOrNameOrId.trim() : null;
  const rawProvince = input.provinciaNameOrSlugOrId ? input.provinciaNameOrSlugOrId.trim() : null;
  const rawMunicipality = input.municipioNameOrSlugOrId ? input.municipioNameOrSlugOrId.trim() : null;

  let matchedRegion: Region | null = null;
  let matchedProvince: Province | null = null;
  let matchedMunicipality: Municipality | null = null;

  // 1. Resolve Region if provided
  if (rawRegion) {
    const norm = normalize(rawRegion);
    matchedRegion = regions.find(
      r => r.id === rawRegion || normalize(r.code) === norm || normalize(r.slug) === norm || normalize(r.name) === norm
    ) || null;

    if (!matchedRegion) {
      result.errors.push(`Regi\u00f3n no encontrada: "${rawRegion}".`);
    }
  }

  // 2. Resolve Province if provided
  if (rawProvince) {
    const norm = normalize(rawProvince);
    matchedProvince = provinces.find(
      p => p.id === rawProvince || normalize(p.code) === norm || normalize(p.slug) === norm || normalize(p.name) === norm
    ) || null;

    if (!matchedProvince) {
      result.errors.push(`Provincia no encontrada: "${rawProvince}".`);
    }
  }

  // 3. Resolve Municipality if provided
  if (rawMunicipality) {
    const norm = normalize(rawMunicipality);
    matchedMunicipality = municipalities.find(
      m => m.id === rawMunicipality || normalize(m.code) === norm || normalize(m.slug) === norm || normalize(m.name) === norm
    ) || null;

    if (!matchedMunicipality) {
      result.errors.push(`Municipio o localidad no encontrada: "${rawMunicipality}".`);
    }
  }

  // Stop if catalogs failed to resolve
  if (result.errors.length > 0) {
    result.isValid = false;
    return result;
  }

  // 4. Validate Scope constraints
  switch (input.alcance) {
    case 'nacional':
      if (matchedRegion || matchedProvince || matchedMunicipality) {
        result.errors.push('Para el alcance nacional, no se debe especificar regi\u00f3n, provincia ni municipio.');
      }
      break;

    case 'regional':
      if (!matchedRegion) {
        result.errors.push('Para el alcance regional, se requiere especificar una regi\u00f3n v\u00e1lida.');
      }
      if (matchedProvince || matchedMunicipality) {
        result.errors.push('Para el alcance regional, no se debe especificar provincia ni municipio.');
      }
      break;

    case 'provincial':
      if (!matchedProvince) {
        result.errors.push('Para el alcance provincial, se requiere especificar una provincia v\u00e1lida.');
      } else {
        // Resolve parent region if not specified
        const parentRegion = regions.find(r => r.id === matchedProvince!.region_id);
        if (!parentRegion) {
          result.errors.push('Error interno: La regi\u00f3n asociada a la provincia no est\u00e1 activa.');
        } else {
          if (matchedRegion && matchedRegion.id !== parentRegion.id) {
            result.errors.push(`La provincia "${matchedProvince.name}" no pertenece a la regi\u00f3n especificada "${matchedRegion.name}".`);
          } else {
            matchedRegion = parentRegion; // Auto-resolve
          }
        }
      }
      if (matchedMunicipality) {
        result.errors.push('Para el alcance provincial, no se debe especificar municipio.');
      }
      break;

    case 'municipal':
      if (!matchedMunicipality) {
        result.errors.push('Para el alcance municipal, se requiere especificar un municipio o localidad v\u00e1lida.');
      } else {
        // Resolve parent province
        const parentProvince = provinces.find(p => p.id === matchedMunicipality!.province_id);
        if (!parentProvince) {
          result.errors.push('Error interno: La provincia asociada al municipio no est\u00e1 activa o no existe.');
        } else {
          if (matchedProvince && matchedProvince.id !== parentProvince.id) {
            result.errors.push(`El municipio "${matchedMunicipality.name}" no pertenece a la provincia indicada "${matchedProvince.name}".`);
          } else {
            matchedProvince = parentProvince; // Auto-resolve
          }

          // Resolve parent region of resolved province
          const parentRegion = regions.find(r => r.id === matchedProvince!.region_id);
          if (!parentRegion) {
            result.errors.push('Error interno: La regi\u00f3n asociada a la provincia del municipio no est\u00e1 activa.');
          } else {
            if (matchedRegion && matchedRegion.id !== parentRegion.id) {
              result.errors.push(`La regi\u00f3n especificada "${matchedRegion.name}" no es compatible con la provincia del municipio.`);
            } else {
              matchedRegion = parentRegion; // Auto-resolve
            }
          }
        }
      }
      break;

    default:
      result.errors.push(`Alcance territorial no reconocido: "${input.alcance}".`);
  }

  if (result.errors.length > 0) {
    result.isValid = false;
  } else {
    result.resolved = {
      regionId: matchedRegion ? matchedRegion.id : null,
      provinceId: matchedProvince ? matchedProvince.id : null,
      municipalityId: matchedMunicipality ? matchedMunicipality.id : null,
      regionName: matchedRegion ? matchedRegion.name : null,
      provinceName: matchedProvince ? matchedProvince.name : null,
      municipalityName: matchedMunicipality ? matchedMunicipality.name : null,
    };
  }

  return result;
}
