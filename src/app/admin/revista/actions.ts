'use server';

import { createAdminMagazine, updateAdminMagazine, getAdminMagazineById } from '../../../lib/admin/admin-magazines';
import { revalidatePath } from 'next/cache';
import { generateSlug, getUniqueSlug } from '../../../lib/admin/slug-utils';
import { logAdminActivity } from '../../../lib/admin/admin-activity';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../../../lib/supabase/env';
import { cookies } from 'next/headers';

// Helper to get authenticated supabase client in actions
async function getAuthSupabase() {
  const { supabaseUrl, supabaseAnonKey } = getEnv();
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    auth: { persistSession: false }
  });
}

export async function createMagazineAction(formData: {
  edition_number: number;
  volume: string | null;
  publication_year: number;
  publication_date: string | null;
  title: string;
  description: string | null;
  table_of_contents: any[];
  publisher_institution_id: string;
  cover_image_asset_id: string | null;
  pdf_asset_id: string | null;
  status: string;
  visibility: string;
  is_featured: boolean;
  sort_order: number;
}) {
  try {
    const supabase = await getAuthSupabase();

    // 1. Mandatory fields
    if (!formData.title || !formData.edition_number || !formData.publication_year || !formData.publisher_institution_id) {
      return { success: false, error: 'El título, número de edición, año e institución editora son obligatorios.' };
    }

    if (formData.status === 'published') {
      if (!formData.title || !formData.edition_number || !formData.publication_year || !formData.publisher_institution_id) {
        return { success: false, error: 'No se puede publicar una edición sin título, número, año e institución editora.' };
      }
    }

    // 2. Edition number must be positive
    if (formData.edition_number <= 0) {
      return { success: false, error: 'El número de edición debe ser mayor que cero.' };
    }

    // 3. Year validation
    if (formData.publication_year < 1900 || formData.publication_year > 2100) {
      return { success: false, error: 'El año de publicación debe estar entre 1900 y 2100.' };
    }

    // 4. Duplicate edition number check for the same publisher
    const { data: duplicate } = await supabase
      .from('magazine_editions')
      .select('id')
      .eq('publisher_institution_id', formData.publisher_institution_id)
      .eq('edition_number', formData.edition_number)
      .maybeSingle();

    if (duplicate) {
      return { success: false, error: 'Ya existe una edición con ese número para la institución editora seleccionada.' };
    }

    // 5. Year compatibility check
    if (formData.publication_date) {
      const dateParts = formData.publication_date.split('-');
      if (dateParts.length > 0) {
        const dateYear = parseInt(dateParts[0], 10);
        if (dateYear !== formData.publication_year) {
          return { success: false, error: 'El año de la fecha de publicación no coincide con el año de la edición especificado.' };
        }
      }
    }

    // 6. Cover and PDF assets validation
    if (formData.cover_image_asset_id) {
      const { data: asset } = await supabase
        .from('media_assets')
        .select('id, asset_type')
        .eq('id', formData.cover_image_asset_id)
        .maybeSingle();
      if (!asset) {
        return { success: false, error: 'La portada seleccionada no existe en el archivo de medios.' };
      }
      if (asset.asset_type !== 'cover_image') {
        return { success: false, error: 'El medio seleccionado para la portada debe ser una imagen de portada (cover_image).' };
      }
    }

    if (formData.pdf_asset_id) {
      const { data: asset } = await supabase
        .from('media_assets')
        .select('id, asset_type')
        .eq('id', formData.pdf_asset_id)
        .maybeSingle();
      if (!asset) {
        return { success: false, error: 'El PDF seleccionado no existe en el archivo de medios.' };
      }
      if (asset.asset_type !== 'magazine_pdf' && asset.asset_type !== 'pdf_document') {
        return { success: false, error: 'El archivo seleccionado para el PDF debe ser de tipo revista (magazine_pdf) o documento PDF (pdf_document).' };
      }
    }

    // 7. Slug auto-generation
    const { data: inst } = await supabase
      .from('institutions')
      .select('name')
      .eq('id', formData.publisher_institution_id)
      .maybeSingle();
    const instName = inst ? inst.name : 'revista';
    
    const baseSlug = generateSlug(`${instName}-nro-${formData.edition_number}`);
    const uniqueSlug = await getUniqueSlug('magazine_editions', baseSlug);

    const result = await createAdminMagazine({
      ...formData,
      slug: uniqueSlug
    });

    if (result.success) {
      revalidatePath('/admin/revista');

      // Fetch the created id for activity logs
      let createdId: string | null = null;
      try {
        const { data } = await supabase
          .from('magazine_editions')
          .select('id')
          .eq('slug', uniqueSlug)
          .maybeSingle();
        if (data) {
          createdId = data.id;
        }
      } catch (err) {
        console.error('Error fetching created magazine ID for log:', err);
      }

      await logAdminActivity({
        action_type: 'create',
        entity_type: 'content',
        entity_id: createdId,
        entity_label: `${formData.title} (Nº ${formData.edition_number})`,
        metadata: {
          sub_entity_type: 'magazine_edition',
          status_nuevo: formData.status,
          is_featured: formData.is_featured,
        }
      });
    }

    return result;
  } catch (err: any) {
    console.error('Error in createMagazineAction:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado al guardar la edición.' };
  }
}

