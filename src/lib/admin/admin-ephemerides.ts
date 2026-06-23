import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../supabase/env';

export interface AdminEphemeris {
  id: string;
  title: string;
  slug: string;
  status: string;
  publish_date: string | null;
  event_date: string; // Required for ephemeris
  visibility: string;
  is_featured: boolean;
  author: { display_name: string | null } | null;
  content_type: { name: string } | null;
  category: { name: string } | null;
  region: { id: string; name: string } | null;
  province: { id: string; name: string } | null;
  municipality: { id: string; name: string } | null;
  subtitle?: string | null;
  summary?: string | null;
  body?: string | null;
  source_reference?: string | null;
  updated_at: string;
}

export interface AdminEphemerisDetail {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  summary: string | null;
  body: string | null;
  event_date: string; // Required for ephemeris
  source_reference: string | null;
  status: string;
  visibility: string;
  is_featured: boolean;
  category_id: string | null;
  region_id: string | null;
  province_id: string | null;
  municipality_id: string | null;
}

export interface NewAdminEphemeris {
  title: string;
  slug: string;
  subtitle: string | null;
  summary: string | null;
  body: string | null;
  event_date: string;
  source_reference: string | null;
  status: string;
  visibility: string;
  is_featured: boolean;
  category_id: string | null;
  region_id: string | null;
  province_id: string | null;
  municipality_id: string | null;
}

/**
 * Fetches all contents with content type 'ephemeris' for admin list display.
 */
export async function getAdminEphemeridesList(): Promise<AdminEphemeris[]> {
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
      .from('contents')
      .select(`
        id,
        title,
        slug,
        status,
        publish_date,
        event_date,
        visibility,
        is_featured,
        profiles(display_name),
        content_types!inner(code, name),
        categories(name),
        regions(id, name),
        provinces(id, name),
        municipalities(id, name),
        subtitle,
        summary,
        body,
        source_reference,
        updated_at
      `)
      .eq('content_types.code', 'ephemeris')
      .order('event_date', { ascending: true })
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin ephemerides:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      status: item.status,
      publish_date: item.publish_date,
      event_date: item.event_date,
      visibility: item.visibility,
      is_featured: item.is_featured,
      author: Array.isArray(item.profiles) ? item.profiles[0] || null : item.profiles || null,
      content_type: Array.isArray(item.content_types) ? item.content_types[0] || null : item.content_types || null,
      category: Array.isArray(item.categories) ? item.categories[0] || null : item.categories || null,
      region: Array.isArray(item.regions) ? item.regions[0] || null : item.regions || null,
      province: Array.isArray(item.provinces) ? item.provinces[0] || null : item.provinces || null,
      municipality: Array.isArray(item.municipalities) ? item.municipalities[0] || null : item.municipalities || null,
      subtitle: item.subtitle,
      summary: item.summary,
      body: item.body,
      source_reference: item.source_reference,
      updated_at: item.updated_at,
    })) as AdminEphemeris[];
  } catch (err) {
    console.error('Unexpected error in getAdminEphemeridesList:', err);
    throw err;
  }
}

/**
 * Fetches a single ephemeris record by id from public.contents.
 */
export async function getAdminEphemerisById(id: string): Promise<AdminEphemerisDetail | null> {
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
      .from('contents')
      .select('id, title, slug, subtitle, summary, body, event_date, source_reference, status, visibility, is_featured, category_id, region_id, province_id, municipality_id')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching admin ephemeris by id:', error);
      throw error;
    }

    return data as AdminEphemerisDetail | null;
  } catch (err) {
    console.error('Unexpected error in getAdminEphemerisById:', err);
    throw err;
  }
}

/**
 * Updates a single ephemeris record by id.
 */
export async function updateAdminEphemeris(
  id: string,
  updatedData: Partial<Omit<AdminEphemerisDetail, 'id' | 'slug'>>
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
      .from('contents')
      .update(updatedData)
      .eq('id', id);

    if (error) {
      console.error('Error updating admin ephemeris:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in updateAdminEphemeris:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}

/**
 * Creates a new ephemeris record.
 */
export async function createAdminEphemeris(
  ephemerisData: NewAdminEphemeris
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

    // Fetch content type id for 'ephemeris'
    const { data: ctData, error: ctError } = await supabase
      .from('content_types')
      .select('id')
      .eq('code', 'ephemeris')
      .single();

    if (ctError || !ctData) {
      return { success: false, error: 'No se encontró el tipo de contenido ephemeris.' };
    }

    const { error } = await supabase
      .from('contents')
      .insert([{
        ...ephemerisData,
        content_type_id: ctData.id
      }]);

    if (error) {
      console.error('Error inserting admin ephemeris:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in createAdminEphemeris:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}
