'use server';

import { updateAdminRecognition } from '../../../lib/admin/admin-recognitions';
import { revalidatePath } from 'next/cache';

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
