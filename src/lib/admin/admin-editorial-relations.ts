import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../supabase/env';

export interface EditorialRelationWithDetail {
  id: string;
  source_entity_type: string;
  source_entity_id: string;
  target_entity_type: string;
  target_entity_id: string;
  relation_type: string;
  sort_order: number;
  status: string;
  visibility: string;
  metadata: any;
  created_at: string;
  
  // Mapped details of the related entity
  related_type: string;
  related_id: string;
  related_label: string;
  related_slug?: string;
  edit_url?: string;
}

export interface NewEditorialRelation {
  source_entity_type: string;
  source_entity_id: string;
  target_entity_type: string;
  target_entity_id: string;
  relation_type: string;
  sort_order: number;
  status: string;
  visibility: string;
  metadata?: any;
}

/**
 * Normalizes source and target for symmetric relations ('relacionado_con')
 * by ordering them alphabetically by UUID.
 */
export function normalizeSymmetricRelation(relation: NewEditorialRelation): NewEditorialRelation {
  if (relation.relation_type !== 'relacionado_con') {
    return relation;
  }

  // Compare UUIDs alphabetically
  if (relation.source_entity_id > relation.target_entity_id) {
    return {
      ...relation,
      source_entity_type: relation.target_entity_type,
      source_entity_id: relation.target_entity_id,
      target_entity_type: relation.source_entity_type,
      target_entity_id: relation.source_entity_id,
    };
  }

  return relation;
}

/**
 * Fetches all editorial relations for a given entity, mapping related entities' titles.
 */
export async function getEditorialRelationsForEntity(
  entityType: string,
  entityId: string
): Promise<EditorialRelationWithDetail[]> {
  try {
    const { supabaseUrl, supabaseAnonKey } = getEnv();
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      auth: {
        persistSession: false,
      },
    });

    // 1. Fetch matching relations where this entity is either source or target
    const { data: relations, error } = await supabase
      .from('editorial_relations')
      .select('*')
      .or(`and(source_entity_type.eq.${entityType},source_entity_id.eq.${entityId}),and(target_entity_type.eq.${entityType},target_entity_id.eq.${entityId})`)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching editorial relations:', error);
      throw error;
    }

    if (!relations || relations.length === 0) {
      return [];
    }

    // 2. Identify the "other" entity in each relation and group their IDs to batch load labels
    const idsByType: Record<string, string[]> = {
      content: [],
      person: [],
      institution: [],
      recognition: [],
      media_asset: [],
    };

    const relationList = relations.map((rel: any) => {
      const isSource = rel.source_entity_type === entityType && rel.source_entity_id === entityId;
      const relatedType = isSource ? rel.target_entity_type : rel.source_entity_type;
      const relatedId = isSource ? rel.target_entity_id : rel.source_entity_id;

      if (idsByType[relatedType]) {
        idsByType[relatedType].push(relatedId);
      }

      return {
        ...rel,
        related_type: relatedType,
        related_id: relatedId,
        related_label: 'Cargando...',
      };
    });

    // 3. Batch load labels/slugs from target tables
    const detailsMap: Record<string, { label: string; slug?: string }> = {};

    await Promise.all([
      // Contents
      idsByType.content.length > 0
        ? supabase
            .from('contents')
            .select('id, title, slug')
            .in('id', idsByType.content)
            .then(({ data }) => {
              (data || []).forEach((d) => {
                detailsMap[d.id] = { label: d.title, slug: d.slug };
              });
            })
        : Promise.resolve(),
      // People
      idsByType.person.length > 0
        ? supabase
            .from('people')
            .select('id, full_name, slug')
            .in('id', idsByType.person)
            .then(({ data }) => {
              (data || []).forEach((d) => {
                detailsMap[d.id] = { label: d.full_name, slug: d.slug };
              });
            })
        : Promise.resolve(),
      // Institutions
      idsByType.institution.length > 0
        ? supabase
            .from('institutions')
            .select('id, name, slug')
            .in('id', idsByType.institution)
            .then(({ data }) => {
              (data || []).forEach((d) => {
                detailsMap[d.id] = { label: d.name, slug: d.slug };
              });
            })
        : Promise.resolve(),
      // Recognitions
      idsByType.recognition.length > 0
        ? supabase
            .from('recognitions')
            .select('id, title, slug')
            .in('id', idsByType.recognition)
            .then(({ data }) => {
              (data || []).forEach((d) => {
                detailsMap[d.id] = { label: d.title, slug: d.slug };
              });
            })
        : Promise.resolve(),
      // Media Assets
      idsByType.media_asset.length > 0
        ? supabase
            .from('media_assets')
            .select('id, title, storage_path')
            .in('id', idsByType.media_asset)
            .then(({ data }) => {
              (data || []).forEach((d) => {
                detailsMap[d.id] = { label: d.title || d.storage_path };
              });
            })
        : Promise.resolve(),
    ]);

    // 4. Map names, slugs and admin URLs back to the list
    return relationList.map((rel) => {
      const detail = detailsMap[rel.related_id];
      const label = detail ? detail.label : `ID: ${rel.related_id.substring(0, 8)}...`;
      const slug = detail?.slug;

      let editUrl = '';
      if (rel.related_type === 'content') {
        editUrl = `/admin/contenidos/${rel.related_id}/editar`;
      } else if (rel.related_type === 'person') {
        editUrl = `/admin/personajes/${rel.related_id}/editar`;
      } else if (rel.related_type === 'institution') {
        editUrl = `/admin/instituciones/${rel.related_id}/editar`;
      } else if (rel.related_type === 'recognition') {
        editUrl = `/admin/reconocimientos/${rel.related_id}/editar`;
      } else if (rel.related_type === 'media_asset') {
        editUrl = `/admin/archivo/${rel.related_id}/editar`;
      }

      return {
        ...rel,
        related_label: label,
        related_slug: slug,
        edit_url: editUrl,
      };
    }) as EditorialRelationWithDetail[];
  } catch (err) {
    console.error('Unexpected error in getEditorialRelationsForEntity:', err);
    throw err;
  }
}

