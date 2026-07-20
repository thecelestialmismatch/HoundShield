import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getSessionUser } from '@/lib/auth/session'
import { getAuth, isBetterAuthEnabled } from '@/lib/auth/better-auth'
import { TwoFactorSettings } from '@/components/dashboard/security/TwoFactorSettings'

export const metadata: Metadata = {
  title: 'Account Security — HoundShield',
  description: 'Manage two-factor authentication for your HoundShield account.',
  robots: { index: false, follow: false },
}

// Reads the session cookie — must render per request.
export const dynamic = 'force-dynamic'

/**
 * Whether the signed-in user already has email 2FA turned on. Better Auth's
 * session user carries `twoFactorEnabled` once the plugin is active; the
 * Supabase path has no second factor, so false.
 */
async function getTwoFactorEnabled(): Promise<boolean> {
  const auth = getAuth()
  if (!auth) return false
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    return Boolean(
      (session?.user as { twoFactorEnabled?: boolean | null } | undefined)?.twoFactorEnabled,
    )
  } catch {
    return false
  }
}

export default async function SecurityPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login?redirect=/console/security')

  return (
    <TwoFactorSettings
      email={user.email}
      betterAuthActive={isBetterAuthEnabled()}
      initialEnabled={await getTwoFactorEnabled()}
    />
  )
}
