import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../supabase/env';

export interface LogActivityParams {
  action_type: 'create' | 'update' | 'upload';
  entity_type: 'content' | 'institution' | 'recognition' | 'media_asset' | 'import_batch';
  entity_id: string | null;
  entity_label: string | null;
  metadata?: Record<string, any>;
}

/**
 * Registers an administrative action in the admin_activity_logs table.
 * It is implemented as "best effort": if an error occurs, it is logged to console
 * but does not throw or interrupt the main transaction.
 */
export async function logAdminActivity(params: LogActivityParams): Promise<void> {
  try {
    const { supabaseUrl, supabaseAnonKey } = getEnv();
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    if (!token) {
      console.warn('logAdminActivity: No sb-access-token token found in cookies.');
      return;
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

    // 1. Get the current auth user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.warn('logAdminActivity: Could not authenticate user:', userError?.message);
      return;
    }

    // 2. Fetch profile id linked to auth_user_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.warn('logAdminActivity: Active profile not found for user:', profileError?.message);
      return;
    }

    // 3. Insert log entry
    const { error: insertError } = await supabase
      .from('admin_activity_logs')
      .insert({
        actor_profile_id: profile.id,
        action_type: params.action_type,
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        entity_label: params.entity_label,
        metadata: params.metadata || {},
      });

    if (insertError) {
      console.error('logAdminActivity: Error inserting log row:', insertError.message);
    }
  } catch (err: any) {
    // Best-effort: do not propagate error to the main operation
    console.error('logAdminActivity: Unexpected error:', err?.message || err);
  }
}
