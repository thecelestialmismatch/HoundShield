import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./types";

function supabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  return url;
}

function anonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  return key;
}

function serviceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return key;
}

/**
 * Cookie-aware Supabase client for Server Components and Route Handlers.
 * Respects Row Level Security — use for authenticated user requests.
 */
export async function createAuthClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(supabaseUrl(), anonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Read-only cookie store in some Server Component contexts — ignore
        }
      },
    },
  });
}

/**
 * Service-role Supabase client — bypasses all RLS policies.
 * Use ONLY in server-side proxy routes. Never expose to the client.
 */
export function createServiceClient() {
  return createClient<Database>(supabaseUrl(), serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
