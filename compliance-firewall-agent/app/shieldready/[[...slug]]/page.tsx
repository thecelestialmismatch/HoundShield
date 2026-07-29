import { permanentRedirect } from 'next/navigation'

/**
 * `/shieldready` → `/command-center`, `/shieldready/<path>` →
 * `/command-center/shield/<path>`.
 *
 * Mirrors the two `next.config.js` entries exactly (bare path to the dashboard
 * root, sub-paths into the CMMC Shield tool) so behaviour is identical whether
 * the platform routing layer or this page serves the redirect. Both 404'd in
 * production before this existed — see app/dashboard/page.tsx for why.
 */
// Dynamic for the same reason as /console — a prerendered redirect answers 200
// with a client-side hop instead of a 308.
export const dynamic = 'force-dynamic'

export default async function ShieldReadyRedirectPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}): Promise<never> {
  const { slug } = await params
  const rest = slug?.length ? `/${slug.map(encodeURIComponent).join('/')}` : ''
  permanentRedirect(rest ? `/command-center/shield${rest}` : '/command-center')
}
