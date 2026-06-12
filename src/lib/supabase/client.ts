import { createClient } from '@supabase/supabase-js';
import { getEnv } from './env';

const { supabaseUrl, supabaseAnonKey } = getEnv();

// Singleton client instance for browser-side operations
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