/**
 * Searches for target entities by name/title for relation picker.
 */
export async function searchAvailableEntities(
  type: string,
  query: string
): Promise<{ id: string; label: string; slug?: string; contentTypeCode?: string }[]> {
  try {
    if (!query || query.trim().length < 1) return [];
    
    const { supabaseUrl, supabaseAnonKey } = getEnv();
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      auth: {
        persistSession: false,
      },
    });

    const searchQuery = `%${query.trim()}%`;

    if (type === 'content') {
      const { data, error } = await supabase
        .from('contents')
        .select('id, title, slug, content_types(code)')
        .ilike('title', searchQuery)
        .limit(10);
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        label: d.title,
        slug: d.slug,
        contentTypeCode: d.content_types?.code,
      }));
    }

    if (type === 'person') {
      const { data, error } = await supabase
        .from('people')
        .select('id, full_name, slug')
        .ilike('full_name', searchQuery)
        .limit(10);
      if (error) throw error;
      return (data || []).map((d) => ({ id: d.id, label: d.full_name, slug: d.slug }));
    }

    if (type === 'institution') {
      const { data, error } = await supabase
        .from('institutions')
        .select('id, name, slug')
        .ilike('name', searchQuery)
        .limit(10);
      if (error) throw error;
      return (data || []).map((d) => ({ id: d.id, label: d.name, slug: d.slug }));
    }

    if (type === 'recognition') {
      const { data, error } = await supabase
        .from('recognitions')
        .select('id, title, slug')
        .ilike('title', searchQuery)
        .limit(10);
      if (error) throw error;
      return (data || []).map((d) => ({ id: d.id, label: d.title, slug: d.slug }));
    }

    if (type === 'media_asset') {
      const { data, error } = await supabase
        .from('media_assets')
        .select('id, title, storage_path, original_filename')
        .or(`title.ilike.${searchQuery},storage_path.ilike.${searchQuery},original_filename.ilike.${searchQuery}`)
        .limit(10);
      if (error) throw error;
      return (data || []).map((d) => ({
        id: d.id,
        label: d.title || d.original_filename || d.storage_path,
      }));
    }

    return [];
  } catch (err) {
    console.error('Error in searchAvailableEntities:', err);
    return [];
  }
}

/**
 * Creates a new editorial relation.
 */
export async function createEditorialRelation(
  relation: NewEditorialRelation
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalized = normalizeSymmetricRelation(relation);

    // Prevent self relations
    if (normalized.source_entity_type === normalized.target_entity_type && normalized.source_entity_id === normalized.target_entity_id) {
      return { success: false, error: 'No se puede relacionar una entidad consigo misma.' };
    }

    const { supabaseUrl, supabaseAnonKey } = getEnv();
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      auth: {
        persistSession: false,
      },
    });

    // Check if relationship already exists
    const { data: exists } = await supabase
      .from('editorial_relations')
      .select('id')
      .eq('source_entity_type', normalized.source_entity_type)
      .eq('source_entity_id', normalized.source_entity_id)
      .eq('target_entity_type', normalized.target_entity_type)
      .eq('target_entity_id', normalized.target_entity_id)
      .eq('relation_type', normalized.relation_type)
      .maybeSingle();

    if (exists) {
      return { success: false, error: 'Esta relación editorial ya existe.' };
    }

    // Get current profile id for created_by_profile_id
    const { data: { user } } = await supabase.auth.getUser();
    let profileId: string | null = null;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      if (profile) {
        profileId = profile.id;
      }
    }

    const { error } = await supabase
      .from('editorial_relations')
      .insert([{
        ...normalized,
        created_by_profile_id: profileId,
      }]);

    if (error) {
      console.error('Error inserting editorial relation:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in createEditorialRelation:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}

/**
 * Updates an existing editorial relation.
 */
export async function updateEditorialRelation(
  id: string,
  updatedData: {
    relation_type: string;
    sort_order: number;
    status: string;
    visibility: string;
    metadata?: any;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabaseUrl, supabaseAnonKey } = getEnv();
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      auth: {
        persistSession: false,
      },
    });

    const { error } = await supabase
      .from('editorial_relations')
      .update({
        ...updatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating editorial relation:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in updateEditorialRelation:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}

/**
 * Deletes an editorial relation.
 */
export async function deleteEditorialRelation(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabaseUrl, supabaseAnonKey } = getEnv();
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      auth: {
        persistSession: false,
      },
    });

    const { error } = await supabase
      .from('editorial_relations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting editorial relation:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in deleteEditorialRelation:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}
