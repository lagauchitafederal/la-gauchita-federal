'use server';

import { createAdminMediaAsset, updateAdminMediaAsset, getAdminMediaAssetById } from '../../../lib/admin/admin-media-assets';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../../../lib/supabase/env';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { logAdminActivity } from '../../../lib/admin/admin-activity';

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

      let createdId: string | null = null;
      try {
        const { supabaseUrl, supabaseAnonKey } = getEnv();
        const cookieStore = await cookies();
        const token = cookieStore.get('sb-access-token')?.value;
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
          auth: { persistSession: false }
        });
        const { data } = await supabase
          .from('media_assets')
          .select('id')
          .eq('storage_path', assetData.storage_path)
          .maybeSingle();
        if (data) {
          createdId = data.id;
        }
      } catch (err) {
        console.error('Error fetching created media asset ID for activity log:', err);
      }

      await logAdminActivity({
        action_type: 'upload',
        entity_type: 'media_asset',
        entity_id: createdId,
        entity_label: assetData.title,
        metadata: {
          original_filename: assetData.original_filename,
          mime_type: assetData.mime_type,
          file_size_bytes: assetData.file_size_bytes,
          status_nuevo: assetData.status,
          visibility: assetData.visibility,
        },
      });
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Usuario no autenticado.' };
    }

    const prevMediaAsset = await getAdminMediaAssetById(id);

    const result = await updateAdminMediaAsset(id, assetData);

    if (result.success) {
      revalidatePath('/admin/archivo');

      await logAdminActivity({
        action_type: 'update',
        entity_type: 'media_asset',
        entity_id: id,
        entity_label: assetData.title,
        metadata: {
          status_previo: prevMediaAsset?.status || null,
          status_nuevo: assetData.status,
          visibility_previo: prevMediaAsset?.visibility || null,
          visibility_nuevo: assetData.visibility,
        },
      });
    }
    return result;
  } catch (err: any) {
    console.error('Error in updateMediaAssetAction:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado al actualizar el archivo.' };
  }
}
