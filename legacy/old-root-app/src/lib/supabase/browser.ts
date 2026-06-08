import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/** Supabase client for use inside 'use client' components.
 *  Falls back to placeholder strings during SSR prerender so the module
 *  doesn't throw — all real requests happen inside useEffect (browser only). */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key"
  );
}
