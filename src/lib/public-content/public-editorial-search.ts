import { createServerSupabaseClient } from '../supabase/server';
import { getPublicMediaUrl } from '../utils/media-url';

export interface SearchFilters {
  q: string;
  tipo: 'todos' | 'contenidos' | 'personajes' | 'instituciones' | 'reconocimientos' | 'revista' | 'archivo';
  provincia?: string;
  categoria?: string;
  page?: number;
}

export interface UnifiedSearchResult {
  type: 'content' | 'person' | 'institution' | 'recognition' | 'magazine_edition' | 'media_asset';
  title: string;
  subtitle: string | null;
  slug: string | null;
  imageUrl: string | null;
  territoryLabel: string | null;
  province_id: string | null;
  municipality_id: string | null;
  event_date: string | null;
  is_featured: boolean;
  score?: number;
  originalData: any;
  publicUrl: string;
}

export interface SearchResponse {
  results: UnifiedSearchResult[];
  totalCount: number;
}

// Sanitizer for search queries
export function sanitizeQuery(q: string | undefined): string {
  if (!q) return '';
  let clean = q.replace(/\s+/g, ' ').trim();
  if (clean.length > 100) {
    clean = clean.substring(0, 100);
  }
  return clean;
}

// Calculate editorial and territorial ranking score
function calculateScore(
  item: { title: string; province_id: string | null; municipality_id: string | null; is_featured: boolean; event_date: string | null },
  query: string,
  userTerritory?: { provinceId?: string; municipalityId?: string }
): number {
  let score = 0;
  const lowerQuery = query.toLowerCase().trim();
  const lowerTitle = item.title.toLowerCase();

  // 1. Text matching priority
  if (lowerTitle === lowerQuery) {
    score += 1000;
  } else if (lowerTitle.startsWith(lowerQuery)) {
    score += 500;
  } else if (lowerTitle.includes(lowerQuery)) {
    score += 100;
  }

  // 2. Territorial matching priority
  if (userTerritory) {
    if (item.municipality_id && item.municipality_id === userTerritory.municipalityId) {
      score += 200;
    } else if (item.province_id && item.province_id === userTerritory.provinceId) {
      score += 100;
    }
  }

  // 3. Featured editorial priority
  if (item.is_featured) {
    score += 50;
  }

  // 4. Date relevance (recency) minor sorting weight
  if (item.event_date) {
    try {
      const year = new Date(item.event_date).getFullYear();
      if (!isNaN(year)) {
        score += Math.min(10, year / 200);
      }
    } catch {
      // ignore
    }
  }

  return score;
}

// Search Contents
async function searchContents(
  supabase: any,
  q: string,
  provinceId?: string,
  categoryId?: string,
  limit = 12,
  offset = 0
): Promise<UnifiedSearchResult[]> {
  let query = supabase
    .from('contents')
    .select('id, title, slug, subtitle, summary, event_date, publish_date, is_featured, created_at, region_id, province_id, municipality_id, institutions(name, slug), categories(name), content_types(code, name, slug)')
    .eq('status', 'published')
    .eq('visibility', 'public')
    .lte('publish_date', new Date().toISOString());

  if (provinceId && provinceId !== 'todas') {
    query = query.eq('province_id', provinceId);
  }
  if (categoryId && categoryId !== 'todas') {
    query = query.eq('category_id', categoryId);
  }

  query = query.or(`title.ilike.%${q}%,subtitle.ilike.%${q}%,summary.ilike.%${q}%`);

  const { data, error } = await query.range(offset, offset + limit - 1);
  if (error) {
    console.error('Error searching contents:', error);
    return [];
  }

  return (data || []).map((c: any) => {
    const provinceName = c.province_id ? 'Provincial' : 'Nacional';
    return {
      type: 'content',
      title: c.title,
      subtitle: c.subtitle || c.summary || null,
      slug: c.slug,
      imageUrl: null,
      territoryLabel: provinceName,
      province_id: c.province_id,
      municipality_id: c.municipality_id,
      event_date: c.event_date,
      is_featured: c.is_featured,
      publicUrl: `/contenidos/${c.slug}`,
      originalData: {
        id: c.id,
        title: c.title,
        slug: c.slug,
        subtitle: c.subtitle,
        summary: c.summary,
        publish_date: c.publish_date,
        is_featured: c.is_featured,
        region_id: c.region_id,
        province_id: c.province_id,
        municipality_id: c.municipality_id,
        institutions: Array.isArray(c.institutions) ? c.institutions[0] || null : c.institutions || null,
        categories: Array.isArray(c.categories) ? c.categories[0] || null : c.categories || null,
        content_types: Array.isArray(c.content_types) ? c.content_types[0] || null : c.content_types || null
      }
    };
  });
}

