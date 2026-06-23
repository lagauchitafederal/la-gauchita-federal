export interface SelectedTerritory {
  regionId: string | null;
  provinceId: string | null;
  municipalityId: string | null;
}

/**
 * Calculates a relevance score for an item based on the selected territory.
 * Scoring scale:
 * - Selected Municipality match = 4
 * - Selected Province match = 3
 * - Selected Region match = 2
 * - National scope (no region, province, or municipality) = 1 (or 2 when Argentina is selected)
 * - Other locations = 0 (or 1 when Argentina is selected, permitting other regions as federal highlights)
 */
export function getRelevanceScore(
  item: { region_id?: string | null; province_id?: string | null; municipality_id?: string | null },
  territory: SelectedTerritory
): number {
  const { regionId, provinceId, municipalityId } = territory;

  // 1. Municipality chosen
  if (municipalityId) {
    if (item.municipality_id === municipalityId) return 4;
    if (item.province_id === provinceId) return 3;
    if (item.region_id === regionId) return 2;
    if (!item.region_id && !item.province_id && !item.municipality_id) return 1;
    return 0;
  }

  // 2. Province chosen
  if (provinceId) {
    if (item.province_id === provinceId) return 3;
    if (item.region_id === regionId) return 2;
    if (!item.region_id && !item.province_id && !item.municipality_id) return 1;
    return 0;
  }

  // 3. Region chosen
  if (regionId) {
    if (item.region_id === regionId) return 2;
    if (!item.region_id && !item.province_id && !item.municipality_id) return 1;
    return 0;
  }

  // 4. Argentina (National) chosen
  if (!item.region_id && !item.province_id && !item.municipality_id) return 2;
  return 1; // Permits federal highlights from other locations
}

/**
 * Sorts contents by relevance score, then by featured status, and finally by publish date.
 */
export function sortPublicContentByRelevance(
  contents: any[],
  territory: SelectedTerritory
): any[] {
  return [...contents].sort((a, b) => {
    const scoreA = getRelevanceScore(a, territory);
    const scoreB = getRelevanceScore(b, territory);

    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    if (a.is_featured !== b.is_featured) {
      return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
    }

    const dateA = a.publish_date ? new Date(a.publish_date).getTime() : 0;
    const dateB = b.publish_date ? new Date(b.publish_date).getTime() : 0;
    return dateB - dateA;
  });
}

/**
 * Sorts institutions by relevance score, then by featured status, sort order, and name.
 */
export function sortPublicInstitutionsByRelevance(
  institutions: any[],
  territory: SelectedTerritory
): any[] {
  return [...institutions].sort((a, b) => {
    const scoreA = getRelevanceScore(a, territory);
    const scoreB = getRelevanceScore(b, territory);

    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    if (a.is_featured !== b.is_featured) {
      return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
    }

    const orderA = a.sort_order || 0;
    const orderB = b.sort_order || 0;
    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return a.name.localeCompare(b.name);
  });
}
