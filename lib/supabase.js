/**
 * @fileoverview Supabase client configuration
 * Exports both browser-side and server-side admin clients
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Browser-side Supabase client using the anon key.
 * Safe to use on the client — respects Row Level Security.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-side Supabase admin client using the service role key.
 * Bypasses Row Level Security — use ONLY in server-side code (API routes, server components).
 * @returns {import('@supabase/supabase-js').SupabaseClient} Admin Supabase client
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