// Search People
async function searchPeople(
  supabase: any,
  q: string,
  provinceId?: string,
  limit = 12,
  offset = 0
): Promise<UnifiedSearchResult[]> {
  let query = supabase
    .from('people')
    .select('id, full_name, slug, short_bio, biography, person_type, birth_date, death_date, province_id, municipality_id, is_featured, media_assets:main_image_asset_id(bucket_name, storage_path, alt_text)')
    .eq('status', 'published')
    .eq('visibility', 'public');

  if (provinceId && provinceId !== 'todas') {
    query = query.eq('province_id', provinceId);
  }

  query = query.or(`full_name.ilike.%${q}%,short_bio.ilike.%${q}%,person_type.ilike.%${q}%`);

  const { data, error } = await query.range(offset, offset + limit - 1);
  if (error) {
    console.error('Error searching people:', error);
    return [];
  }

  return (data || []).map((p: any) => {
    const media = Array.isArray(p.media_assets) ? p.media_assets[0] || null : p.media_assets || null;
    return {
      type: 'person',
      title: p.full_name,
      subtitle: p.short_bio || null,
      slug: p.slug,
      imageUrl: media ? getPublicMediaUrl(media.bucket_name, media.storage_path) : null,
      territoryLabel: p.province_id ? 'Provincial' : 'Nacional',
      province_id: p.province_id,
      municipality_id: p.municipality_id,
      event_date: p.birth_date,
      is_featured: p.is_featured,
      publicUrl: `/personajes/${p.slug}`,
      originalData: {
        id: p.id,
        full_name: p.full_name,
        slug: p.slug,
        person_type: p.person_type,
        short_bio: p.short_bio,
        birth_date: p.birth_date,
        death_date: p.death_date,
        media_assets: media
      }
    };
  });
}

// Search Institutions
async function searchInstitutions(
  supabase: any,
  q: string,
  provinceId?: string,
  limit = 12,
  offset = 0
): Promise<UnifiedSearchResult[]> {
  let query = supabase
    .from('institutions')
    .select('id, name, slug, institution_type, description, is_featured, address, province_id, municipality_id')
    .eq('status', 'active');

  if (provinceId && provinceId !== 'todas') {
    query = query.eq('province_id', provinceId);
  }

  query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,institution_type.ilike.%${q}%`);

  const { data, error } = await query.range(offset, offset + limit - 1);
  if (error) {
    console.error('Error searching institutions:', error);
    return [];
  }

  return (data || []).map((inst: any) => ({
    type: 'institution',
    title: inst.name,
    subtitle: inst.description || null,
    slug: inst.slug,
    imageUrl: null,
    territoryLabel: inst.address || 'Nacional',
    province_id: inst.province_id,
    municipality_id: inst.municipality_id,
    event_date: null,
    is_featured: inst.is_featured,
    publicUrl: `/instituciones/${inst.slug}`,
    originalData: {
      id: inst.id,
      name: inst.name,
      slug: inst.slug,
      institution_type: inst.institution_type,
      description: inst.description,
      is_featured: inst.is_featured,
      address: inst.address
    }
  }));
}

// Search Recognitions
async function searchRecognitions(
  supabase: any,
  q: string,
  limit = 12,
  offset = 0
): Promise<UnifiedSearchResult[]> {
  let query = supabase
    .from('recognitions')
    .select('id, title, slug, recognition_type, description, granting_institution_name, recognition_date, is_featured')
    .eq('status', 'active')
    .eq('visibility', 'public');

  query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,granting_institution_name.ilike.%${q}%,recognition_type.ilike.%${q}%`);

  const { data, error } = await query.range(offset, offset + limit - 1);
  if (error) {
    console.error('Error searching recognitions:', error);
    return [];
  }

  return (data || []).map((r: any) => ({
    type: 'recognition',
    title: r.title,
    subtitle: r.description || null,
    slug: r.slug,
    imageUrl: null,
    territoryLabel: r.granting_institution_name || 'Nacional',
    province_id: null,
    municipality_id: null,
    event_date: r.recognition_date,
    is_featured: r.is_featured,
    publicUrl: `/reconocimientos/${r.slug}`,
    originalData: {
      id: r.id,
      title: r.title,
      slug: r.slug,
      recognition_type: r.recognition_type,
      description: r.description,
      is_featured: r.is_featured,
      granting_institution_name: r.granting_institution_name,
      recognition_date: r.recognition_date
    }
  }));
}

