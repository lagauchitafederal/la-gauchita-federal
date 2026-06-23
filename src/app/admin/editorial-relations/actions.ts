'use server';

import {
  searchAvailableEntities,
  createEditorialRelation,
  updateEditorialRelation,
  deleteEditorialRelation,
  NewEditorialRelation
} from '../../../lib/admin/admin-editorial-relations';
import { revalidatePath } from 'next/cache';

/**
 * Revalidates relevant edit page paths based on entity type.
 */
function revalidateEntityPath(entityType: string, entityId: string) {
  if (entityType === 'person') {
    revalidatePath(`/admin/personajes/${entityId}/editar`);
  } else if (entityType === 'content') {
    revalidatePath(`/admin/efemerides/${entityId}/editar`);
    revalidatePath(`/admin/contenidos/${entityId}/editar`);
  }
}

export async function searchAvailableEntitiesAction(type: string, query: string) {
  try {
    return await searchAvailableEntities(type, query);
  } catch (err: any) {
    console.error('Error in searchAvailableEntitiesAction:', err);
    return [];
  }
}

export async function createEditorialRelationAction(
  entityType: string,
  entityId: string,
  relation: NewEditorialRelation
) {
  try {
    const res = await createEditorialRelation(relation);
    if (res.success) {
      // Revalidate path for the current editing entity
      revalidateEntityPath(entityType, entityId);
      
      // Also revalidate path for the related entity if applicable
      revalidateEntityPath(relation.target_entity_type, relation.target_entity_id);
      revalidateEntityPath(relation.source_entity_type, relation.source_entity_id);
    }
    return res;
  } catch (err: any) {
    console.error('Error in createEditorialRelationAction:', err);
    return { success: false, error: err.message || 'Error al guardar la relación.' };
  }
}

export async function updateEditorialRelationAction(
  id: string,
  entityType: string,
  entityId: string,
  relation: {
    relation_type: string;
    sort_order: number;
    status: string;
    visibility: string;
    metadata?: any;
    target_entity_type?: string;
    target_entity_id?: string;
  }
) {
  try {
    const res = await updateEditorialRelation(id, {
      relation_type: relation.relation_type,
      sort_order: relation.sort_order,
      status: relation.status,
      visibility: relation.visibility,
      metadata: relation.metadata,
    });
    if (res.success) {
      revalidateEntityPath(entityType, entityId);
      if (relation.target_entity_type && relation.target_entity_id) {
        revalidateEntityPath(relation.target_entity_type, relation.target_entity_id);
      }
    }
    return res;
  } catch (err: any) {
    console.error('Error in updateEditorialRelationAction:', err);
    return { success: false, error: err.message || 'Error al actualizar la relación.' };
  }
}

export async function deleteEditorialRelationAction(
  id: string,
  entityType: string,
  entityId: string,
  relatedType: string,
  relatedId: string
) {
  try {
    const res = await deleteEditorialRelation(id);
    if (res.success) {
      revalidateEntityPath(entityType, entityId);
      revalidateEntityPath(relatedType, relatedId);
    }
    return res;
  } catch (err: any) {
    console.error('Error in deleteEditorialRelationAction:', err);
    return { success: false, error: err.message || 'Error al eliminar la relación.' };
  }
}
