/**
 * Supabase server-side client — uses the SERVICE_ROLE key.
 *
 * This is the ONLY client that can write to state-bearing tables.
 * The service-role key bypasses RLS by design, making the
 * state-transition service the sole write path.
 *
 * NEVER import this file from client-side code.
 * NEVER expose the service-role key to the browser.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serverClient: SupabaseClient | null = null;

export function getServerClient(): SupabaseClient {
  if (serverClient) return serverClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'These are required server-side environment variables. See .env.example.'
    );
  }

  serverClient = createClient(url, key, {
    auth: {
      // Why autoRefreshToken: false — the service-role key doesn't expire.
      // We're not using user auth on this client.
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serverClient;
}
