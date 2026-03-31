import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client with the service role key.
 * Use ONLY in Route Handlers and Server Components — never expose to the client.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables'
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export const STORAGE_BUCKET = 'task-submissions';
