import { createServerSupabaseClient } from '../supabase/server';
import { getRelevanceScore, SelectedTerritory } from './relevance';
import { getArgentinaDateParts } from '../utils/date';
import { PublicContent } from './public-content';

export interface AgendaFilters {
  provincia?: string | null; // UUID or Slug
  categoria?: string | null; // UUID or Slug
  periodo?: 'proximos' | 'archivo' | 'todos' | null;
}

export interface AgendaData {
  featuredUpcoming: PublicContent | null;
  secondaryUpcoming: PublicContent[];
  archiveEvents: PublicContent[];
  availableProvinces: Array<{ id: string; name: string; slug: string; code: string }>;
  availableCategories: Array<{ id: string; name: string; slug: string }>;
}

function serializeSupabaseError(error: any) {
  if (!error) return null;
  return {
    message: error.message || 'Unknown error',
    code: error.code || 'UNKNOWN',
    details: error.details || null,
    hint: error.hint || null
  };
}

/**
 * Fetches, filters, sorts and categorizes all public events in the America/Argentina/Buenos_Aires timezone.
 * Applies territorial relevance scoring and limits the output according to Phase 8.B1 specifications.
 */
export async function getPublicCulturalAgenda(
  territory?: SelectedTerritory,
  filters?: AgendaFilters
): Promise<AgendaData> {
  const result: AgendaData = {
    featuredUpcoming: null,
    secondaryUpcoming: [],
    archiveEvents: [],
    availableProvinces: [],
    availableCategories: []
  };

  try {
    const supabase = createServerSupabaseClient();

    // 1. Get Argentina Today Date String (YYYY-MM-DD)
    const { day, month, year } = getArgentinaDateParts();
    const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // 2. Query all published, public events that have an event_date
    const { data: rawEvents, error } = await supabase
      .from('contents')
      .select('id, title, slug, subtitle, summary, event_date, publish_date, is_featured, created_at, region_id, province_id, municipality_id, institutions(name, slug), categories(id, name, slug), content_types!inner(code, name)')
      .eq('status', 'published')
      .eq('visibility', 'public')
      .eq('content_types.code', 'event')
      .not('event_date', 'is', null);

    if (error) {
      console.warn('Error fetching cultural agenda events:', serializeSupabaseError(error));
      return result;
    }

    const now = new Date();
    // Filter out future publication dates in-memory to ensure safety
    const events = (rawEvents || []).filter((e: any) => {
      if (e.publish_date && new Date(e.publish_date) > now) {
        return false;
      }
      return true;
    });

    // 3. Resolve all provinces and categories from catalog tables to map filters
    const { data: provincesData } = await supabase
      .from('provinces')
      .select('id, name, slug, code');

    const provinces = provincesData || [];

    // Extract categories and provinces that have at least one real event associated
    const categoriesMap = new Map<string, { id: string; name: string; slug: string }>();
    const provinceIdsWithEvents = new Set<string>();

    events.forEach((e: any) => {
      if (e.categories) {
        categoriesMap.set(e.categories.id, {
          id: e.categories.id,
          name: e.categories.name,
          slug: e.categories.slug
        });
      }
      if (e.province_id) {
        provinceIdsWithEvents.add(e.province_id);
      }
    });

    result.availableCategories = Array.from(categoriesMap.values());
    result.availableProvinces = provinces.filter(p => provinceIdsWithEvents.has(p.id));

    // 4. Apply filters (Provincia, Categoría) in-memory
    let filtered = events.map((item: any) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      subtitle: item.subtitle,
      summary: item.summary,
      event_date: item.event_date,
      publish_date: item.publish_date,
      is_featured: item.is_featured,
      created_at: item.created_at,
      region_id: item.region_id,
      province_id: item.province_id,
      municipality_id: item.municipality_id,
      institutions: Array.isArray(item.institutions) ? item.institutions[0] || null : item.institutions || null,
      categories: Array.isArray(item.categories) ? item.categories[0] || null : item.categories || null,
      content_types: Array.isArray(item.content_types) ? item.content_types[0] || null : item.content_types || null
    })) as PublicContent[];

    if (filters?.provincia) {
      const selectedProvince = provinces.find(
        p => p.slug === filters.provincia || p.id === filters.provincia
      );
      if (selectedProvince) {
        filtered = filtered.filter(e => e.province_id === selectedProvince.id);
      }
    }

    if (filters?.categoria) {
      filtered = filtered.filter(
        e => e.categories && (e.categories.slug === filters.categoria || e.categories.id === filters.categoria)
      );
    }

    // 5. Separate Upcoming vs Archive
    const upcomingList = filtered.filter(e => e.event_date && e.event_date >= todayStr);
    const archiveList = filtered.filter(e => e.event_date && e.event_date < todayStr);

    // 6. Sort Upcoming: Territorial Relevance first, then chronological event_date ASC (closest first), then is_featured DESC
    upcomingList.sort((a, b) => {
      if (territory) {
        const scoreA = getRelevanceScore(a, territory);
        const scoreB = getRelevanceScore(b, territory);
        if (scoreA !== scoreB) return scoreB - scoreA;
      }
      const timeA = a.event_date ? new Date(a.event_date).getTime() : 0;
      const timeB = b.event_date ? new Date(b.event_date).getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;
      if (a.is_featured !== b.is_featured) return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      return 0;
    });

    // 7. Sort Archive: Territorial Relevance first, then chronological event_date DESC (newest first), then is_featured DESC
    archiveList.sort((a, b) => {
      if (territory) {
        const scoreA = getRelevanceScore(a, territory);
        const scoreB = getRelevanceScore(b, territory);
        if (scoreA !== scoreB) return scoreB - scoreA;
      }
      const timeA = a.event_date ? new Date(a.event_date).getTime() : 0;
      const timeB = b.event_date ? new Date(b.event_date).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      if (a.is_featured !== b.is_featured) return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      return 0;
    });

    // 8. Apply Limits according to specification
    const period = filters?.periodo || 'todos';

    if (period === 'todos' || period === 'proximos') {
      result.featuredUpcoming = upcomingList[0] || null;
      result.secondaryUpcoming = result.featuredUpcoming ? upcomingList.slice(1, 9) : [];
    }

    if (period === 'todos' || period === 'archivo') {
      result.archiveEvents = archiveList.slice(0, 12);
    }

  } catch (err: any) {
    console.warn('Unexpected error in getPublicCulturalAgenda:', {
      message: err.message || String(err),
      stack: err.stack
    });
  }

  return result;
}
