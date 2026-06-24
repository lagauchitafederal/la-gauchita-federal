import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../supabase/env';
import { logAdminActivity } from './admin-activity';

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

export interface EditorialAssignment {
  id: string;
  entity_type: string;
  entity_id: string;
  assigned_to_profile_id: string;
  assigned_by_profile_id: string | null;
  notes: string | null;
  due_date: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_to_name?: string;
  assigned_by_name?: string;
  content_title?: string;
  content_slug?: string;
}

export interface AdminProfile {
  id: string;
  display_name: string | null;
}

/**
 * Helper to check if the current user has administrative permissions (super_admin, general_admin, federal_editor)
 */
export async function checkUserIsAdminOrEditor(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    if (!token) return false;
    const supabase = getSupabaseClient(token);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, status')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!profile || profile.status !== 'active') return false;

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('roles(code)')
      .eq('profile_id', profile.id);

    const roles = userRoles || [];
    return roles.some((ur: any) => {
      const code = Array.isArray(ur.roles) ? ur.roles[0]?.code : ur.roles?.code;
      return ['super_admin', 'general_admin', 'federal_editor'].includes(code);
    });
  } catch (err) {
    console.error('Error in checkUserIsAdminOrEditor:', err);
    return false;
  }
}

/**
 * Lists assignments associated with a given content ID.
 */
export async function getAssignmentsByContent(contentId: string): Promise<EditorialAssignment[]> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    const supabase = getSupabaseClient(token);

    const { data, error } = await supabase
      .from('editorial_assignments')
      .select(`
        *,
        assigned_to:assigned_to_profile_id(display_name),
        assigned_by:assigned_by_profile_id(display_name)
      `)
      .eq('entity_id', contentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assignments by content:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      ...item,
      assigned_to_name: item.assigned_to?.display_name || 'Desconocido',
      assigned_by_name: item.assigned_by?.display_name || 'Sistema',
    })) as EditorialAssignment[];
  } catch (err) {
    console.error('Unexpected error in getAssignmentsByContent:', err);
    return [];
  }
}

/**
 * Lists open and in-progress assignments assigned to the current user.
 */
export async function getUserAssignments(): Promise<EditorialAssignment[]> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    const supabase = getSupabaseClient(token);

    // 1. Get current auth user profile id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!profile) return [];

    // 2. Fetch assignments where user is assigned_to and status is active
    const { data, error } = await supabase
      .from('editorial_assignments')
      .select(`
        *,
        contents:entity_id(title, slug),
        assigned_by:assigned_by_profile_id(display_name)
      `)
      .eq('assigned_to_profile_id', profile.id)
      .in('status', ['pending', 'in_progress'])
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching user assignments:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      ...item,
      content_title: item.contents?.title || 'Contenido Desconocido',
      content_slug: item.contents?.slug || '',
      assigned_by_name: item.assigned_by?.display_name || 'Sistema',
    })) as EditorialAssignment[];
  } catch (err) {
    console.error('Unexpected error in getUserAssignments:', err);
    return [];
  }
}

/**
 * Lists all active assignments (pending/in_progress) across the platform (for editorial board).
 */
export async function getOpenAssignments(): Promise<EditorialAssignment[]> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    const supabase = getSupabaseClient(token);

    const { data, error } = await supabase
      .from('editorial_assignments')
      .select(`
        *,
        contents:entity_id(title, slug),
        assigned_to:assigned_to_profile_id(display_name),
        assigned_by:assigned_by_profile_id(display_name)
      `)
      .in('status', ['pending', 'in_progress'])
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching open assignments:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      ...item,
      content_title: item.contents?.title || 'Contenido Desconocido',
      content_slug: item.contents?.slug || '',
      assigned_to_name: item.assigned_to?.display_name || 'Desconocido',
      assigned_by_name: item.assigned_by?.display_name || 'Sistema',
    })) as EditorialAssignment[];
  } catch (err) {
    console.error('Unexpected error in getOpenAssignments:', err);
    return [];
  }
}

/**
 * Creates a new editorial assignment. Prevents active duplicate assignments.
 */
