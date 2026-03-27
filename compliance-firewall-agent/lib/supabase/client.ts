import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Returns true when real Supabase credentials are configured.
 * When false, the app runs in demo mode with mock data.
 */
export function isSupabaseConfigured(): boolean {
  return (
    supabaseUrl.startsWith("https://") &&
    !supabaseUrl.includes("YOUR-PROJECT-ID") &&
    supabaseServiceKey.length > 20 &&
    !supabaseServiceKey.includes("your-")
  );
}

// Server-side client with service role (full access) — use in API routes only
export function createServiceClient() {
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

// Client-side client with anon key (RLS enforced)
export function createBrowserClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

// Zero-arg factory alias — for older routes that call createClient() with no args.
// Returns a service-role client pre-wired with env vars.
// Prefer createServiceClient() or createBrowserClient() for new code.
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}
