import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../supabase/env';

export interface AdminInstitution {
  id: string;
  name: string;
  slug: string;
  institution_type: string;
  status: string;
  is_featured: boolean;
  province: { name: string } | null;
  municipality: { name: string } | null;
}

/**
 * Fetches all institutions from public.institutions for administrative list display.
 * Reads the 'sb-access-token' cookie to initialize the user's Supabase instance
 * to respect the database Row Level Security (RLS) configuration.
 */
export async function getAdminInstitutionsList(): Promise<AdminInstitution[]> {
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
      .from('institutions')
      .select(`
        id,
        name,
        slug,
        institution_type,
        status,
        is_featured,
        provinces(name),
        municipalities(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin institutions list:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      institution_type: item.institution_type,
      status: item.status,
      is_featured: item.is_featured,
      province: Array.isArray(item.provinces) ? item.provinces[0] || null : item.provinces || null,
      municipality: Array.isArray(item.municipalities) ? item.municipalities[0] || null : item.municipalities || null,
    })) as AdminInstitution[];
  } catch (err) {
    console.error('Unexpected error in getAdminInstitutionsList:', err);
    throw err;
  }
}

export interface AdminInstitutionDetail {
  id: string;
  name: string;
  slug: string;
  institution_type: string;
  description: string | null;
  website_url: string | null;
  is_featured: boolean;
  sort_order: number;
  status: string;
}

/**
 * Fetches a single institution record by id from public.institutions.
 * Reads the 'sb-access-token' cookie to initialize the user's Supabase instance
 * to respect the database Row Level Security (RLS) configuration.
 */
export async function getAdminInstitutionById(id: string): Promise<AdminInstitutionDetail | null> {
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
      .from('institutions')
      .select('id, name, slug, institution_type, description, website_url, is_featured, sort_order, status')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching admin institution by id:', error);
      throw error;
    }

    return data as AdminInstitutionDetail | null;
  } catch (err) {
    console.error('Unexpected error in getAdminInstitutionById:', err);
    throw err;
  }
}

/**
 * Updates a single institution record by id in public.institutions.
 * Reads the 'sb-access-token' cookie to initialize the user's Supabase instance
 * to respect the database Row Level Security (RLS) configuration.
 */
export async function updateAdminInstitution(
  id: string,
  updatedData: Partial<Omit<AdminInstitutionDetail, 'id' | 'slug'>>
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
      .from('institutions')
      .update(updatedData)
      .eq('id', id);

    if (error) {
      console.error('Error updating admin institution:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in updateAdminInstitution:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}