// Search Magazine Editions
async function searchMagazineEditions(
  supabase: any,
  q: string,
  limit = 12,
  offset = 0
): Promise<UnifiedSearchResult[]> {
  let query = supabase
    .from('magazine_editions')
    .select('id, title, slug, edition_number, volume, publication_year, publication_date, is_featured, media_assets:cover_image_asset_id(bucket_name, storage_path, alt_text)')
    .eq('status', 'published')
    .eq('visibility', 'public');

  let orFilter = `title.ilike.%${q}%,volume.ilike.%${q}%`;
  const num = parseInt(q, 10);
  if (!isNaN(num)) {
    orFilter += `,publication_year.eq.${num},edition_number.eq.${num}`;
  }
  query = query.or(orFilter);

  const { data, error } = await query.range(offset, offset + limit - 1);
  if (error) {
    console.error('Error searching magazine editions:', error);
    return [];
  }

  return (data || []).map((e: any) => {
    const media = Array.isArray(e.media_assets) ? e.media_assets[0] || null : e.media_assets || null;
    return {
      type: 'magazine_edition',
      title: e.title,
      subtitle: `Edición Nº ${e.edition_number}${e.volume ? ` - Tomo ${e.volume}` : ''}`,
      slug: e.slug,
      imageUrl: media ? getPublicMediaUrl(media.bucket_name, media.storage_path) : null,
      territoryLabel: `Año ${e.publication_year}`,
      province_id: null,
      municipality_id: null,
      event_date: e.publication_date,
      is_featured: e.is_featured,
      publicUrl: `/revista/${e.slug}`,
      originalData: {
        id: e.id,
        title: e.title,
        slug: e.slug,
        edition_number: e.edition_number,
        volume: e.volume,
        publication_year: e.publication_year,
        publication_date: e.publication_date,
        media_assets: media
      }
    };
  });
}

