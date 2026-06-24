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

export interface ContentVersion {
  id: string;
  content_id: string;
  version_number: number;
  title: string;
  subtitle: string | null;
  summary: string | null;
  body: string | null;
  content_type_id: string | null;
  category_id: string | null;
  institution_id: string | null;
  author_profile_id: string | null;
  region_id: string | null;
  province_id: string | null;
  municipality_id: string | null;
  event_date: string | null;
  publish_date: string | null;
  status: string;
  visibility: string;
  is_featured: boolean;
  source_reference: string | null;
  metadata: Record<string, any>;
  change_summary: string | null;
  created_by_profile_id: string | null;
  created_at: string;
  created_by?: string;
}

/**
 * Fetches all versions for a given content.
 */
export async function getContentVersions(contentId: string): Promise<ContentVersion[]> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    const supabase = getSupabaseClient(token);

    const { data, error } = await supabase
      .from('content_versions')
      .select(`
        id,
        content_id,
        version_number,
        title,
        subtitle,
        summary,
        body,
        content_type_id,
        category_id,
        institution_id,
        author_profile_id,
        region_id,
        province_id,
        municipality_id,
        event_date,
        publish_date,
        status,
        visibility,
        is_featured,
        source_reference,
        metadata,
        change_summary,
        created_by_profile_id,
        created_at,
        profiles:created_by_profile_id(display_name)
      `)
      .eq('content_id', contentId)
      .order('version_number', { ascending: false });

    if (error) {
      console.error('Error fetching content versions:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      content_id: item.content_id,
      version_number: item.version_number,
      title: item.title,
      subtitle: item.subtitle,
      summary: item.summary,
      body: item.body,
      content_type_id: item.content_type_id,
      category_id: item.category_id,
      institution_id: item.institution_id,
      author_profile_id: item.author_profile_id,
      region_id: item.region_id,
      province_id: item.province_id,
      municipality_id: item.municipality_id,
      event_date: item.event_date,
      publish_date: item.publish_date,
      status: item.status,
      visibility: item.visibility,
      is_featured: item.is_featured,
      source_reference: item.source_reference,
      metadata: item.metadata || {},
      change_summary: item.change_summary,
      created_by_profile_id: item.created_by_profile_id,
      created_at: item.created_at,
      created_by: Array.isArray(item.profiles)
        ? item.profiles[0]?.display_name || 'Desconocido'
        : item.profiles?.display_name || 'Desconocido',
    })) as ContentVersion[];
  } catch (err) {
    console.error('Unexpected error in getContentVersions:', err);
    return [];
  }
}

/**
 * Fetches a single content version by version table id.
 */