export async function createAssignment(params: {
  entity_id: string;
  assigned_to_profile_id: string;
  notes?: string | null;
  due_date?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const isAuthorized = await checkUserIsAdminOrEditor();
    if (!isAuthorized) {
      return {
        success: false,
        error: 'No posee permisos administrativos para realizar esta acción.',
      };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    const supabase = getSupabaseClient(token);

    // 1. Check for active duplicates (same user, same content, status pending or in_progress)
    const { data: duplicate } = await supabase
      .from('editorial_assignments')
      .select('id')
      .eq('entity_id', params.entity_id)
      .eq('assigned_to_profile_id', params.assigned_to_profile_id)
      .in('status', ['pending', 'in_progress'])
      .maybeSingle();

    if (duplicate) {
      return {
        success: false,
        error: 'El usuario seleccionado ya posee una tarea activa para este contenido.',
      };
    }

    // 2. Fetch the current creator's profile id
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

    // 3. Insert assignment
    const { data: newAssignment, error: insertErr } = await supabase
      .from('editorial_assignments')
      .insert({
        entity_type: 'content',
        entity_id: params.entity_id,
        assigned_to_profile_id: params.assigned_to_profile_id,
        assigned_by_profile_id: assignerId,
        notes: params.notes || null,
        due_date: params.due_date || null,
        status: 'pending',
      })
      .select(`
        *,
        contents:entity_id(title)
      `)
      .maybeSingle();

    if (insertErr) {
      console.error('Error creating assignment:', insertErr);
      return { success: false, error: insertErr.message };
    }

    // 4. Log administrative activity
    const contentTitle = newAssignment?.contents?.title || 'Contenido';
    await logAdminActivity({
      action_type: 'update',
      entity_type: 'content',
      entity_id: params.entity_id,
      entity_label: contentTitle,
      metadata: {
        action: 'create_assignment',
        assignment_id: newAssignment?.id,
        assigned_to: params.assigned_to_profile_id,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in createAssignment:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}

/**
 * Updates status, notes, and due date of an assignment.
 * Sets completed_at if status changes to completed.
 */
export async function updateAssignmentStatus(
  assignmentId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled',
  notes?: string | null,
  dueDate?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const isAuthorized = await checkUserIsAdminOrEditor();
    if (!isAuthorized) {
      return {
        success: false,
        error: 'No posee permisos administrativos para realizar esta acción.',
      };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    const supabase = getSupabaseClient(token);

    const updateFields: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (notes !== undefined) {
      updateFields.notes = notes;
    }
    if (dueDate !== undefined) {
      updateFields.due_date = dueDate;
    }

    if (status === 'completed') {
      updateFields.completed_at = new Date().toISOString();
    } else {
      updateFields.completed_at = null;
    }

    const { data: updated, error } = await supabase
      .from('editorial_assignments')
      .update(updateFields)
      .eq('id', assignmentId)
      .select(`
        *,
        contents:entity_id(title)
      `)
      .maybeSingle();

    if (error) {
      console.error('Error updating assignment status:', error);
      return { success: false, error: error.message };
    }

    if (!updated) {
      return { success: false, error: 'Asignación no encontrada.' };
    }

    // Log administrative activity
    const actionLabel = 
      status === 'completed' ? 'Asignación editorial completada' : 
      status === 'cancelled' ? 'Asignación editorial cancelada' : 
      'Asignación editorial actualizada';

    await logAdminActivity({
      action_type: 'update',
      entity_type: 'content',
      entity_id: updated.entity_id,
      entity_label: updated.contents?.title || 'Contenido',
      metadata: {
        action: 'update_assignment',
        assignment_id: assignmentId,
        status_nuevo: status,
        action_label: actionLabel,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in updateAssignmentStatus:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}

/**
 * Helper to get active administrative profiles (super_admin, general_admin, federal_editor)
 * to assign tasks.
 */
export async function getAdministrativeProfiles(): Promise<AdminProfile[]> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    const supabase = getSupabaseClient(token);

    // Fetch all active profiles
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        display_name,
        user_roles(roles(code))
      `)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching administrative profiles:', error);
      return [];
    }

    const adminRoles = ['super_admin', 'general_admin', 'federal_editor'];

    // Filter profiles that have at least one administrative role
    const filtered = (data || []).filter((profile: any) => {
      const roles = profile.user_roles || [];
      return roles.some((ur: any) => {
        const code = ur.roles?.code;
        return adminRoles.includes(code);
      });
    });

    return filtered.map((p) => ({
      id: p.id,
      display_name: p.display_name || 'Usuario sin nombre',
    }));
  } catch (err) {
    console.error('Unexpected error in getAdministrativeProfiles:', err);
    return [];
  }
}
