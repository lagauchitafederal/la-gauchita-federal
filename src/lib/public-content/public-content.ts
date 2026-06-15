import { createServerSupabaseClient } from '../supabase/server';

export interface PublicContent {
  title: string;
  slug: string;
  subtitle: string | null;
  summary: string | null;
  event_date: string | null;
  publish_date: string | null;
  is_featured: boolean;
  created_at: string;
}

export interface PublicInstitution {
  name: string;
  slug: string;
  institution_type: string;
  description: string | null;
  is_featured: boolean;
  sort_order: number;
}

export interface PublicRecognition {
  title: string;
  slug: string;
  recognition_type: string;
  description: string | null;
  recognition_date: string | null;
  is_featured: boolean;
  sort_order: number;
}

export interface PublicMediaAsset {
  title: string;
  asset_type: string;
  bucket_name: string;
  storage_path: string;
  alt_text: string | null;
  credit: string | null;
  sort_order: number;
}

/**
 * Fetches published contents. RLS filters published, public and active contents.
 */
export async function getPublishedContents(): Promise<PublicContent[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('contents')
      .select('title, slug, subtitle, summary, event_date, publish_date, is_featured, created_at')
      .order('is_featured', { ascending: false })
      .order('publish_date', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Error fetching published contents:', error);
      return [];
    }
    return (data as PublicContent[]) || [];
  } catch (err) {
    console.error('Unexpected error fetching published contents:', err);
    return [];
  }
}

/**
 * Fetches active institutions. RLS filters active institutions.
 */
export async function getActiveInstitutions(): Promise<PublicInstitution[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('institutions')
      .select('name, slug, institution_type, description, is_featured, sort_order')
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .limit(8);

    if (error) {
      console.error('Error fetching active institutions:', error);
      return [];
    }
    return (data as PublicInstitution[]) || [];
  } catch (err) {
    console.error('Unexpected error fetching active institutions:', err);
    return [];
  }
}

/**
 * Fetches active recognitions. RLS filters active and public recognitions.
 */
export async function getActiveRecognitions(): Promise<PublicRecognition[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('recognitions')
      .select('title, slug, recognition_type, description, recognition_date, is_featured, sort_order')
      .order('is_featured', { ascending: false })
      .order('recognition_date', { ascending: false })
      .order('sort_order', { ascending: true })
      .limit(6);

    if (error) {
      console.error('Error fetching active recognitions:', error);
      return [];
    }
    return (data as PublicRecognition[]) || [];
  } catch (err) {
    console.error('Unexpected error fetching active recognitions:', err);
    return [];
  }
}

/**
 * Fetches public media assets. RLS filters active and public media assets.
 */
export async function getPublicMediaAssets(): Promise<PublicMediaAsset[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('media_assets')
      .select('title, asset_type, bucket_name, storage_path, alt_text, credit, sort_order')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Error fetching public media assets:', error);
      return [];
    }
    return (data as PublicMediaAsset[]) || [];
  } catch (err) {
    console.error('Unexpected error fetching public media assets:', err);
    return [];
  }
}
