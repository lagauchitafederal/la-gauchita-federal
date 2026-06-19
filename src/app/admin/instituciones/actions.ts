'use server';

import { updateAdminInstitution } from '../../../lib/admin/admin-institutions';
import { revalidatePath } from 'next/cache';

export async function updateInstitutionAction(
  id: string,
  updatedData: {
    name: string;
    institution_type: string;
    description: string | null;
    website_url: string | null;
    is_featured: boolean;
    sort_order: number;
  }
) {
  const result = await updateAdminInstitution(id, updatedData);
  if (result.success) {
    revalidatePath('/admin/instituciones');
    revalidatePath(`/admin/instituciones/${id}/editar`);
  }
  return result;
}
