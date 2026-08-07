import { getFounderMetrics } from '@/lib/admin/founder-metrics'
import { AdminPanel } from './AdminPanel'

/**
 * The founder admin panel.
 *
 * Distinct from the other two surfaces on purpose, and the distinction is the
 * whole design:
 *
 *   Customer app  (/, /pricing, /demo)          — what a buyer sees
 *   Dashboard     (/command-center/*)           — what ONE customer sees of their own data
 *   Admin         (/admin)                      — what the founder sees across ALL of it
 *
 * The dashboard could never answer "are we going to hit the Stage 1 gate", because
 * every query in it is correctly scoped to one tenant. This page is the only
 * place that reads the aggregate, which is why it sits behind its own
 * fail-closed role gate in ./layout.tsx.
 *
 * Access is decided upstream by that layout. Nothing below is a security control.
 */

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const metrics = await getFounderMetrics()
  return <AdminPanel metrics={metrics} />
}
