'use server';

import { updateAdminRecognition, createAdminRecognition, getAdminRecognitionById } from '../../../lib/admin/admin-recognitions';
import { revalidatePath } from 'next/cache';
import { generateSlug, getUniqueSlug } from '../../../lib/admin/slug-utils';
import { logAdminActivity } from '../../../lib/admin/admin-activity';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../../../lib/supabase/env';
import { cookies } from 'next/headers';

export async function updateRecognitionAction(
  id: string,
  updatedData: {
    title: string;
    recognition_type: string;
    description: string | null;
    granting_institution_name: string | null;
    recognition_date: string | null;
    source_reference: string | null;
    is_featured: boolean;
    status: string;
  }
) {
  const prevRecognition = await getAdminRecognitionById(id);

  const result = await updateAdminRecognition(id, updatedData);
  if (result.success) {
    revalidatePath('/admin/reconocimientos');
    revalidatePath(`/admin/reconocimientos/${id}/editar`);

    await logAdminActivity({
      action_type: 'update',
      entity_type: 'recognition',
      entity_id: id,
      entity_label: updatedData.title,
      metadata: {
        status_previo: prevRecognition?.status || null,
        status_nuevo: updatedData.status,
        is_featured_previo: prevRecognition?.is_featured || false,
        is_featured_nuevo: updatedData.is_featured,
      },
    });
  }
  return result;
}

export async function createRecognitionAction(
  recognitionData: {
    title: string;
    recognition_type: string;
    recognized_entity_type: string;
    description: string | null;
    granting_institution_name: string | null;
    recognition_date: string | null;
    source_reference: string | null;
    is_featured: boolean;
  }
) {
  try {
    const baseSlug = generateSlug(recognitionData.title);
    const uniqueSlug = await getUniqueSlug('recognitions', baseSlug);

    const result = await createAdminRecognition({
      ...recognitionData,
      slug: uniqueSlug,
    });

    if (result.success) {
      revalidatePath('/admin/reconocimientos');

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
          .from('recognitions')
          .select('id')
          .eq('slug', uniqueSlug)
          .maybeSingle();
        if (data) {
          createdId = data.id;
        }
      } catch (err) {
        console.error('Error fetching created recognition ID for activity log:', err);
      }

      await logAdminActivity({
        action_type: 'create',
        entity_type: 'recognition',
        entity_id: createdId,
        entity_label: recognitionData.title,
        metadata: {
          is_featured: recognitionData.is_featured,
          status_nuevo: 'draft',
        },
      });
    }
    return result;
  } catch (err: any) {
    console.error('Error in createRecognitionAction:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado al procesar el slug.' };
  }
}

