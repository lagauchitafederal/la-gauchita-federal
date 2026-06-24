import { createServerSupabaseClient } from '../supabase/server';

export interface PublicMagazine {
  id: string;
  edition_number: number;
  volume: string | null;
  publication_year: number;
  publication_date: string | null;
  title: string;
  slug: string;
  description: string | null;
  table_of_contents: Array<{ title: string; page?: string; related_slug?: string }>;
  is_featured: boolean;
  sort_order: number;
  institutions: { name: string; slug: string } | null;
  media_assets: { bucket_name: string; storage_path: string; title: string; alt_text: string | null } | null;
  pdf_media_assets: { bucket_name: string; storage_path: string; title: string } | null;
}

/**
 * Fetches all published and public magazine editions.
 * Optionally filters by year and orders by publication_date desc, then edition_number desc.
 */
export async function getPublishedMagazines(filterYear?: number): Promise<PublicMagazine[]> {
  try {
    const supabase = createServerSupabaseClient();
    let query = supabase
      .from('magazine_editions')
      .select(`
        id,
        edition_number,
        volume,
        publication_year,
        publication_date,
        title,
        slug,
        description,
        table_of_contents,
        is_featured,
        sort_order,
        institutions:publisher_institution_id(name, slug),
        media_assets:cover_image_asset_id(bucket_name, storage_path, title, alt_text),
        pdf_media_assets:pdf_asset_id(bucket_name, storage_path, title)
      `)
      .eq('status', 'published')
      .eq('visibility', 'public');

    if (filterYear) {
      query = query.eq('publication_year', filterYear);
    }

    // Sort by publication_date desc, and edition_number desc
    const { data, error } = await query
      .order('publication_date', { ascending: false, nullsFirst: false })
      .order('edition_number', { ascending: false });

    if (error) {
      console.error('Error fetching published magazines:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      edition_number: item.edition_number,
      volume: item.volume,
      publication_year: item.publication_year,
      publication_date: item.publication_date,
      title: item.title,
      slug: item.slug,
      description: item.description,
      table_of_contents: Array.isArray(item.table_of_contents) ? item.table_of_contents : [],
      is_featured: item.is_featured,
      sort_order: item.sort_order,
      institutions: Array.isArray(item.institutions) ? item.institutions[0] || null : item.institutions || null,
      media_assets: Array.isArray(item.media_assets) ? item.media_assets[0] || null : item.media_assets || null,
      pdf_media_assets: Array.isArray(item.pdf_media_assets) ? item.pdf_media_assets[0] || null : item.pdf_media_assets || null,
    })) as PublicMagazine[];
  } catch (err) {
    console.error('Unexpected error fetching published magazines:', err);
    return [];
  }
}

/**
 * Fetches a single published and public magazine edition by slug.
 */
export async function getPublishedMagazineBySlug(slug: string): Promise<PublicMagazine | null> {
  try {
    if (!slug) return null;
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('magazine_editions')
      .select(`
        id,
        edition_number,
        volume,
        publication_year,
        publication_date,
        title,
        slug,
        description,
        table_of_contents,
        is_featured,
        sort_order,
        institutions:publisher_institution_id(name, slug),
        media_assets:cover_image_asset_id(bucket_name, storage_path, title, alt_text),
        pdf_media_assets:pdf_asset_id(bucket_name, storage_path, title)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .maybeSingle();

    if (error) {
      console.error('Error fetching published magazine by slug:', error);
      return null;
    }

    if (!data) return null;
    const item = data as any;
    return {
      id: item.id,
      edition_number: item.edition_number,
      volume: item.volume,
      publication_year: item.publication_year,
      publication_date: item.publication_date,
      title: item.title,
      slug: item.slug,
      description: item.description,
      table_of_contents: Array.isArray(item.table_of_contents) ? item.table_of_contents : [],
      is_featured: item.is_featured,
      sort_order: item.sort_order,
      institutions: Array.isArray(item.institutions) ? item.institutions[0] || null : item.institutions || null,
      media_assets: Array.isArray(item.media_assets) ? item.media_assets[0] || null : item.media_assets || null,
      pdf_media_assets: Array.isArray(item.pdf_media_assets) ? item.pdf_media_assets[0] || null : item.pdf_media_assets || null,
    } as PublicMagazine;
  } catch (err) {
    console.error('Unexpected error fetching published magazine by slug:', err);
    return null;
  }
}
