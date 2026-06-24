import { createServerSupabaseClient } from '../supabase/server';
import { getPublicMediaUrl } from '../utils/media-url';

export interface CleanMediaAsset {
  key: string;
  url: string;
  title: string;
  description: string | null;
  asset_type: string;
  mime_type: string | null;
  alt_text: string | null;
  credit: string | null;
  source_reference: string | null;
  rights_status: string;
  sort_order: number;
  created_at: string;
  bucket_name: string;
  storage_path: string;
}

export interface CategorizedMedia {
  mainImage: CleanMediaAsset | null;
  gallery: CleanMediaAsset[];
  audio: CleanMediaAsset[];
  documents: CleanMediaAsset[];
  archive: CleanMediaAsset[];
}

/**
 * Retrieves and categorizes all public, active, and authorized media assets associated with a content ID,
 * combining direct relationships (media_assets.content_id) and polymorphic relationships (editorial_relations).
 * Deduplicates by ID, enforces public RLS filters, and orders by sort_order and creation date.
 */
export async function getPublicContentMedia(contentId: string): Promise<CategorizedMedia> {
  const categories: CategorizedMedia = {
    mainImage: null,
    gallery: [],
    audio: [],
    documents: [],
    archive: []
  };

  try {
    const supabase = createServerSupabaseClient();

    // 1. Fetch direct assets
    const { data: directData, error: directError } = await supabase
      .from('media_assets')
      .select('id, title, description, asset_type, bucket_name, storage_path, alt_text, credit, source_reference, rights_status, sort_order, created_at, mime_type')
      .eq('content_id', contentId)
      .eq('status', 'active')
      .eq('visibility', 'public')
      .in('rights_status', ['owned', 'authorized', 'public_domain', 'licensed']);

    if (directError) {
      console.error('Error fetching direct media assets:', directError);
    }

    // 2. Fetch polymorphic assets linked via editorial_relations
    const { data: rels, error: relsError } = await supabase
      .from('editorial_relations')
      .select('target_entity_id, source_entity_id, source_entity_type, target_entity_type')
      .or(`and(source_entity_type.eq.content,source_entity_id.eq.${contentId},target_entity_type.eq.media_asset),and(target_entity_type.eq.content,target_entity_id.eq.${contentId},source_entity_type.eq.media_asset)`)
      .eq('status', 'active')
      .eq('visibility', 'public');

    if (relsError) {
      console.error('Error fetching editorial relations for media assets:', relsError);
    }

    const linkedIds = new Set<string>();
    if (rels && rels.length > 0) {
      rels.forEach((r: any) => {
        if (r.source_entity_type === 'media_asset') {
          linkedIds.add(r.source_entity_id);
        } else if (r.target_entity_type === 'media_asset') {
          linkedIds.add(r.target_entity_id);
        }
      });
    }

    let relatedData: any[] = [];
    if (linkedIds.size > 0) {
      const { data: relAssets, error: relAssetsError } = await supabase
        .from('media_assets')
        .select('id, title, description, asset_type, bucket_name, storage_path, alt_text, credit, source_reference, rights_status, sort_order, created_at, mime_type')
        .in('id', Array.from(linkedIds))
        .eq('status', 'active')
        .eq('visibility', 'public')
        .in('rights_status', ['owned', 'authorized', 'public_domain', 'licensed']);

      if (relAssetsError) {
        console.error('Error fetching related media assets:', relAssetsError);
      } else if (relAssets) {
        relatedData = relAssets;
      }
    }

    // Combine and deduplicate by id
    const allAssetsMap = new Map<string, any>();
    if (directData) {
      directData.forEach((item: any) => allAssetsMap.set(item.id, item));
    }
    relatedData.forEach((item: any) => allAssetsMap.set(item.id, item));

    const combinedList = Array.from(allAssetsMap.values());

    // Sort by sort_order ascending, then by created_at descending
    combinedList.sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

    // Map to clean format and categorize
    combinedList.forEach((item: any) => {
      const url = getPublicMediaUrl(item.bucket_name, item.storage_path);
      if (!url) return;

      const cleanAsset: CleanMediaAsset = {
        key: url, // Clean key, does not expose DB UUID to the presentation component
        url,
        title: item.title || '',
        description: item.description || null,
        asset_type: item.asset_type,
        mime_type: item.mime_type || null,
        alt_text: item.alt_text || null,
        credit: item.credit || null,
        source_reference: item.source_reference || null,
        rights_status: item.rights_status,
        sort_order: item.sort_order,
        created_at: item.created_at,
        bucket_name: item.bucket_name,
        storage_path: item.storage_path
      };

      const isImage = ['cover_image', 'content_image', 'gallery_image', 'historical_photo'].includes(item.asset_type);

      if (isImage) {
        if (!categories.mainImage) {
          categories.mainImage = cleanAsset;
        } else {
          categories.gallery.push(cleanAsset);
        }
      } else if (item.asset_type === 'audio') {
        categories.audio.push(cleanAsset);
      } else if (['pdf_document', 'magazine_pdf', 'book_pdf', 'teacher_resource', 'institutional_document', 'recognition_document'].includes(item.asset_type)) {
        categories.documents.push(cleanAsset);
      } else {
        categories.archive.push(cleanAsset);
      }
    });

  } catch (err) {
    console.error('Unexpected error in getPublicContentMedia:', err);
  }

  return categories;
}
