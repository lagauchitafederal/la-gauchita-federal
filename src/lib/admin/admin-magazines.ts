import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../supabase/env';

export interface AdminMagazine {
  id: string;
  edition_number: number;
  volume: string | null;
  publication_year: number;
  publication_date: string | null;
  title: string;
  slug: string;
  description: string | null;
  table_of_contents: any[];
  publisher_institution_id: string;
  cover_image_asset_id: string | null;
  pdf_asset_id: string | null;
  status: string;
  visibility: string;
  is_featured: boolean;
  sort_order: number;
  institutions?: { name: string } | null;
}

/**
 * Fetches all magazine editions from public.magazine_editions for administrative list display.
 * Respects Row Level Security (RLS) by passing the user's sb-access-token header.
 */
export async function getAdminMagazinesList(): Promise<AdminMagazine[]> {
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
        publisher_institution_id,
        cover_image_asset_id,
        pdf_asset_id,
        status,
        visibility,
        is_featured,
        sort_order,
        institutions:publisher_institution_id(name)
      `)
      .order('edition_number', { ascending: false });

    if (error) {
      console.error('Error fetching admin magazine editions list:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      ...item,
      institutions: Array.isArray(item.institutions) ? item.institutions[0] || null : item.institutions || null,
    })) as AdminMagazine[];
  } catch (err) {
    console.error('Unexpected error in getAdminMagazinesList:', err);
    throw err;
  }
}

/**
 * Fetches a single magazine edition by ID.
 */
export async function getAdminMagazineById(id: string): Promise<AdminMagazine | null> {
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
        publisher_institution_id,
        cover_image_asset_id,
        pdf_asset_id,
        status,
        visibility,
        is_featured,
        sort_order
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching admin magazine by id:', error);
      throw error;
    }

    return data as AdminMagazine | null;
  } catch (err) {
    console.error('Unexpected error in getAdminMagazineById:', err);
    throw err;
  }
}

/**
 * Updates a single magazine edition by ID.
 */
export async function updateAdminMagazine(
  id: string,
  updatedData: Partial<Omit<AdminMagazine, 'id' | 'slug'>>
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
      .from('magazine_editions')
      .update(updatedData)
      .eq('id', id);

    if (error) {
      console.error('Error updating admin magazine edition:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in updateAdminMagazine:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}

/**
 * Creates a new magazine edition.
 */
export async function createAdminMagazine(
  magazineData: Omit<AdminMagazine, 'id'>
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
      .from('magazine_editions')
      .insert([magazineData]);

    if (error) {
      console.error('Error inserting admin magazine edition:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in createAdminMagazine:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}
