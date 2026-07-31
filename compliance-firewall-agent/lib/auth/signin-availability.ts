import { isSupabaseConfigured } from '@/lib/supabase/client'
import { isBetterAuthClientEnabled } from '@/lib/auth/auth-client'

/**
 * Can this DEPLOYMENT sign anyone in at all?
 *
 * Separate from "are these credentials right?" — and the distinction is the
 * whole point. Both used to surface as:
 *
 *     "We couldn't reach the sign-in service. Please try again in a moment."
 *
 * which is advice that cannot work. `createBrowserClient(url, '')` throws
 * synchronously when the anon key is absent, the catch treats it as a transient
 * network blip, and the user retries forever against a deployment that will
 * never accept them.
 *
 * This is not hypothetical. On 2026-07-31 the founder could not sign in to a
 * Vercel PREVIEW deployment. `NEXT_PUBLIC_SUPABASE_URL` was set for that
 * environment but `NEXT_PUBLIC_SUPABASE_ANON_KEY` was not, and because
 * `NEXT_PUBLIC_*` is inlined at BUILD time the difference is visible in the
 * shipped bundle: production compiled to a string literal, preview compiled to a
 * `process.env.…` lookup that resolves to undefined in a browser. The UI said
 * "try again in a moment" for a condition no amount of retrying could change.
 *
 * Telling someone to retry when the answer is "this build was never configured"
 * is the same class of defect as a dashboard that renders seeded numbers as
 * measurements: technically a string, functionally a false statement about the
 * system's state.
 *
 * Better Auth is self-hosted at our own /api/auth, so it has no equivalent
 * client-side prerequisite — under that provider sign-in is always "available"
 * and a genuine outage is a real network error, which the caller still reports.
 */
export function isSignInAvailable(): boolean {
  return isBetterAuthClientEnabled() || isSupabaseConfigured()
}

/**
 * What to show when it is not. Deliberately says the deployment is at fault so
 * nobody burns time re-typing a correct password, and deliberately names no
 * variable: this renders to end users, and the remedy is not theirs.
 */
export const SIGN_IN_UNAVAILABLE =
  'Sign-in is not configured on this deployment, so no password will work here. ' +
  'This is a server configuration problem, not your account.'
