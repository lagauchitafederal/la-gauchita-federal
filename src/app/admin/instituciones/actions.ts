'use server';

import { updateAdminInstitution, createAdminInstitution, getAdminInstitutionById } from '../../../lib/admin/admin-institutions';
import { revalidatePath } from 'next/cache';
import { generateSlug, getUniqueSlug } from '../../../lib/admin/slug-utils';
import { logAdminActivity } from '../../../lib/admin/admin-activity';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../../../lib/supabase/env';
import { cookies } from 'next/headers';

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

  const prevInstitution = await getAdminInstitutionById(id);

  const result = await updateAdminInstitution(id, {
    ...updatedData,
    website_url: finalWebsiteUrl,
  });
  if (result.success) {
    revalidatePath('/admin/instituciones');
    revalidatePath(`/admin/instituciones/${id}/editar`);

    await logAdminActivity({
      action_type: 'update',
      entity_type: 'institution',
      entity_id: id,
      entity_label: updatedData.name,
      metadata: {
        status_previo: prevInstitution?.status || null,
        status_nuevo: updatedData.status,
        is_featured_previo: prevInstitution?.is_featured || false,
        is_featured_nuevo: updatedData.is_featured,
      },
    });
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
          .from('institutions')
          .select('id')
          .eq('slug', uniqueSlug)
          .maybeSingle();
        if (data) {
          createdId = data.id;
        }
      } catch (err) {
        console.error('Error fetching created institution ID for activity log:', err);
      }

      await logAdminActivity({
        action_type: 'create',
        entity_type: 'institution',
        entity_id: createdId,
        entity_label: institutionData.name,
        metadata: {
          is_featured: institutionData.is_featured,
          status_nuevo: 'draft',
        },
      });
    }
    return result;
  } catch (err: any) {
    console.error('Error in createInstitutionAction:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado al procesar el slug.' };
  }
}