// Search Archive (Media Assets)
async function searchArchiveAssets(
  supabase: any,
  q: string,
  limit = 12,
  offset = 0
): Promise<UnifiedSearchResult[]> {
  let query = supabase
    .from('media_assets')
    .select('id, title, description, asset_type, bucket_name, storage_path, mime_type, rights_status, credit, source_reference')
    .eq('status', 'active')
    .eq('visibility', 'public')
    .in('rights_status', ['owned', 'authorized', 'public_domain', 'licensed']);

  query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,asset_type.ilike.%${q}%,alt_text.ilike.%${q}%`);

  const { data, error } = await query.range(offset, offset + limit - 1);
  if (error) {
    console.error('Error searching archive assets:', error);
    return [];
  }

  return (data || []).map((asset: any) => ({
    type: 'media_asset',
    title: asset.title,
    subtitle: asset.description || null,
    slug: null,
    imageUrl: getPublicMediaUrl(asset.bucket_name, asset.storage_path),
    territoryLabel: asset.credit ? `Crédito: ${asset.credit}` : 'Archivo',
    province_id: null,
    municipality_id: null,
    event_date: null,
    is_featured: false,
    publicUrl: '/archivo', // Redirects to general archive view
    originalData: {
      bucket_name: asset.bucket_name,
      storage_path: asset.storage_path,
      alt_text: asset.alt_text,
      title: asset.title,
      description: asset.description,
      asset_type: asset.asset_type,
      mime_type: asset.mime_type,
      rights_status: asset.rights_status,
      credit: asset.credit,
      source_reference: asset.source_reference
    }
  }));
}

// Unified Search Entrypoint
export async function getEditorialSearchResults(
  filters: SearchFilters,
  userTerritory?: { provinceId?: string; municipalityId?: string }
): Promise<SearchResponse> {
  const q = sanitizeQuery(filters.q);
  if (q.length < 3) {
    return { results: [], totalCount: 0 };
  }

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = 12;
  const offset = (page - 1) * limit;

  const supabase = createServerSupabaseClient();
  const activeType = filters.tipo;

  try {
    let combinedResults: UnifiedSearchResult[] = [];

    // If 'todos', we run concurrent queries, fetch a reasonable batch from each, merge and sort them.
    if (activeType === 'todos') {
      const [contents, people, institutions, recognitions, magazines, archive] = await Promise.all([
        searchContents(supabase, q, filters.provincia, filters.categoria, 12, 0),
        searchPeople(supabase, q, filters.provincia, 12, 0),
        searchInstitutions(supabase, q, filters.provincia, 12, 0),
        searchRecognitions(supabase, q, 12, 0),
        searchMagazineEditions(supabase, q, 12, 0),
        searchArchiveAssets(supabase, q, 12, 0)
      ]);

      combinedResults = [
        ...contents,
        ...people,
        ...institutions,
        ...recognitions,
        ...magazines,
        ...archive
      ];

      // Deduplicate results having identical public URL and type
      const seen = new Set<string>();
      combinedResults = combinedResults.filter(item => {
        const key = `${item.type}_${item.publicUrl}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Apply ranking score calculations
      combinedResults = combinedResults.map(item => {
        const score = calculateScore(
          {
            title: item.title,
            province_id: item.province_id,
            municipality_id: item.municipality_id,
            is_featured: item.is_featured,
            event_date: item.event_date
          },
          q,
          userTerritory
        );
        return { ...item, score };
      });

      // Sort by score descending (primary) then by date/title
      combinedResults.sort((a, b) => {
        const scoreDiff = (b.score || 0) - (a.score || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return a.title.localeCompare(b.title);
      });

      // Paginate the combined array in memory
      const totalCount = combinedResults.length;
      const paginated = combinedResults.slice(offset, offset + limit);

      return {
        results: paginated,
        totalCount
      };
    } else {
      // If we are searching a single specific entity type, query with offset/limit on the database
      let results: UnifiedSearchResult[] = [];

      switch (activeType) {
        case 'contenidos':
          results = await searchContents(supabase, q, filters.provincia, filters.categoria, limit, offset);
          break;
        case 'personajes':
          results = await searchPeople(supabase, q, filters.provincia, limit, offset);
          break;
        case 'instituciones':
          results = await searchInstitutions(supabase, q, filters.provincia, limit, offset);
          break;
        case 'reconocimientos':
          results = await searchRecognitions(supabase, q, limit, offset);
          break;
        case 'revista':
          results = await searchMagazineEditions(supabase, q, limit, offset);
          break;
        case 'archivo':
          results = await searchArchiveAssets(supabase, q, limit, offset);
          break;
      }

      // Ranking on single list
      results = results.map(item => {
        const score = calculateScore(
          {
            title: item.title,
            province_id: item.province_id,
            municipality_id: item.municipality_id,
            is_featured: item.is_featured,
            event_date: item.event_date
          },
          q,
          userTerritory
        );
        return { ...item, score };
      });

      results.sort((a, b) => (b.score || 0) - (a.score || 0));

      // In PostgREST we don't have a cheap count(*) without another query, so we approximate or use length.
      // Since it's paginated on DB level, if we got exactly the limit size, we assume there might be a next page.
      // For accurate editorial search count on high limits, we check the length of this page.
      return {
        results,
        totalCount: results.length < limit ? offset + results.length : offset + limit + 1
      };
    }
  } catch (err) {
    console.error('Unexpected error during public editorial search:', err);
    return { results: [], totalCount: 0 };
  }
}
