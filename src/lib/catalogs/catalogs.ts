import { createServerSupabaseClient } from '../supabase/server';

export interface Region {
  id: string;
  code: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Province {
  id: string;
  region_id: string;
  code: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Municipality {
  id: string;
  province_id: string;
  code: string;
  name: string;
  slug: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  is_capital: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ContentType {
  id: string;
  code: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  parent_id?: string;
  code: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MembershipLevel {
  id: string;
  code: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  benefits: Record<string, unknown> | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches all active regions ordered by sort_order then name.
 */
export async function getRegions(): Promise<Region[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching regions:', error);
      return [];
    }
    return (data as Region[]) || [];
  } catch (err) {
    console.error('Unexpected error fetching regions:', err);
    return [];
  }
}

/**
 * Fetches all active provinces ordered by sort_order then name.
 */
export async function getProvinces(): Promise<Province[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('provinces')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching provinces:', error);
      return [];
    }
    return (data as Province[]) || [];
  } catch (err) {
    console.error('Unexpected error fetching provinces:', err);
    return [];
  }
}

/**
 * Fetches all active municipalities ordered by sort_order then name.
 */
export async function getMunicipalities(): Promise<Municipality[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('municipalities')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching municipalities:', error);
      return [];
    }
    return (data as Municipality[]) || [];
  } catch (err) {
    console.error('Unexpected error fetching municipalities:', err);
    return [];
  }
}

/**
 * Fetches all active content types ordered by sort_order then name.
 */
export async function getContentTypes(): Promise<ContentType[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('content_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching content types:', error);
      return [];
    }
    return (data as ContentType[]) || [];
  } catch (err) {
    console.error('Unexpected error fetching content types:', err);
    return [];
  }
}

/**
 * Fetches all active categories ordered by sort_order then name.
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
    return (data as Category[]) || [];
  } catch (err) {
    console.error('Unexpected error fetching categories:', err);
    return [];
  }
}

/**
 * Fetches all active membership levels ordered by sort_order then name.
 */
export async function getMembershipLevels(): Promise<MembershipLevel[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('membership_levels')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching membership levels:', error);
      return [];
    }
    return (data as MembershipLevel[]) || [];
  } catch (err) {
    console.error('Unexpected error fetching membership levels:', err);
    return [];
  }
}

