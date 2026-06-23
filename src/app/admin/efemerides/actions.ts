'use server';

import {
  updateAdminEphemeris,
  createAdminEphemeris,
  getAdminEphemerisById
} from '../../../lib/admin/admin-ephemerides';
import { revalidatePath } from 'next/cache';
import { generateSlug, getUniqueSlug } from '../../../lib/admin/slug-utils';
import { logAdminActivity } from '../../../lib/admin/admin-activity';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../../../lib/supabase/env';
import { cookies } from 'next/headers';

export async function updateEphemerisAction(
  id: string,
  updatedData: {
    title: string;
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
) {
  const prevContent = await getAdminEphemerisById(id);

  const result = await updateAdminEphemeris(id, updatedData);
  if (result.success) {
    revalidatePath('/admin/efemerides');
    revalidatePath(`/admin/efemerides/${id}/editar`);
    
    // Also revalidate public feeds
    revalidatePath('/');
    revalidatePath('/contenidos');

    await logAdminActivity({
      action_type: 'update',
      entity_type: 'content',
      entity_id: id,
      entity_label: updatedData.title,
      metadata: {
        status_previo: prevContent?.status || null,
        status_nuevo: updatedData.status,
        visibility_previo: prevContent?.visibility || null,
        visibility_nuevo: updatedData.visibility,
        content_type: 'ephemeris',
      },
    });
  }
  return result;
}

export async function createEphemerisAction(
  contentData: {
    title: string;
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
) {
  try {
    const baseSlug = generateSlug(contentData.title);
    const uniqueSlug = await getUniqueSlug('contents', baseSlug);

    const result = await createAdminEphemeris({
      ...contentData,
      slug: uniqueSlug,
    });

    if (result.success) {
      revalidatePath('/admin/efemerides');
      revalidatePath('/');
      revalidatePath('/contenidos');

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
          .from('contents')
          .select('id')
          .eq('slug', uniqueSlug)
          .maybeSingle();
        if (data) {
          createdId = data.id;
        }
      } catch (err) {
        console.error('Error fetching created ephemeris ID for activity log:', err);
      }

      await logAdminActivity({
        action_type: 'create',
        entity_type: 'content',
        entity_id: createdId,
        entity_label: contentData.title,
        metadata: {
          is_featured: contentData.is_featured,
          status_nuevo: contentData.status,
          visibility_nuevo: contentData.visibility,
          content_type: 'ephemeris',
        },
      });
    }
    return result;
  } catch (err: any) {
    console.error('Unexpected error in createEphemerisAction:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}
