'use server';

import { updateAdminInstitution, createAdminInstitution } from '../../../lib/admin/admin-institutions';
import { revalidatePath } from 'next/cache';
import { generateSlug, getUniqueSlug } from '../../../lib/admin/slug-utils';

const WEBSITE_URL_PATTERN = /^https?:\/\/((?!(?:localhost)(?:[:/]|$))(?!.*\.\.)(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?::\d+)?(?:\/[^\s]*)?)$/i;

function isValidWebsiteUrl(urlStr: string | null | undefined): boolean {
  if (!urlStr) return true;
  const trimmed = urlStr.trim();
  if (trimmed === '') return true;
  return WEBSITE_URL_PATTERN.test(trimmed);
}

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
  const websiteUrl = updatedData.website_url ? updatedData.website_url.trim() : null;
  const finalWebsiteUrl = websiteUrl === '' ? null : websiteUrl;

  if (finalWebsiteUrl && !isValidWebsiteUrl(finalWebsiteUrl)) {
    return { success: false, error: 'Ingresá una dirección web válida con http:// o https://.' };
  }

  const result = await updateAdminInstitution(id, {
    ...updatedData,
    website_url: finalWebsiteUrl,
  });
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
  const websiteUrl = institutionData.website_url ? institutionData.website_url.trim() : null;
  const finalWebsiteUrl = websiteUrl === '' ? null : websiteUrl;

  if (finalWebsiteUrl && !isValidWebsiteUrl(finalWebsiteUrl)) {
    return { success: false, error: 'Ingresá una dirección web válida con http:// o https://.' };
  }

  try {
    const baseSlug = generateSlug(institutionData.name);
    const uniqueSlug = await getUniqueSlug('institutions', baseSlug);

    const result = await createAdminInstitution({
      ...institutionData,
      website_url: finalWebsiteUrl,
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

