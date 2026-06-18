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
  institutions?: { name: string; slug: string } | null;
  categories?: { name: string } | null;
}

export interface PublicContentDetail extends PublicContent {
  body: string | null;
  source_reference: string | null;
}

export interface PublicInstitution {
  name: string;
  slug: string;
  institution_type: string;
  description: string | null;
  is_featured: boolean;
  sort_order: number;
  address?: string | null;
}

export interface PublicInstitutionDetail extends PublicInstitution {
  website_url: string | null;
  logo_url: string | null;
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

export interface PublicRecognition {
  title: string;
  slug: string;
  recognition_type: string;
  description: string | null;
  recognition_date: string | null;
  is_featured: boolean;
  sort_order: number;
  granting_institution_name?: string | null;
}

export interface PublicRecognitionDetail extends PublicRecognition {
  granting_institution_name: string | null;
  location: string | null;
  document_reference: string | null;
  source_reference: string | null;
}

export interface PublicMediaAsset {
  title: string;
  asset_type: string;
  bucket_name: string;
  storage_path: string;
  alt_text: string | null;
  credit: string | null;
  sort_order: number;
  mime_type: string | null;
}

export interface PublicMediaAssetDetail extends PublicMediaAsset {
  description: string | null;
  source_reference: string | null;
  rights_status: string;
  visibility: string;
  status: string;
  created_at: string;
}


/**
 * Fetches published contents for homepage (limit 6). RLS filters published, public and active contents.
 */
export async function getPublishedContents(): Promise<PublicContent[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('contents')
      .select('title, slug, subtitle, summary, event_date, publish_date, is_featured, created_at, institutions(name, slug), categories(name)')
      .order('is_featured', { ascending: false })
      .order('publish_date', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Error fetching published contents:', error);
      return [];
    }
    
    return (data || []).map((item: any) => ({
      title: item.title,
      slug: item.slug,
      subtitle: item.subtitle,
      summary: item.summary,
      event_date: item.event_date,
      publish_date: item.publish_date,
      is_featured: item.is_featured,
      created_at: item.created_at,
      institutions: Array.isArray(item.institutions) ? item.institutions[0] || null : item.institutions || null,
      categories: Array.isArray(item.categories) ? item.categories[0] || null : item.categories || null
    })) as PublicContent[];
  } catch (err) {
    console.error('Unexpected error fetching published contents:', err);
    return [];
  }
}

/**
 * Fetches the full list of published contents (limit 100). RLS filters published, public and active contents.
 */
export async function getPublishedContentsList(): Promise<PublicContent[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('contents')
      .select('title, slug, subtitle, summary, event_date, publish_date, is_featured, created_at, institutions(name, slug), categories(name)')
      .order('is_featured', { ascending: false })
      .order('publish_date', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching published contents list:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      title: item.title,
      slug: item.slug,
      subtitle: item.subtitle,
      summary: item.summary,
      event_date: item.event_date,
      publish_date: item.publish_date,
      is_featured: item.is_featured,
      created_at: item.created_at,
      institutions: Array.isArray(item.institutions) ? item.institutions[0] || null : item.institutions || null,
      categories: Array.isArray(item.categories) ? item.categories[0] || null : item.categories || null
    })) as PublicContent[];
  } catch (err) {
    console.error('Unexpected error fetching published contents list:', err);
    return [];
  }
}

/**
 * Fetches a single published content detail by slug. RLS filters published, public and active contents.
 */
export async function getPublishedContentBySlug(slug: string): Promise<PublicContentDetail | null> {
  try {
    if (!slug) return null;
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('contents')
      .select('title, slug, subtitle, summary, body, event_date, publish_date, is_featured, source_reference, created_at, institutions(name, slug), categories(name)')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Error fetching published content by slug:', error);
      return null;
    }
    
    if (!data) return null;
    const item = data as any;
    return {
      title: item.title,
      slug: item.slug,
      subtitle: item.subtitle,
      summary: item.summary,
      body: item.body,
      event_date: item.event_date,
      publish_date: item.publish_date,
      is_featured: item.is_featured,
      source_reference: item.source_reference,
      created_at: item.created_at,
      institutions: Array.isArray(item.institutions) ? item.institutions[0] || null : item.institutions || null,
      categories: Array.isArray(item.categories) ? item.categories[0] || null : item.categories || null
    } as PublicContentDetail;
  } catch (err) {
    console.error('Unexpected error fetching published content by slug:', err);
    return null;
  }
}

