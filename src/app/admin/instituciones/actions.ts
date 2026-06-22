'use server';

import { updateAdminInstitution, createAdminInstitution } from '../../../lib/admin/admin-institutions';
import { revalidatePath } from 'next/cache';
import { generateSlug, getUniqueSlug } from '../../../lib/admin/slug-utils';

export async function updateInstitutionAction(
  id: string,
  updatedData: {
    name: string;
    institution_type: string;
    description: string | null;
    website_url: string | null;
    is_featured: boolean;
    sort_order: number;
    status: string;
  }
) {
  const result = await updateAdminInstitution(id, updatedData);
  if (result.success) {
    revalidatePath('/admin/instituciones');
    revalidatePath(`/admin/instituciones/${id}/editar`);
  }
  return result;
}

export async function createInstitutionAction(
  institutionData: {
    name: string;
    institution_type: string;
    description: string | null;
    website_url: string | null;
    is_featured: boolean;
    sort_order: number;
  }
) {
  try {
    const baseSlug = generateSlug(institutionData.name);
    const uniqueSlug = await getUniqueSlug('institutions', baseSlug);

    const result = await createAdminInstitution({
      ...institutionData,
      slug: uniqueSlug,
    });

    if (result.success) {
      revalidatePath('/admin/instituciones');
    }
    return result;
  } catch (err: any) {
    console.error('Error in createInstitutionAction:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado al procesar el slug.' };
  }
}

