'use server';

import { updateAdminContent, createAdminContent, getAdminContentById } from '../../../lib/admin/admin-content';
import { revalidatePath } from 'next/cache';
import { generateSlug, getUniqueSlug } from '../../../lib/admin/slug-utils';
import { logAdminActivity } from '../../../lib/admin/admin-activity';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../../../lib/supabase/env';
import { cookies } from 'next/headers';

export async function updateContentAction(
  id: string,
  updatedData: {
    title: string;
    subtitle: string | null;
    summary: string | null;
    body: string | null;
    event_date: string | null;
    source_reference: string | null;
    status: string;
    visibility: string;
  }
) {
  const prevContent = await getAdminContentById(id);

  const result = await updateAdminContent(id, updatedData);
  if (result.success) {
    revalidatePath('/admin/contenidos');
    revalidatePath(`/admin/contenidos/${id}/editar`);

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
      },
    });
  }
  return result;
}

export async function createContentAction(
  contentData: {
    title: string;
    subtitle: string | null;
    summary: string | null;
    body: string | null;
    content_type_id: string;
    category_id: string | null;
    is_featured: boolean;
  }
) {
  try {
    const baseSlug = generateSlug(contentData.title);
    const uniqueSlug = await getUniqueSlug('contents', baseSlug);

    const result = await createAdminContent({
      ...contentData,
      slug: uniqueSlug,
    });

    if (result.success) {
      revalidatePath('/admin/contenidos');

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
        console.error('Error fetching created content ID for activity log:', err);
      }

      await logAdminActivity({
        action_type: 'create',
        entity_type: 'content',
        entity_id: createdId,
        entity_label: contentData.title,
        metadata: {
          is_featured: contentData.is_featured,
          status_nuevo: 'draft',
        },
      });
    }
    return result;
  } catch (err: any) {
    console.error('Error in createContentAction:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado al procesar el slug.' };
  }
}

