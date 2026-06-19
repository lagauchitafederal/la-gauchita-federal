'use server';

import { updateAdminContent, createAdminContent } from '../../../lib/admin/admin-content';
import { revalidatePath } from 'next/cache';
import { generateSlug, getUniqueSlug } from '../../../lib/admin/slug-utils';

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
    }
    return result;
  } catch (err: any) {
    console.error('Error in createContentAction:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado al procesar el slug.' };
  }
}

