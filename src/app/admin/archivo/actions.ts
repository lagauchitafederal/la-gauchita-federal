'use server';

import { createAdminMediaAsset, updateAdminMediaAsset } from '../../../lib/admin/admin-media-assets';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../../../lib/supabase/env';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function createMediaAssetAction(
  assetData: {
    content_id: string | null;
    institution_id: string | null;
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
) {
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

    const result = await createAdminMediaAsset({
      ...assetData,
      uploaded_by_profile_id: profileId,
    });

    if (result.success) {
      revalidatePath('/admin/archivo');
    }
    return result;
  } catch (err: any) {
    console.error('Error in createMediaAssetAction:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado al registrar el archivo.' };
  }
}

export async function updateMediaAssetAction(
  id: string,
  assetData: {
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
) {
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

    // Check user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Usuario no autenticado.' };
    }

    // Delegate authorization directly to database RLS policies
    const result = await updateAdminMediaAsset(id, assetData);

    if (result.success) {
      revalidatePath('/admin/archivo');
    }
    return result;
  } catch (err: any) {
    console.error('Error in updateMediaAssetAction:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado al actualizar el archivo.' };
  }
}
