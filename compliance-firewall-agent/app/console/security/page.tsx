import { permanentRedirect } from 'next/navigation'

/**
 * `/console/security` → `/command-center/account-security`.
 *
 * Account security moved under the merged dashboard in the 2026-07-29 merge so
 * it inherits the command-center shell and the fail-closed gate. Kept as an
 * in-app redirect for the same reason as `/console` — see that file.
 */
// Dynamic for the same reason as /console — see that file.
export const dynamic = 'force-dynamic'

export default function ConsoleSecurityRedirectPage(): never {
  permanentRedirect('/command-center/account-security')
}
