import { createServerSupabaseClient } from '../supabase/server';

export interface PublicPublication {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  publication_type: 'book' | 'album' | 'special_work';
  author_text: string | null;
  publication_year: number | null;
  publisher_institution_id: string | null;
  cover_image_asset_id: string | null;
  source_reference: string | null;
  status: string;
  visibility: string;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  institutions?: { name: string; slug: string } | null;
  media_assets?: { bucket_name: string; storage_path: string; title: string; alt_text: string | null } | null;
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
 * Fetch all published and public cultural publications.
 */
export async function getPublicPublications(): Promise<PublicPublication[]> {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('cultural_publications')
      .select(`
        id,
        title,
        slug,
        short_description,
        description,
        publication_type,
        author_text,
        publication_year,
        publisher_institution_id,
        cover_image_asset_id,
        source_reference,
        status,
        visibility,
        is_featured,
        sort_order,
        created_at,
        institutions:publisher_institution_id(name, slug),
        media_assets:cover_image_asset_id(bucket_name, storage_path, title, alt_text)
      `)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching public publications:', serializeSupabaseError(error));
      return [];
    }

    return (data || []).map((item: any) => ({
      ...item,
      institutions: Array.isArray(item.institutions) ? item.institutions[0] || null : item.institutions || null,
      media_assets: Array.isArray(item.media_assets) ? item.media_assets[0] || null : item.media_assets || null,
    })) as PublicPublication[];
  } catch (err: any) {
    console.warn('Unexpected error fetching public publications:', {
      message: err.message || String(err),
      stack: err.stack
    });
    return [];
  }
}

/**
 * Fetch a single published and public cultural publication by its slug.
 */
export async function getPublicPublicationBySlug(slug: string): Promise<PublicPublication | null> {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('cultural_publications')
      .select(`
        id,
        title,
        slug,
        short_description,
        description,
        publication_type,
        author_text,
        publication_year,
        publisher_institution_id,
        cover_image_asset_id,
        source_reference,
        status,
        visibility,
        is_featured,
        sort_order,
        created_at,
        institutions:publisher_institution_id(name, slug),
        media_assets:cover_image_asset_id(bucket_name, storage_path, title, alt_text)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .maybeSingle();

    if (error) {
      console.warn('Error fetching public publication by slug:', serializeSupabaseError(error));
      return null;
    }

    if (!data) return null;

    return {
      ...data,
      institutions: Array.isArray(data.institutions) ? data.institutions[0] || null : data.institutions || null,
      media_assets: Array.isArray(data.media_assets) ? data.media_assets[0] || null : data.media_assets || null,
    } as PublicPublication;
  } catch (err: any) {
    console.warn('Unexpected error fetching public publication by slug:', {
      message: err.message || String(err),
      stack: err.stack
    });
    return null;
  }
}
