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
