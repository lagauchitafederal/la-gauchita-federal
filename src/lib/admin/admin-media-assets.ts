import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../supabase/env';

export interface AdminMediaAsset {
  id: string;
  title: string;
  description: string | null;
  asset_type: string;
  bucket_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  original_filename: string | null;
  alt_text: string | null;
  credit: string | null;
  source_reference: string | null;
  rights_status: string;
  visibility: string;
  status: string;
  created_at: string;
}

export interface AdminMediaAssetDetail extends AdminMediaAsset {
  content_id: string | null;
  institution_id: string | null;
}

/**
 * Fetches all media assets from public.media_assets for administrative list display.
 * Reads the 'sb-access-token' cookie to initialize the user's Supabase instance
 * to respect the database Row Level Security (RLS) configuration.
 */
export async function getAdminMediaAssetsList(): Promise<AdminMediaAsset[]> {
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
      .from('media_assets')
      .select('id, title, description, asset_type, bucket_name, storage_path, mime_type, file_size_bytes, original_filename, alt_text, credit, source_reference, rights_status, visibility, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin media assets list:', error);
      throw error;
    }

    return (data || []) as AdminMediaAsset[];
  } catch (err) {
    console.error('Unexpected error in getAdminMediaAssetsList:', err);
    throw err;
  }
}

/**
 * Fetches a single media asset detail by ID.
 */
export async function getAdminMediaAssetById(id: string): Promise<AdminMediaAssetDetail | null> {
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
      .from('media_assets')
      .select('id, title, description, asset_type, bucket_name, storage_path, mime_type, file_size_bytes, original_filename, alt_text, credit, source_reference, rights_status, visibility, status, created_at, content_id, institution_id')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching admin media asset detail:', error);
      throw error;
    }

    return data as AdminMediaAssetDetail | null;
  } catch (err) {
    console.error('Unexpected error in getAdminMediaAssetById:', err);
    throw err;
  }
}

export interface NewAdminMediaAsset {
  content_id: string | null;
  institution_id: string | null;
  uploaded_by_profile_id: string | null;
  title: string;
  description: string | null;
  asset_type: string;
  bucket_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  original_filename: string | null;
  alt_text: string | null;
  credit: string | null;
  source_reference: string | null;
  rights_status: string;
  visibility: string;
  status: string;
}

export interface UpdateAdminMediaAsset {
  title: string;
  description: string | null;
  alt_text: string | null;
  credit: string | null;
  source_reference: string | null;
  asset_type: string;
  rights_status: string;
  visibility: string;
  status: string;
  content_id: string | null;
  institution_id: string | null;
}

/**
 * Creates a new media asset record in public.media_assets.
 * Reads the 'sb-access-token' cookie to initialize the user's Supabase instance
 * to respect the database Row Level Security (RLS) configuration.
 */
export async function createAdminMediaAsset(
  assetData: NewAdminMediaAsset
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
      .from('media_assets')
      .insert([assetData]);

    if (error) {
      console.error('Error inserting admin media asset:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in createAdminMediaAsset:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}

/**
 * Updates an existing media asset record in public.media_assets.
 */
export async function updateAdminMediaAsset(
  id: string,
  assetData: UpdateAdminMediaAsset
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
      .from('media_assets')
      .update(assetData)
      .eq('id', id);

    if (error) {
      console.error('Error updating admin media asset:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in updateAdminMediaAsset:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}
