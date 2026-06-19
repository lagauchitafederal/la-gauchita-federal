'use server';

import { updateAdminContent } from '../../../lib/admin/admin-content';
import { revalidatePath } from 'next/cache';

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
  const result = await updateAdminContent(id, updatedData);
  if (result.success) {
    revalidatePath('/admin/contenidos');
    revalidatePath(`/admin/contenidos/${id}/editar`);
  }
  return result;
}
