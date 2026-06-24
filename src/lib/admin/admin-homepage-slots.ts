import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../supabase/env';
import { logAdminActivity } from './admin-activity';
import { checkUserIsAdminOrEditor } from './admin-editorial-assignments';

function getSupabaseClient(token?: string) {
  const { supabaseUrl, supabaseAnonKey } = getEnv();
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
    auth: {
      persistSession: false,
    },
  });
}

export interface HomepageSlot {
  id: string;
  slot_code: 'lead_story' | 'featured_1' | 'featured_2' | 'featured_3' | 'featured_4';
  content_id: string;
  province_id: string | null;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  assigned_by_profile_id: string | null;
  created_at: string;
  updated_at: string;
  content_title?: string;
  content_slug?: string;
  content_status?: string;
  content_visibility?: string;
  content_publish_date?: string | null;
  content_province_id?: string | null;
  content_municipality_id?: string | null;
  content_type_code?: string;
  content_type_name?: string;
  assigned_by_name?: string;
  province_name?: string;
}

/**
 * Lists all homepage slots, optionally filtered by province.
 */
export async function listHomepageSlots(provinceId?: string | null): Promise<HomepageSlot[]> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    const supabase = getSupabaseClient(token);

    let query = supabase
      .from('homepage_slots')
      .select(`
        *,
        contents:content_id(
          title, 
          slug, 
          status, 
          visibility, 
          publish_date, 
          province_id, 
          municipality_id,
          content_types(code, name)
        ),
        assigned_by:assigned_by_profile_id(display_name),
        provinces:province_id(name)
      `)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (provinceId !== undefined) {
      if (provinceId === null) {
        query = query.is('province_id', null);
      } else {
        query = query.eq('province_id', provinceId);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching homepage slots:', error);
      return [];
    }

    return (data || []).map((item: any) => {
      const content = item.contents || {};
      const contentTypes = content.content_types || {};
      return {
        ...item,
        content_title: content.title || 'Desconocido',
        content_slug: content.slug || '',
        content_status: content.status || 'draft',
        content_visibility: content.visibility || 'private',
        content_publish_date: content.publish_date || null,
        content_province_id: content.province_id || null,
        content_municipality_id: content.municipality_id || null,
        content_type_code: Array.isArray(contentTypes) ? contentTypes[0]?.code : contentTypes?.code || '',
        content_type_name: Array.isArray(contentTypes) ? contentTypes[0]?.name : contentTypes?.name || '',
        assigned_by_name: item.assigned_by?.display_name || 'Sistema',
        province_name: item.provinces?.name || 'Federal'
      };
    }) as HomepageSlot[];
  } catch (err) {
    console.error('Unexpected error in listHomepageSlots:', err);
    return [];
  }
}

/**
 * Searches for public, published, and current contents eligible to be pinned on the homepage.
 */
export async function searchEligibleContents(searchQuery: string): Promise<any[]> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    const supabase = getSupabaseClient(token);

    // Get current date/time to filter only current/past publish dates
    const nowStr = new Date().toISOString();

    const { data, error } = await supabase
      .from('contents')
      .select(`
        id, 
        title, 
        slug, 
        status, 
        visibility, 
        publish_date, 
        province_id,
        provinces(name),
        content_types(name)
      `)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .lte('publish_date', nowStr)
      .ilike('title', `%${searchQuery}%`)
      .order('publish_date', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error searching eligible contents:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      publish_date: item.publish_date,
      province_name: item.provinces?.name || 'Federal',
      content_type_name: Array.isArray(item.content_types) ? item.content_types[0]?.name : item.content_types?.name || ''
    }));
  } catch (err) {
    console.error('Unexpected error in searchEligibleContents:', err);
    return [];
  }
}

/**
 * Assigns or replaces a homepage slot. Deactivates existing active slot for same slot_code and province_id.
 */
