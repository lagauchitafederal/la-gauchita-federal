import { createServerSupabaseClient } from '../supabase/server';

export interface PublicRelationDetail {
  id: string;
  relationType: string;
  relatedType: 'content' | 'person' | 'institution' | 'recognition' | 'media_asset' | 'magazine_edition';
  relatedId: string;
  title: string;
  description: string | null;
  href: string | null;
  contentTypeCode?: string | null;
}

/**
 * Fetches and resolves public, active editorial relations for a given entity.
 * Prevents N+1 queries by batch loading details and enforces RLS/public visibility filters.
 */
export async function getPublicEditorialRelations(
  entityType: 'person' | 'content' | 'institution' | 'recognition' | 'magazine_edition',
  entityId: string
): Promise<PublicRelationDetail[]> {
  try {
    const supabase = createServerSupabaseClient();

    // 1. Fetch relations where current entity is source or target
    const { data: relations, error } = await supabase
      .from('editorial_relations')
      .select('*')
      .or(`and(source_entity_type.eq.${entityType},source_entity_id.eq.${entityId}),and(target_entity_type.eq.${entityType},target_entity_id.eq.${entityId})`)
      .eq('status', 'active')
      .eq('visibility', 'public')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching public editorial relations:', error);
      return [];
    }

    if (!relations || relations.length === 0) {
      return [];
    }

    // 2. Group related IDs by entity type to fetch details in batch
    const idsByType: Record<string, string[]> = {
      content: [],
      person: [],
      institution: [],
      recognition: [],
      media_asset: [],
      magazine_edition: [],
    };

    const tempRelations = relations.map((rel: any) => {
      const isSource = rel.source_entity_type === entityType && rel.source_entity_id === entityId;
      const relatedType = isSource ? rel.target_entity_type : rel.source_entity_type;
      const relatedId = isSource ? rel.target_entity_id : rel.source_entity_id;

      if (idsByType[relatedType]) {
        idsByType[relatedType].push(relatedId);
      }

      return {
        id: rel.id,
        relationType: rel.relation_type,
        relatedType: relatedType as 'content' | 'person' | 'institution' | 'recognition' | 'media_asset' | 'magazine_edition',
        relatedId,
      };
    });

    // 3. Batch load details from the target tables in parallel
    const detailsMap: Record<
      string,
      { title: string; description: string | null; href: string | null; contentTypeCode?: string | null }
    > = {};

    await Promise.all([
      // Contents (published & public)
      idsByType.content.length > 0
        ? supabase
            .from('contents')
            .select('id, title, slug, summary, content_types(code)')
            .in('id', idsByType.content)
            .eq('status', 'published')
            .eq('visibility', 'public')
            .then(({ data }) => {
              (data || []).forEach((d: any) => {
                detailsMap[d.id] = {
                  title: d.title,
                  description: d.summary,
                  href: `/contenidos/${d.slug}`,
                  contentTypeCode: d.content_types?.code,
                };
              });
            })
        : Promise.resolve(),

      // People (published & public)
      idsByType.person.length > 0
        ? supabase
            .from('people')
            .select('id, full_name, slug, short_bio')
            .in('id', idsByType.person)
            .eq('status', 'published')
            .eq('visibility', 'public')
            .then(({ data }) => {
              (data || []).forEach((d) => {
                detailsMap[d.id] = {
                  title: d.full_name,
                  description: d.short_bio,
                  href: `/personajes/${d.slug}`,
                  contentTypeCode: null,
                };
              });
            })
        : Promise.resolve(),

      // Institutions (active)
      idsByType.institution.length > 0
        ? supabase
            .from('institutions')
            .select('id, name, slug, description')
            .in('id', idsByType.institution)
            .eq('status', 'active')
            .then(({ data }) => {
              (data || []).forEach((d) => {
                detailsMap[d.id] = {
                  title: d.name,
                  description: d.description,
                  href: `/instituciones/${d.slug}`,
                  contentTypeCode: null,
                };
              });
            })
        : Promise.resolve(),

      // Recognitions (active & public)
      idsByType.recognition.length > 0
        ? supabase
            .from('recognitions')
            .select('id, title, slug, description')
            .in('id', idsByType.recognition)
            .eq('status', 'active')
            .eq('visibility', 'public')
            .then(({ data }) => {
              (data || []).forEach((d) => {
                detailsMap[d.id] = {
                  title: d.title,
                  description: d.description,
                  href: `/reconocimientos/${d.slug}`,
                  contentTypeCode: null,
                };
              });
            })
        : Promise.resolve(),

      // Media Assets (active & public)
      idsByType.media_asset.length > 0
        ? supabase
            .from('media_assets')
            .select('id, title, description, storage_path, bucket_name')
            .in('id', idsByType.media_asset)
            .eq('status', 'active')
            .eq('visibility', 'public')
            .then(({ data }) => {
              (data || []).forEach((d) => {
                detailsMap[d.id] = {
                  title: d.title || 'Archivo Adjunto',
                  description: d.description,
                  href: null, // No public details route for media assets
                  contentTypeCode: null,
                };
              });
            })
        : Promise.resolve(),

      // Magazine Editions (published & public)
      idsByType.magazine_edition.length > 0
        ? supabase
            .from('magazine_editions')
            .select('id, title, slug, description, edition_number')
            .in('id', idsByType.magazine_edition)
            .eq('status', 'published')
            .eq('visibility', 'public')
            .then(({ data }) => {
              (data || []).forEach((d) => {
                detailsMap[d.id] = {
                  title: d.title || `Edición Nº ${d.edition_number}`,
                  description: d.description,
                  href: `/revista/${d.slug}`,
                  contentTypeCode: null,
                };
              });
            })
        : Promise.resolve(),
    ]);

    // 4. Map back to details and filter out inactive/private targets, deduplicating entities
    const seenEntities = new Set<string>();
    const result: PublicRelationDetail[] = [];

    for (const rel of tempRelations) {
      const detail = detailsMap[rel.relatedId];
      if (!detail) {
        // Related entity is either private, inactive, draft, or deleted
        continue;
      }

      const entityKey = `${rel.relatedType}_${rel.relatedId}`;
      if (seenEntities.has(entityKey)) {
        continue;
      }
      seenEntities.add(entityKey);

      result.push({
        id: rel.id,
        relationType: rel.relationType,
        relatedType: rel.relatedType,
        relatedId: rel.relatedId,
        title: detail.title,
        description: detail.description,
        href: detail.href,
        contentTypeCode: detail.contentTypeCode,
      });
    }

    return result;
  } catch (err) {
    console.error('Unexpected error in getPublicEditorialRelations:', err);
    return [];
  }
}
