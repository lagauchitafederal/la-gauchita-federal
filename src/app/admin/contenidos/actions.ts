'use server';

import { updateAdminContent, createAdminContent, getAdminContentById } from '../../../lib/admin/admin-content';
import { revalidatePath } from 'next/cache';
import { generateSlug, getUniqueSlug } from '../../../lib/admin/slug-utils';
import { logAdminActivity } from '../../../lib/admin/admin-activity';
import { createContentSnapshot, restoreContentVersion } from '../../../lib/admin/admin-content-versions';
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
    publish_date?: string | null; // Allow publish_date editing
    is_featured?: boolean; // Allow is_featured editing
  }
) {
  const prevContent = await getAdminContentById(id);

  // Before updating, create a snapshot of the previous state
  await createContentSnapshot(id, 'Historial: Modificación del contenido');

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
    publish_date?: string | null;
    visibility?: string;
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

      if (createdId) {
        // Record version 1 on content creation
        await createContentSnapshot(createdId, 'Versión inicial (v1)');
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

export async function restoreContentVersionAction(versionId: string, contentId: string) {
  const result = await restoreContentVersion(versionId);
  if (result.success) {
    revalidatePath('/admin/contenidos');
    revalidatePath(`/admin/contenidos/${contentId}/editar`);
  }
  return result;
}

import { createAssignment, updateAssignmentStatus } from '../../../lib/admin/admin-editorial-assignments';

export async function createAssignmentAction(params: {
  entity_id: string;
  assigned_to_profile_id: string;
  notes?: string | null;
  due_date?: string | null;
}) {
  const result = await createAssignment(params);
  if (result.success) {
    revalidatePath(`/admin/contenidos/${params.entity_id}/editar`);
    revalidatePath('/admin/asignaciones');
  }
  return result;
}

export async function updateAssignmentStatusAction(
  assignmentId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled',
  notes?: string | null,
  dueDate?: string | null,
  contentId?: string
) {
  const result = await updateAssignmentStatus(assignmentId, status, notes, dueDate);
  if (result.success) {
    if (contentId) {
      revalidatePath(`/admin/contenidos/${contentId}/editar`);
    }
    revalidatePath('/admin/asignaciones');
  }
  return result;
}

