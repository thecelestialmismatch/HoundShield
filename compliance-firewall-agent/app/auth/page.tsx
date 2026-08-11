import { redirect } from 'next/navigation';

/**
 * /auth — permanently folded into /login.
 *
 * This used to be a 645-line THIRD auth surface, live in production (HTTP 200)
 * and linked twice from /agents, duplicating both the sign-in and sign-up forms
 * with their own Supabase calls. It carried the worst enumeration leak in the
 * app: `setError(authError.message)` echoed GoTrue's raw text straight into the
 * UI, so "Email not confirmed" and "Invalid login credentials" told an
 * anonymous caller whether an address had an account.
 *
 * It was deleted rather than patched. Three password surfaces that must never
 * disagree about how they word a failure is a standing invitation for exactly
 * this defect to come back in whichever copy someone forgets — and this page is
 * the one everyone forgot. /login is now the single surface, and it is the one
 * with the server route, the lockout and the timing floor behind it.
 *
 * Deleting it also removed a "SOC 2 Ready" trust badge that CLAUDE.md and PR
 * #276 prohibit.
 *
 * The route is kept (not removed) so the two /agents links and any external
 * bookmark keep working instead of 404ing.
 */
export default function AuthPage() {
  redirect('/login');
}
