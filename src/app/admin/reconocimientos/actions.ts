'use server';

import { updateAdminRecognition, createAdminRecognition } from '../../../lib/admin/admin-recognitions';
import { revalidatePath } from 'next/cache';
import { generateSlug, getUniqueSlug } from '../../../lib/admin/slug-utils';

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
  }
) {
  const result = await updateAdminRecognition(id, updatedData);
  if (result.success) {
    revalidatePath('/admin/reconocimientos');
    revalidatePath(`/admin/reconocimientos/${id}/editar`);
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
    }
    return result;
  } catch (err: any) {
    console.error('Error in createRecognitionAction:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado al procesar el slug.' };
  }
}

