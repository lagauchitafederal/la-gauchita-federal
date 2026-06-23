import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../supabase/env';

export interface AdminPersonListItem {
  id: string;
  full_name: string;
  slug: string;
  person_type: string;
  status: string;
  visibility: string;
  is_featured: boolean;
  birth_date: string | null;
  death_date: string | null;
  regions: { name: string } | null;
  provinces: { name: string } | null;
  municipalities: { name: string } | null;
  created_at: string;
}

export interface AdminPersonDetail {
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
  status: string;
  visibility: string;
  is_featured: boolean;
  media_assets?: { bucket_name: string; storage_path: string; title: string } | null;
}

export interface NewAdminPerson {
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
  status: string;
  visibility: string;
  is_featured: boolean;
}

/**
 * Fetches all people from public.people for administrative list display.
 * Respects RLS by initializing the client with the user's access token.
 */
export async function getAdminPeopleList(): Promise<AdminPersonListItem[]> {
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

    const { data, error } = await supabase
      .from('people')
      .select(`
        id,
        full_name,
        slug,
        person_type,
        status,
        visibility,
        is_featured,
        birth_date,
        death_date,
        created_at,
        regions(name),
        provinces(name),
        municipalities(name)
      `)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching admin people list:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      full_name: item.full_name,
      slug: item.slug,
      person_type: item.person_type,
      status: item.status,
      visibility: item.visibility,
      is_featured: item.is_featured,
      birth_date: item.birth_date,
      death_date: item.death_date,
      created_at: item.created_at,
      regions: Array.isArray(item.regions) ? item.regions[0] || null : item.regions || null,
      provinces: Array.isArray(item.provinces) ? item.provinces[0] || null : item.provinces || null,
      municipalities: Array.isArray(item.municipalities) ? item.municipalities[0] || null : item.municipalities || null,
    })) as AdminPersonListItem[];
  } catch (err) {
    console.error('Unexpected error in getAdminPeopleList:', err);
    throw err;
  }
}

/**
 * Fetches a single person record by id.
 */
export async function getAdminPersonById(id: string): Promise<AdminPersonDetail | null> {
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
        status,
        visibility,
        is_featured,
        media_assets:main_image_asset_id(bucket_name, storage_path, title)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching admin person by id:', error);
      throw error;
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
      status: item.status,
      visibility: item.visibility,
      is_featured: item.is_featured,
      media_assets: Array.isArray(item.media_assets) ? item.media_assets[0] || null : item.media_assets || null,
    } as AdminPersonDetail;
  } catch (err) {
    console.error('Unexpected error in getAdminPersonById:', err);
    throw err;
  }
}

/**
 * Updates a single person record by id.
 */
export async function updateAdminPerson(
  id: string,
  updatedData: Partial<Omit<AdminPersonDetail, 'id' | 'slug'>>
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
      .from('people')
      .update({
        ...updatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating admin person:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in updateAdminPerson:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}

/**
 * Creates a new person record.
 */
export async function createAdminPerson(
  personData: NewAdminPerson
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

    // Resolve profile id for created_by_profile_id
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
      .from('people')
      .insert([{
        ...personData,
        created_by_profile_id: profileId,
      }]);

    if (error) {
      console.error('Error inserting admin person:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in createAdminPerson:', err);
    return { success: false, error: err.message || 'Ocurrió un error inesperado.' };
  }
}
