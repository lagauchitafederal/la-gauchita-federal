import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../supabase/env';

export interface AdminRecognition {
  id: string;
  title: string;
  slug: string;
  recognition_type: string;
  recognized_entity_type: string;
  granting_institution_name: string | null;
  recognition_date: string | null;
  status: string;
  location: string | null;
}

/**
 * Fetches all recognitions from public.recognitions for administrative list display.
 * Reads the 'sb-access-token' cookie to initialize the user's Supabase instance
 * to respect the database Row Level Security (RLS) configuration.
 */
export async function getAdminRecognitionsList(): Promise<AdminRecognition[]> {
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
      .from('recognitions')
      .select('id, title, slug, recognition_type, recognized_entity_type, granting_institution_name, recognition_date, status, location')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin recognitions list:', error);
      throw error;
    }

    return (data || []) as AdminRecognition[];
  } catch (err) {
    console.error('Unexpected error in getAdminRecognitionsList:', err);
    throw err;
  }
}

export interface AdminRecognitionDetail {
  id: string;
  title: string;
  slug: string;
  recognition_type: string;
  description: string | null;
  granting_institution_name: string | null;
  recognition_date: string | null;
  source_reference: string | null;
  is_featured: boolean;
  status: string;
}

/**
 * Fetches a single recognition record by id from public.recognitions.
 * Reads the 'sb-access-token' cookie to initialize the user's Supabase instance
 * to respect the database Row Level Security (RLS) configuration.
 */
export async function getAdminRecognitionById(id: string): Promise<AdminRecognitionDetail | null> {
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
      .from('recognitions')
      .select('id, title, slug, recognition_type, description, granting_institution_name, recognition_date, source_reference, is_featured, status')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching admin recognition by id:', error);
      throw error;
    }

    return data as AdminRecognitionDetail | null;
  } catch (err) {
    console.error('Unexpected error in getAdminRecognitionById:', err);
    throw err;
  }
}

/**
 * Updates a single recognition record by id in public.recognitions.
 * Reads the 'sb-access-token' cookie to initialize the user's Supabase instance
 * to respect the database Row Level Security (RLS) configuration.
 */
export async function updateAdminRecognition(
  id: string,
  updatedData: Partial<Omit<AdminRecognitionDetail, 'id' | 'slug'>>
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
      .from('recognitions')
      .update(updatedData)
      .eq('id', id);

    if (error) {
      console.error('Error updating admin recognition:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in updateAdminRecognition:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}

