'use server';

import { createAdminPerson, updateAdminPerson } from '../../../lib/admin/admin-people';
import { generateSlug, getUniqueSlug } from '../../../lib/admin/slug-utils';
import { revalidatePath } from 'next/cache';

export async function createPersonAction(data: {
  full_name: string;
  short_bio: string | null;
  biography: string | null;
  person_type: string;
  birth_date: string | null;
  death_date: string | null;
  region_id: string | null;
  province_id: string | null;
  municipality_id: string | null;
  main_image_asset_id: string | null;
  source_reference: string | null;
  status: string;
  visibility: string;
  is_featured: boolean;
}) {
  try {
    // Validations
    if (!data.full_name || data.full_name.trim().length < 3) {
      return { success: false, error: 'El nombre completo debe tener al menos 3 caracteres.' };
    }
    if (!data.person_type) {
      return { success: false, error: 'El tipo de personaje es obligatorio.' };
    }
    if (data.birth_date && data.death_date && new Date(data.death_date) < new Date(data.birth_date)) {
      return { success: false, error: 'La fecha de fallecimiento no puede ser anterior a la fecha de nacimiento.' };
    }

    // Auto-generate slug
    const baseSlug = generateSlug(data.full_name);
    const uniqueSlug = await getUniqueSlug('people', baseSlug);

    const result = await createAdminPerson({
      ...data,
      slug: uniqueSlug,
    });

    if (result.success) {
      revalidatePath('/admin/personajes');
      revalidatePath('/personajes');
    }

    return result;
  } catch (err: any) {
    console.error('Error in createPersonAction:', err);
    return { success: false, error: err.message || 'Error al crear el personaje.' };
  }
}

export async function updatePersonAction(
  id: string,
  data: {
    full_name: string;
    short_bio: string | null;
    biography: string | null;
    person_type: string;
    birth_date: string | null;
    death_date: string | null;
    region_id: string | null;
    province_id: string | null;
    municipality_id: string | null;
    main_image_asset_id: string | null;
    source_reference: string | null;
    status: string;
    visibility: string;
    is_featured: boolean;
  }
) {
  try {
    // Validations
    if (!data.full_name || data.full_name.trim().length < 3) {
      return { success: false, error: 'El nombre completo debe tener al menos 3 caracteres.' };
    }
    if (!data.person_type) {
      return { success: false, error: 'El tipo de personaje es obligatorio.' };
    }
    if (data.birth_date && data.death_date && new Date(data.death_date) < new Date(data.birth_date)) {
      return { success: false, error: 'La fecha de fallecimiento no puede ser anterior a la fecha de nacimiento.' };
    }

    const result = await updateAdminPerson(id, data);

    if (result.success) {
      revalidatePath('/admin/personajes');
      revalidatePath(`/admin/personajes/${id}/editar`);
      revalidatePath('/personajes');
    }

    return result;
  } catch (err: any) {
    console.error('Error in updatePersonAction:', err);
    return { success: false, error: err.message || 'Error al actualizar el personaje.' };
  }
}