export async function assignHomepageSlot(params: {
  slot_code: 'lead_story' | 'featured_1' | 'featured_2' | 'featured_3' | 'featured_4';
  content_id: string;
  province_id: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const isAuthorized = await checkUserIsAdminOrEditor();
    if (!isAuthorized) {
      return { success: false, error: 'No posee privilegios de administrador o editor federal para esta acción.' };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    const supabase = getSupabaseClient(token);

    // 1. Validate that content is published, public, and current
    const { data: content, error: contentErr } = await supabase
      .from('contents')
      .select('id, title, status, visibility, publish_date')
      .eq('id', params.content_id)
      .maybeSingle();

    if (contentErr || !content) {
      return { success: false, error: 'El contenido especificado no existe.' };
    }

    if (content.status !== 'published' || content.visibility !== 'public') {
      return { success: false, error: 'El contenido debe estar publicado y ser de visibilidad pública.' };
    }

    if (!content.publish_date || new Date(content.publish_date) > new Date()) {
      return { success: false, error: 'La fecha de publicación del contenido debe ser menor o igual a la fecha actual.' };
    }

    // 2. Validate starts_at/ends_at temporal range
    if (params.starts_at && params.ends_at) {
      if (new Date(params.ends_at) <= new Date(params.starts_at)) {
        return { success: false, error: 'La fecha de finalización debe ser posterior a la de inicio.' };
      }
    }

    // 3. Get currently logged in administrator's profile ID
    const { data: { user } } = await supabase.auth.getUser();
    let assignerId: string | null = null;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      if (profile) {
        assignerId = profile.id;
      }
    }

    // 4. Deactivate existing active slot for this code & territorial scope to avoid duplicate actives
    let deactivateQuery = supabase
      .from('homepage_slots')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('slot_code', params.slot_code)
      .eq('is_active', true);

    if (params.province_id) {
      deactivateQuery = deactivateQuery.eq('province_id', params.province_id);
    } else {
      deactivateQuery = deactivateQuery.is('province_id', null);
    }

    const { error: deacErr } = await deactivateQuery;
    if (deacErr) {
      console.error('Error deactivating existing slot:', deacErr);
      return { success: false, error: 'Error al desactivar el slot anterior: ' + deacErr.message };
    }

    // 5. Insert new active slot assignment
    const { data: newSlot, error: insertErr } = await supabase
      .from('homepage_slots')
      .insert({
        slot_code: params.slot_code,
        content_id: params.content_id,
        province_id: params.province_id || null,
        starts_at: params.starts_at || null,
        ends_at: params.ends_at || null,
        is_active: true,
        assigned_by_profile_id: assignerId,
        sort_order: params.slot_code === 'lead_story' ? 0 : parseInt(params.slot_code.replace('featured_', ''))
      })
      .select()
      .maybeSingle();

    if (insertErr) {
      console.error('Error inserting homepage slot:', insertErr);
      return { success: false, error: 'Error al guardar la asignación: ' + insertErr.message };
    }

    // 6. Log administrative activity
    await logAdminActivity({
      action_type: 'update',
      entity_type: 'content',
      entity_id: params.content_id,
      entity_label: content.title,
      metadata: {
        action: 'assign_homepage_slot',
        slot_id: newSlot?.id,
        slot_code: params.slot_code,
        province_id: params.province_id,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in assignHomepageSlot:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}

/**
 * Deactivates an active homepage slot assignment without deleting the slot or content.
 */
export async function deactivateHomepageSlot(slotId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const isAuthorized = await checkUserIsAdminOrEditor();
    if (!isAuthorized) {
      return { success: false, error: 'No posee privilegios de administrador o editor federal para esta acción.' };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    const supabase = getSupabaseClient(token);

    const { data: updated, error } = await supabase
      .from('homepage_slots')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', slotId)
      .select(`
        *,
        contents:content_id(title)
      `)
      .maybeSingle();

    if (error) {
      console.error('Error deactivating slot:', error);
      return { success: false, error: error.message };
    }

    if (!updated) {
      return { success: false, error: 'Asignación de portada no encontrada.' };
    }

    // Log activity
    await logAdminActivity({
      action_type: 'update',
      entity_type: 'content',
      entity_id: updated.content_id,
      entity_label: updated.contents?.title || 'Contenido',
      metadata: {
        action: 'deactivate_homepage_slot',
        slot_id: slotId,
        slot_code: updated.slot_code,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in deactivateHomepageSlot:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}

/**
 * Reorders slots by setting sort_order.
 */
export async function reorderHomepageSlots(slotsOrders: { id: string; sort_order: number }[]): Promise<{ success: boolean; error?: string }> {
  try {
    const isAuthorized = await checkUserIsAdminOrEditor();
    if (!isAuthorized) {
      return { success: false, error: 'No posee privilegios de administrador o editor federal para esta acción.' };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    const supabase = getSupabaseClient(token);

    // Run updates sequentially
    for (const update of slotsOrders) {
      const { error } = await supabase
        .from('homepage_slots')
        .update({ sort_order: update.sort_order, updated_at: new Date().toISOString() })
        .eq('id', update.id);

      if (error) {
        console.error(`Error updating sort_order for slot ${update.id}:`, error);
        return { success: false, error: `Error al reordenar slot: ${error.message}` };
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in reorderHomepageSlots:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}