export async function updateMagazineAction(
  id: string,
  updatedData: {
    edition_number: number;
    volume: string | null;
    publication_year: number;
    publication_date: string | null;
    title: string;
    description: string | null;
    table_of_contents: any[];
    publisher_institution_id: string;
    cover_image_asset_id: string | null;
    pdf_asset_id: string | null;
    status: string;
    visibility: string;
    is_featured: boolean;
    sort_order: number;
  }
) {
  try {
    const supabase = await getAuthSupabase();

    // 1. Mandatory fields
    if (!updatedData.title || !updatedData.edition_number || !updatedData.publication_year || !updatedData.publisher_institution_id) {
      return { success: false, error: 'El título, número de edición, año e institución editora son obligatorios.' };
    }

    if (updatedData.status === 'published') {
      if (!updatedData.title || !updatedData.edition_number || !updatedData.publication_year || !updatedData.publisher_institution_id) {
        return { success: false, error: 'No se puede publicar una edición sin título, número, año e institución editora.' };
      }
    }

    // 2. Edition number must be positive
    if (updatedData.edition_number <= 0) {
      return { success: false, error: 'El número de edición debe ser mayor que cero.' };
    }

    // 3. Year validation
    if (updatedData.publication_year < 1900 || updatedData.publication_year > 2100) {
      return { success: false, error: 'El año de publicación debe estar entre 1900 y 2100.' };
    }

    // 4. Duplicate edition number check (excluding current record)
    const { data: duplicate } = await supabase
      .from('magazine_editions')
      .select('id')
      .eq('publisher_institution_id', updatedData.publisher_institution_id)
      .eq('edition_number', updatedData.edition_number)
      .neq('id', id)
      .maybeSingle();

    if (duplicate) {
      return { success: false, error: 'Ya existe otra edición con ese número para la institución editora seleccionada.' };
    }

    // 5. Year compatibility check
    if (updatedData.publication_date) {
      const dateParts = updatedData.publication_date.split('-');
      if (dateParts.length > 0) {
        const dateYear = parseInt(dateParts[0], 10);
        if (dateYear !== updatedData.publication_year) {
          return { success: false, error: 'El año de la fecha de publicación no coincide con el año de la edición especificado.' };
        }
      }
    }

    // 6. Cover and PDF assets validation
    if (updatedData.cover_image_asset_id) {
      const { data: asset } = await supabase
        .from('media_assets')
        .select('id, asset_type')
        .eq('id', updatedData.cover_image_asset_id)
        .maybeSingle();
      if (!asset) {
        return { success: false, error: 'La portada seleccionada no existe en el archivo de medios.' };
      }
      if (asset.asset_type !== 'cover_image') {
        return { success: false, error: 'El medio seleccionado para la portada debe ser una imagen de portada (cover_image).' };
      }
    }

    if (updatedData.pdf_asset_id) {
      const { data: asset } = await supabase
        .from('media_assets')
        .select('id, asset_type')
        .eq('id', updatedData.pdf_asset_id)
        .maybeSingle();
      if (!asset) {
        return { success: false, error: 'El PDF seleccionado no existe en el archivo de medios.' };
      }
      if (asset.asset_type !== 'magazine_pdf' && asset.asset_type !== 'pdf_document') {
        return { success: false, error: 'El archivo seleccionado para el PDF debe ser de tipo revista (magazine_pdf) o documento PDF (pdf_document).' };
      }
    }

    const prevMagazine = await getAdminMagazineById(id);

    const result = await updateAdminMagazine(id, updatedData);

    if (result.success) {
      revalidatePath('/admin/revista');
      revalidatePath(`/admin/revista/${id}/editar`);

      await logAdminActivity({
        action_type: 'update',
        entity_type: 'content',
        entity_id: id,
        entity_label: `${updatedData.title} (Nº ${updatedData.edition_number})`,
        metadata: {
          sub_entity_type: 'magazine_edition',
          status_previo: prevMagazine?.status || null,
          status_nuevo: updatedData.status,
          is_featured_previo: prevMagazine?.is_featured || false,
          is_featured_nuevo: updatedData.is_featured,
        }
      });
    }

    return result;
  } catch (err: any) {
    console.error('Error in updateMagazineAction:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado al actualizar la edición.' };
  }
}
