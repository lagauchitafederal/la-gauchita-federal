import { createClient } from '@supabase/supabase-js';
import { getEnv } from './env';

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