export async function getContentVersionById(id: string): Promise<ContentVersion | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    const supabase = getSupabaseClient(token);

    const { data, error } = await supabase
      .from('content_versions')
      .select(`
        *,
        profiles:created_by_profile_id(display_name)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching content version by id:', error);
      return null;
    }

    if (!data) return null;

    const item = data as any;
    return {
      id: item.id,
      content_id: item.content_id,
      version_number: item.version_number,
      title: item.title,
      subtitle: item.subtitle,
      summary: item.summary,
      body: item.body,
      content_type_id: item.content_type_id,
      category_id: item.category_id,
      institution_id: item.institution_id,
      author_profile_id: item.author_profile_id,
      region_id: item.region_id,
      province_id: item.province_id,
      municipality_id: item.municipality_id,
      event_date: item.event_date,
      publish_date: item.publish_date,
      status: item.status,
      visibility: item.visibility,
      is_featured: item.is_featured,
      source_reference: item.source_reference,
      metadata: item.metadata || {},
      change_summary: item.change_summary,
      created_by_profile_id: item.created_by_profile_id,
      created_at: item.created_at,
      created_by: Array.isArray(item.profiles)
        ? item.profiles[0]?.display_name || 'Desconocido'
        : item.profiles?.display_name || 'Desconocido',
    } as ContentVersion;
  } catch (err) {
    console.error('Unexpected error in getContentVersionById:', err);
    return null;
  }
}

/**
 * Creates a snapshot of the current state of a content record in content_versions.
 * Safe next version calculation: finds max version_number for this content and increments by 1.
 */
export async function createContentSnapshot(
  contentId: string,
  changeSummary?: string | null
): Promise<{ success: boolean; versionNumber?: number; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    const supabase = getSupabaseClient(token);

    // 1. Fetch current content values
    const { data: content, error: fetchErr } = await supabase
      .from('contents')
      .select('*')
      .eq('id', contentId)
      .maybeSingle();

    if (fetchErr) {
      console.error('Error fetching content for snapshot:', fetchErr);
      return { success: false, error: fetchErr.message };
    }

    if (!content) {
      return { success: false, error: 'Content record not found.' };
    }

    // 2. Fetch the actor's profile id
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    let profileId: string | null = null;
    if (user && !authErr) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      if (profile) {
        profileId = profile.id;
      }
    }

    // 3. Find max version number safely for this content
    const { data: maxVer, error: maxVerErr } = await supabase
      .from('content_versions')
      .select('version_number')
      .eq('content_id', contentId)
      .order('version_number', { ascending: false })
      .limit(1);

    if (maxVerErr) {
      console.error('Error fetching max version number:', maxVerErr);
      return { success: false, error: maxVerErr.message };
    }

    const nextVer = maxVer && maxVer.length > 0 ? maxVer[0].version_number + 1 : 1;

    // 4. Insert version record
    const { error: insertErr } = await supabase
      .from('content_versions')
      .insert({
        content_id: contentId,
        version_number: nextVer,
        title: content.title,
        subtitle: content.subtitle,
        summary: content.summary,
        body: content.body,
        content_type_id: content.content_type_id,
        category_id: content.category_id,
        institution_id: content.institution_id,
        author_profile_id: content.author_profile_id,
        region_id: content.region_id,
        province_id: content.province_id,
        municipality_id: content.municipality_id,
        event_date: content.event_date,
        publish_date: content.publish_date,
        status: content.status,
        visibility: content.visibility,
        is_featured: content.is_featured,
        source_reference: content.source_reference,
        metadata: {
          category_slug: content.category_slug || null,
          content_type_code: content.content_type_code || null,
        },
        change_summary: changeSummary || null,
        created_by_profile_id: profileId,
      });

    if (insertErr) {
      console.error('Error inserting content snapshot version:', insertErr);
      return { success: false, error: insertErr.message };
    }

    return { success: true, versionNumber: nextVer };
  } catch (err: any) {
    console.error('Unexpected error in createContentSnapshot:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}

/**
 * Restores a specific content version.
 * First saves a snapshot of the current state, then updates the main content record
 * with the version's values, preserving all versions history.
 */
export async function restoreContentVersion(
  versionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    const supabase = getSupabaseClient(token);

    // 1. Fetch version detail
    const version = await getContentVersionById(versionId);
    if (!version) {
      return { success: false, error: 'La versión seleccionada no existe.' };
    }

    // 2. Save current content state first as a snapshot
    const snapshotRes = await createContentSnapshot(
      version.content_id,
      `Copia de seguridad previa a la restauración de la versión ${version.version_number}`
    );

    if (!snapshotRes.success) {
      return { success: false, error: `No se pudo crear copia de seguridad: ${snapshotRes.error}` };
    }

    // 3. Update the main contents table with version data
    const { error: updateErr } = await supabase
      .from('contents')
      .update({
        title: version.title,
        subtitle: version.subtitle,
        summary: version.summary,
        body: version.body,
        content_type_id: version.content_type_id,
        category_id: version.category_id,
        institution_id: version.institution_id,
        author_profile_id: version.author_profile_id,
        region_id: version.region_id,
        province_id: version.province_id,
        municipality_id: version.municipality_id,
        event_date: version.event_date,
        publish_date: version.publish_date,
        status: version.status,
        visibility: version.visibility,
        is_featured: version.is_featured,
        source_reference: version.source_reference,
      })
      .eq('id', version.content_id);

    if (updateErr) {
      console.error('Error updating main content on restore:', updateErr);
      return { success: false, error: updateErr.message };
    }

    // 4. Log administrative activity
    await logAdminActivity({
      action_type: 'update',
      entity_type: 'content',
      entity_id: version.content_id,
      entity_label: version.title,
      metadata: {
        action: 'restore_version',
        restored_version_number: version.version_number,
        restored_version_id: version.id,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in restoreContentVersion:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}
