import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from './env';
import { cookies } from 'next/headers';

/**
 * Creates a server-side Supabase client instance.
 * Note: In future phases, this will be updated to handle cookies for session persistence.
 */
export const createServerSupabaseClient = () => {
  const { supabaseUrl, supabaseAnonKey } = getEnv();
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
};

/**
 * Creates an authenticated server-side Supabase client instance using the request cookies.
 */
export const createAuthenticatedServerSupabaseClient = async (): Promise<{ supabase: SupabaseClient; token: string }> => {
  const { supabaseUrl, supabaseAnonKey } = getEnv();
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;
  
  if (!token) {
    throw new Error('No autorizado: sesión no válida.');
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
    },
  });
  
  return { supabase, token };
};
