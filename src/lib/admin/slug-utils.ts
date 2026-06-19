import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../supabase/env';
import { cookies } from 'next/headers';

export function generateSlug(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export async function getUniqueSlug(table: string, baseSlug: string): Promise<string> {
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

  let slug = baseSlug;
  let counter = 1;
  let exists = true;

  while (exists) {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error(`Error checking slug uniqueness for ${table}:`, error);
      throw new Error('Error al verificar duplicados del slug.');
    }

    if (!data) {
      exists = false;
    } else {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  return slug;
}
