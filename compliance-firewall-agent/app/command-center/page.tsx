import { redirect } from 'next/navigation'

/**
 * `/command-center` is the entry URL; `/command-center/overview` is where the
 * dashboard actually lives.
 *
 * Founder direction 2026-07-29: the after-login dashboard should be at
 * `/command-center/overview`. Rather than repoint the seven post-login landings
 * (auth/callback, auth, login, signup, confirm-redirect, signup-result,
 * middleware) and every existing bookmark, this index forwards. One hop, and no
 * link anywhere in the product or in a user's history can go stale.
 *
 * Not `permanentRedirect`: a 308 is cached by the browser indefinitely, which
 * would make the canonical dashboard URL impossible to move again without
 * stranding everyone who ever visited. A temporary redirect keeps that door open.
 *
 * The auth gate in `layout.tsx` still runs first — this file is inside the
 * protected subtree, so an anonymous visitor is redirected to /login and never
 * reaches this redirect at all.
 */
export default function CommandCenterIndex() {
  redirect('/command-center/overview')
}
