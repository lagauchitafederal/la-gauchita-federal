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
