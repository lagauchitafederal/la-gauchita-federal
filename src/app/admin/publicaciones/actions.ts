'use server';

import { createAdminPublication, updateAdminPublication, getAdminPublicationById } from '../../../lib/admin/admin-publications';
import { revalidatePath } from 'next/cache';
import { generateSlug, getUniqueSlug } from '../../../lib/admin/slug-utils';
import { logAdminActivity } from '../../../lib/admin/admin-activity';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../../../lib/supabase/env';
import { cookies } from 'next/headers';

async function getAuthSupabase() {
  const { supabaseUrl, supabaseAnonKey } = getEnv();
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    auth: { persistSession: false }
  });
}

export async function createPublicationAction(formData: {
  title: string;
  short_description: string | null;
  description: string | null;
  publication_type: 'book' | 'album' | 'special_work';
  author_text: string | null;
  publication_year: number | null;
  publisher_institution_id: string | null;
  cover_image_asset_id: string | null;
  source_reference: string | null;
  status: 'draft' | 'review' | 'published' | 'archived' | 'rejected';
  visibility: 'public' | 'subscribers' | 'institutional' | 'private';
  is_featured: boolean;
  sort_order: number;
}) {
  try {
    const supabase = await getAuthSupabase();

    // 1. Mandatory fields
    if (!formData.title || !formData.publication_type) {
      return { success: false, error: 'El título y el tipo de publicación son obligatorios.' };
    }

    // 2. Year validation
    if (formData.publication_year !== null) {
      const currentYear = new Date().getFullYear();
      if (formData.publication_year < 1800 || formData.publication_year > currentYear + 1) {
        return { success: false, error: `El año de publicación debe estar entre 1800 y ${currentYear + 1}.` };
      }
    }

    // 3. Cover asset validation
    if (formData.cover_image_asset_id) {
      const { data: asset } = await supabase
        .from('media_assets')
        .select('id')
        .eq('id', formData.cover_image_asset_id)
        .maybeSingle();
      if (!asset) {
        return { success: false, error: 'La imagen de portada seleccionada no existe.' };
      }
    }

    // 4. Institution validation
    if (formData.publisher_institution_id) {
      const { data: inst } = await supabase
        .from('institutions')
        .select('id')
        .eq('id', formData.publisher_institution_id)
        .maybeSingle();
      if (!inst) {
        return { success: false, error: 'La institución editora seleccionada no existe.' };
      }
    }

    // 5. Slug auto-generation
    const baseSlug = generateSlug(formData.title);
    const uniqueSlug = await getUniqueSlug('cultural_publications', baseSlug);

    const result = await createAdminPublication({
      ...formData,
      slug: uniqueSlug
    });

    if (result.success) {
      revalidatePath('/admin/publicaciones');
      revalidatePath('/publicaciones');

      // Fetch created ID for logs
      let createdId: string | null = null;
      try {
        const { data } = await supabase
          .from('cultural_publications')
          .select('id')
          .eq('slug', uniqueSlug)
          .maybeSingle();
        if (data) {
          createdId = data.id;
        }
      } catch (err) {
        console.warn('Error fetching created publication ID for log:', err);
      }

      await logAdminActivity({
        action_type: 'create',
        entity_type: 'content',
        entity_id: createdId,
        entity_label: `${formData.title} (${formData.publication_type})`,
        metadata: {
          sub_entity_type: 'cultural_publication',
          status_nuevo: formData.status,
          is_featured: formData.is_featured,
        }
      });
    }

    return result;
  } catch (err: any) {
    console.error('Error in createPublicationAction:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado al crear la publicación.' };
  }
}

export async function updatePublicationAction(
  id: string,
  updatedData: {
    title: string;
    short_description: string | null;
    description: string | null;
    publication_type: 'book' | 'album' | 'special_work';
    author_text: string | null;
    publication_year: number | null;
    publisher_institution_id: string | null;
    cover_image_asset_id: string | null;
    source_reference: string | null;
    status: 'draft' | 'review' | 'published' | 'archived' | 'rejected';
    visibility: 'public' | 'subscribers' | 'institutional' | 'private';
    is_featured: boolean;
    sort_order: number;
  }
) {
  try {
    const supabase = await getAuthSupabase();

    // 1. Mandatory fields
    if (!updatedData.title || !updatedData.publication_type) {
      return { success: false, error: 'El título y el tipo de publicación son obligatorios.' };
    }

    // 2. Year validation
    if (updatedData.publication_year !== null) {
      const currentYear = new Date().getFullYear();
      if (updatedData.publication_year < 1800 || updatedData.publication_year > currentYear + 1) {
        return { success: false, error: `El año de publicación debe estar entre 1800 y ${currentYear + 1}.` };
      }
    }

    // 3. Cover asset validation
    if (updatedData.cover_image_asset_id) {
      const { data: asset } = await supabase
        .from('media_assets')
        .select('id')
        .eq('id', updatedData.cover_image_asset_id)
        .maybeSingle();
      if (!asset) {
        return { success: false, error: 'La imagen de portada seleccionada no existe.' };
      }
    }

    // 4. Institution validation
    if (updatedData.publisher_institution_id) {
      const { data: inst } = await supabase
        .from('institutions')
        .select('id')
        .eq('id', updatedData.publisher_institution_id)
        .maybeSingle();
      if (!inst) {
        return { success: false, error: 'La institución editora seleccionada no existe.' };
      }
    }

    const prevPub = await getAdminPublicationById(id);

    const result = await updateAdminPublication(id, updatedData);

    if (result.success) {
      revalidatePath('/admin/publicaciones');
      revalidatePath(`/admin/publicaciones/${id}/editar`);
      revalidatePath('/publicaciones');
      if (prevPub) {
        revalidatePath(`/publicaciones/${prevPub.slug}`);
      }

      await logAdminActivity({
        action_type: 'update',
        entity_type: 'content',
        entity_id: id,
        entity_label: `${updatedData.title} (${updatedData.publication_type})`,
        metadata: {
          sub_entity_type: 'cultural_publication',
          status_previo: prevPub?.status || null,
          status_nuevo: updatedData.status,
          is_featured_previo: prevPub?.is_featured || false,
          is_featured_nuevo: updatedData.is_featured,
        }
      });
    }

    return result;
  } catch (err: any) {
    console.error('Error in updatePublicationAction:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado al actualizar la publicación.' };
  }
}
