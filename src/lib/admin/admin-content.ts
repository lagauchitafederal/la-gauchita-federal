import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../supabase/env';

export interface AdminContent {
  id: string;
  title: string;
  slug: string;
  status: string;
  publish_date: string | null;
  author: { display_name: string | null } | null;
  content_type: { name: string } | null;
  category: { name: string } | null;
}

/**
 * Fetches all contents from public.contents for administrative list display.
 * Reads the 'sb-access-token' cookie to initialize the user's Supabase instance
 * to respect the database Row Level Security (RLS) configuration.
 */
export async function getAdminContentsList(): Promise<AdminContent[]> {
  try {
    const { supabaseUrl, supabaseAnonKey } = getEnv();
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    // Initialize client with authorization token to respect RLS
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
        profiles(display_name),
        content_types(name),
        categories(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin contents list:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      status: item.status,
      publish_date: item.publish_date,
      author: Array.isArray(item.profiles) ? item.profiles[0] || null : item.profiles || null,
      content_type: Array.isArray(item.content_types) ? item.content_types[0] || null : item.content_types || null,
      category: Array.isArray(item.categories) ? item.categories[0] || null : item.categories || null,
    })) as AdminContent[];
  } catch (err) {
    console.error('Unexpected error in getAdminContentsList:', err);
    throw err;
  }
}

export interface AdminContentDetail {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  summary: string | null;
  body: string | null;
  event_date: string | null;
  source_reference: string | null;
  status: string;
  visibility: string;
}

/**
 * Fetches a single content record by id from public.contents.
 * Reads the 'sb-access-token' cookie to initialize the user's Supabase instance
 * to respect the database Row Level Security (RLS) configuration.
 */
export async function getAdminContentById(id: string): Promise<AdminContentDetail | null> {
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
      .select('id, title, slug, subtitle, summary, body, event_date, source_reference, status, visibility')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching admin content by id:', error);
      throw error;
    }

    return data as AdminContentDetail | null;
  } catch (err) {
    console.error('Unexpected error in getAdminContentById:', err);
    throw err;
  }
}

/**
 * Updates a single content record by id in public.contents.
 * Reads the 'sb-access-token' cookie to initialize the user's Supabase instance
 * to respect the database Row Level Security (RLS) configuration.
 */
export async function updateAdminContent(
  id: string,
  updatedData: Partial<Omit<AdminContentDetail, 'id' | 'slug'>>
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
      console.error('Error updating admin content:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in updateAdminContent:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}

