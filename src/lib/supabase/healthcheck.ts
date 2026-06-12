import { getEnv } from './env';

export interface HealthCheckResult {
  status: 'ok' | 'error';
  message: string;
  details?: {
    urlValid: boolean;
    keyPresent: boolean;
    isHttpOrHttps: boolean;
  };
}

/**
 * Validates the existence and format of public Supabase environment variables.
 * Safe to call client-side or server-side. Does not query database tables.
 */
export const checkSupabaseEnvironment = (): HealthCheckResult => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getEnv();

    const isKeyPresent = supabaseAnonKey.trim().length > 0;
    let isUrlValid = false;
    let isHttpOrHttps = false;

    try {
      const parsedUrl = new URL(supabaseUrl);
      isUrlValid = true;
      isHttpOrHttps = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      isUrlValid = false;
    }

    if (!isUrlValid || !isHttpOrHttps) {
      return {
        status: 'error',
        message: 'NEXT_PUBLIC_SUPABASE_URL does not have a valid HTTP/HTTPS URL format.',
        details: { urlValid: isUrlValid, keyPresent: isKeyPresent, isHttpOrHttps },
      };
    }

    if (!isKeyPresent) {
      return {
        status: 'error',
        message: 'Supabase public key/anon key is empty.',
        details: { urlValid: isUrlValid, keyPresent: isKeyPresent, isHttpOrHttps },
      };
    }

    return {
      status: 'ok',
      message: 'Supabase environment variables validated successfully.',
      details: { urlValid: isUrlValid, keyPresent: isKeyPresent, isHttpOrHttps },
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown validation error.',
    };
  }
};
