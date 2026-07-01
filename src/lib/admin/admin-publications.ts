import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../supabase/env';

export interface AdminPublication {
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
  status: 'draft' | 'review' | 'published' | 'archived' | 'rejected';
  visibility: 'public' | 'subscribers' | 'institutional' | 'private';
  is_featured: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  institutions?: { name: string } | null;
}

/**
 * Fetches all cultural publications from public.cultural_publications for administrative display.
 * Respects RLS by passing the user's access token header.
 */
export async function getAdminPublicationsList(): Promise<AdminPublication[]> {
  try {
    const { supabaseUrl, supabaseAnonKey } = getEnv();
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      auth: {
        persistSession: false,
      },
    });

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
        updated_at,
        institutions:publisher_institution_id(name)
      `)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin publications list:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      ...item,
      institutions: Array.isArray(item.institutions) ? item.institutions[0] || null : item.institutions || null,
    })) as AdminPublication[];
  } catch (err) {
    console.error('Unexpected error in getAdminPublicationsList:', err);
    throw err;
  }
}

/**
 * Fetches a single cultural publication by ID.
 */
export async function getAdminPublicationById(id: string): Promise<AdminPublication | null> {
  try {
    const { supabaseUrl, supabaseAnonKey } = getEnv();
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      auth: {
        persistSession: false,
      },
    });

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
        sort_order
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching admin publication by id:', error);
      throw error;
    }

    return data as AdminPublication | null;
  } catch (err) {
    console.error('Unexpected error in getAdminPublicationById:', err);
    throw err;
  }
}

/**
 * Updates a single cultural publication by ID.
 */
export async function updateAdminPublication(
  id: string,
  updatedData: Partial<Omit<AdminPublication, 'id' | 'slug'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabaseUrl, supabaseAnonKey } = getEnv();
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      auth: {
        persistSession: false,
      },
    });

    const { error } = await supabase
      .from('cultural_publications')
      .update({
        ...updatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating admin publication:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in updateAdminPublication:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}

/**
 * Creates a new cultural publication.
 */
export async function createAdminPublication(
  publicationData: Omit<AdminPublication, 'id'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabaseUrl, supabaseAnonKey } = getEnv();
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      auth: {
        persistSession: false,
      },
    });

    // Resolve profile id for created_by_profile_id
    const { data: { user } } = await supabase.auth.getUser();
    let profileId: string | null = null;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      if (profile) {
        profileId = profile.id;
      }
    }

    const { error } = await supabase
      .from('cultural_publications')
      .insert([{
        ...publicationData,
        created_by_profile_id: profileId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error inserting admin publication:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in createAdminPublication:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}