/**
 * Fetches active institutions for homepage (limit 8). RLS filters active institutions.
 */
export async function getActiveInstitutions(): Promise<PublicInstitution[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('institutions')
      .select('name, slug, institution_type, description, is_featured, sort_order, address')
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
 * Fetches the full list of active institutions (limit 100). RLS filters active institutions.
 */
export async function getActiveInstitutionsList(): Promise<PublicInstitution[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('institutions')
      .select('name, slug, institution_type, description, is_featured, sort_order, address')
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error fetching active institutions list:', error);
      return [];
    }
    return (data as PublicInstitution[]) || [];
  } catch (err) {
    console.error('Unexpected error fetching active institutions list:', err);
    return [];
  }
}

/**
 * Fetches a single active institution detail by slug. RLS filters active institutions.
 */
export async function getActiveInstitutionBySlug(slug: string): Promise<PublicInstitutionDetail | null> {
  try {
    if (!slug) return null;
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('institutions')
      .select('name, slug, institution_type, description, is_featured, sort_order, website_url, logo_url, address, contact_email, contact_phone')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Error fetching active institution by slug:', error);
      return null;
    }
    return (data as PublicInstitutionDetail) || null;
  } catch (err) {
    console.error('Unexpected error fetching active institution by slug:', err);
    return null;
  }
}

/**
 * Fetches active recognitions for homepage (limit 6). RLS filters active and public recognitions.
 */
export async function getActiveRecognitions(): Promise<PublicRecognition[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('recognitions')
      .select('title, slug, recognition_type, description, recognition_date, is_featured, sort_order, granting_institution_name')
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
 * Fetches the full list of active recognitions (limit 100). RLS filters active and public recognitions.
 */
export async function getActiveRecognitionsList(): Promise<PublicRecognition[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('recognitions')
      .select('title, slug, recognition_type, description, recognition_date, is_featured, sort_order, granting_institution_name')
      .order('is_featured', { ascending: false })
      .order('recognition_date', { ascending: false })
      .order('sort_order', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error fetching active recognitions list:', error);
      return [];
    }
    return (data as PublicRecognition[]) || [];
  } catch (err) {
    console.error('Unexpected error fetching active recognitions list:', err);
    return [];
  }
}

/**
 * Fetches a single active recognition detail by slug. RLS filters active and public recognitions.
 */
export async function getActiveRecognitionBySlug(slug: string): Promise<PublicRecognitionDetail | null> {
  try {
    if (!slug) return null;
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('recognitions')
      .select('title, slug, recognition_type, description, recognition_date, is_featured, sort_order, granting_institution_name, location, document_reference, source_reference')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Error fetching active recognition by slug:', error);
      return null;
    }
    return (data as PublicRecognitionDetail) || null;
  } catch (err) {
    console.error('Unexpected error fetching active recognition by slug:', err);
    return null;
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
      .select('title, asset_type, bucket_name, storage_path, alt_text, credit, sort_order, mime_type')
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

/**
 * Fetches the full list of public media assets (limit 100). RLS filters active and public media assets.
 */
export async function getPublicMediaAssetsList(): Promise<PublicMediaAssetDetail[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('media_assets')
      .select('title, description, asset_type, bucket_name, storage_path, alt_text, credit, source_reference, rights_status, visibility, status, sort_order, created_at, mime_type')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching public media assets list:', error);
      return [];
    }
    return (data as PublicMediaAssetDetail[]) || [];
  } catch (err) {
    console.error('Unexpected error fetching public media assets list:', err);
    return [];
  }
}

