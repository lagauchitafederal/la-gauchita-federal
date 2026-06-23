import { createServerSupabaseClient } from '../supabase/server';
import { SelectedTerritory, getRelevanceScore } from './relevance';

export interface PublicPerson {
  id: string;
  full_name: string;
  slug: string;
  short_bio: string | null;
  biography: string | null;
  person_type: string;
  birth_date: string | null;
  death_date: string | null;
  region_id: string | null;
  province_id: string | null;
  municipality_id: string | null;
  main_image_asset_id: string | null;
  source_reference: string | null;
  is_featured: boolean;
  regions: { name: string } | null;
  provinces: { name: string } | null;
  municipalities: { name: string } | null;
  media_assets: { bucket_name: string; storage_path: string; title: string; alt_text: string | null } | null;
}

/**
 * Fetches all published and public characters, applying territorial relevance if a cookie context exists.
 */
export async function getPublishedPeople(territory?: SelectedTerritory): Promise<PublicPerson[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('people')
      .select(`
        id,
        full_name,
        slug,
        short_bio,
        biography,
        person_type,
        birth_date,
        death_date,
        region_id,
        province_id,
        municipality_id,
        main_image_asset_id,
        source_reference,
        is_featured,
        regions(name),
        provinces(name),
        municipalities(name),
        media_assets:main_image_asset_id(bucket_name, storage_path, title, alt_text)
      `)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('is_featured', { ascending: false })
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching published people:', error);
      return [];
    }

    let mapped = (data || []).map((item: any) => ({
      id: item.id,
      full_name: item.full_name,
      slug: item.slug,
      short_bio: item.short_bio,
      biography: item.biography,
      person_type: item.person_type,
      birth_date: item.birth_date,
      death_date: item.death_date,
      region_id: item.region_id,
      province_id: item.province_id,
      municipality_id: item.municipality_id,
      main_image_asset_id: item.main_image_asset_id,
      source_reference: item.source_reference,
      is_featured: item.is_featured,
      regions: Array.isArray(item.regions) ? item.regions[0] || null : item.regions || null,
      provinces: Array.isArray(item.provinces) ? item.provinces[0] || null : item.provinces || null,
      municipalities: Array.isArray(item.municipalities) ? item.municipalities[0] || null : item.municipalities || null,
      media_assets: Array.isArray(item.media_assets) ? item.media_assets[0] || null : item.media_assets || null,
    })) as PublicPerson[];

    // Sort by relevance score if territory context exists, then by featured, then by name
    if (territory) {
      mapped.sort((a, b) => {
        const scoreA = getRelevanceScore(a, territory);
        const scoreB = getRelevanceScore(b, territory);
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }
        if (a.is_featured !== b.is_featured) {
          return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
        }
        return a.full_name.localeCompare(b.full_name);
      });
    }

    return mapped;
  } catch (err) {
    console.error('Unexpected error fetching published people:', err);
    return [];
  }
}

/**
 * Fetches a single published and public character by slug.
 */
export async function getPublishedPersonBySlug(slug: string): Promise<PublicPerson | null> {
  try {
    if (!slug) return null;
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('people')
      .select(`
        id,
        full_name,
        slug,
        short_bio,
        biography,
        person_type,
        birth_date,
        death_date,
        region_id,
        province_id,
        municipality_id,
        main_image_asset_id,
        source_reference,
        is_featured,
        regions(name),
        provinces(name),
        municipalities(name),
        media_assets:main_image_asset_id(bucket_name, storage_path, title, alt_text)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .maybeSingle();

    if (error) {
      console.error('Error fetching published person by slug:', error);
      return null;
    }

    if (!data) return null;
    const item = data as any;
    return {
      id: item.id,
      full_name: item.full_name,
      slug: item.slug,
      short_bio: item.short_bio,
      biography: item.biography,
      person_type: item.person_type,
      birth_date: item.birth_date,
      death_date: item.death_date,
      region_id: item.region_id,
      province_id: item.province_id,
      municipality_id: item.municipality_id,
      main_image_asset_id: item.main_image_asset_id,
      source_reference: item.source_reference,
      is_featured: item.is_featured,
      regions: Array.isArray(item.regions) ? item.regions[0] || null : item.regions || null,
      provinces: Array.isArray(item.provinces) ? item.provinces[0] || null : item.provinces || null,
      municipalities: Array.isArray(item.municipalities) ? item.municipalities[0] || null : item.municipalities || null,
      media_assets: Array.isArray(item.media_assets) ? item.media_assets[0] || null : item.media_assets || null,
    } as PublicPerson;
  } catch (err) {
    console.error('Unexpected error fetching published person by slug:', err);
    return null;
  }
}
