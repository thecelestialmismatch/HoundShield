import 'server-only'
import { createServiceClient, isSupabaseConfigured } from '@/lib/supabase/client'

/**
 * The founder's numbers, across every tenant.
 *
 * This is the ONE module in the codebase that deliberately reads without a
 * `user_id` filter. Everywhere else, the service-role client bypassing RLS is
 * made safe by a session-derived tenant filter (see /api/dashboard/overview);
 * here the whole point is the aggregate, so the safety has to come from
 * somewhere else — and it does, from the fail-closed role gate in
 * `app/admin/layout.tsx`. Nothing in this file is a security control. If you
 * ever call it from outside `/admin`, you have created a cross-tenant leak.
 *
 * WHAT IT MEASURES, AND WHY THOSE THINGS
 *
 * Not vanity metrics. The two counters at the top are the literal Stage 1
 * milestone from CLAUDE.md — three paid $499 reports and one signed RPO/MSP
 * referral agreement — because a founder dashboard that does not tell you
 * whether you are going to hit your own gate is decoration.
 *
 * HONESTY: every number is a count of rows that exist. There is no projection,
 * no run-rate extrapolation, and no "estimated pipeline value". Zero is
 * rendered as zero. The whole reason this product exists is that invented
 * numbers on a dashboard are the worst failure mode available to it, and that
 * rule does not relax because the only viewer is the founder — it is *harder*
 * to spot a flattering lie you wrote for yourself.
 */

/** Stage 1 gate, from CLAUDE.md. Changing these changes what "done" means. */
export const STAGE1_REPORT_TARGET = 3
export const STAGE1_PARTNER_TARGET = 1

export interface ReportOrderRow {
  id: string
  email: string | null
  company: string | null
  vertical: string | null
  amountCents: number
  status: string
  isWholesale: boolean
  partnerRef: string | null
  createdAt: string
  deliveredAt: string | null
}

export interface PartnerApplicationRow {
  id: string
  name: string | null
  company: string | null
  email: string | null
  partnerType: string | null
  clientCount: number | null
  status: string
  createdAt: string
}

export interface SignupRow {
  id: string
  email: string | null
  company: string | null
  tier: string | null
  role: string | null
  createdAt: string
  /** Gateway events this account has ever sent. 0 means signed up, never connected. */
  events: number
}

export interface FounderMetrics {
  /** False when Supabase is unconfigured — the UI must say "not connected",
   *  never render zeros that look like "nobody has bought anything". */
  connected: boolean
  stage1: {
    paidReports: number
    reportTarget: number
    signedPartners: number
    partnerTarget: number
    /** Revenue actually collected, in cents. Paid orders only. */
    revenueCents: number
  }
  accounts: {
    total: number
    /** Accounts that have sent at least one prompt through the gateway. */
    activated: number
    /** Signed up in the last 7 days. */
    newThisWeek: number
  }
  gateway: {
    /** Every tenant's events, all time. */
    totalEvents: number
    blocked: number
    /** Events in the last 7 days, across all tenants. */
    last7d: number
    /** Of `totalEvents`, how many are seeded demo rows. Stated so the founder
     *  never reads their own fixture as traction. */
    syntheticEvents: number
  }
  reports: ReportOrderRow[]
  partners: PartnerApplicationRow[]
  signups: SignupRow[]
}

export function emptyFounderMetrics(connected = false): FounderMetrics {
  return {
    connected,
    stage1: {
      paidReports: 0,
      reportTarget: STAGE1_REPORT_TARGET,
      signedPartners: 0,
      partnerTarget: STAGE1_PARTNER_TARGET,
      revenueCents: 0,
    },
    accounts: { total: 0, activated: 0, newThisWeek: 0 },
    gateway: { totalEvents: 0, blocked: 0, last7d: 0, syntheticEvents: 0 },
    reports: [],
    partners: [],
    signups: [],
  }
}

/** A partner application that counts toward the Stage 1 gate. */
const SIGNED_PARTNER_STATUSES = new Set(['signed', 'approved', 'active'])

/** Rows to show in each table. A founder scanning a list does not need page 2. */
const LIST_LIMIT = 25

type Row = Record<string, unknown>
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null)
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

export async function getFounderMetrics(now = Date.now()): Promise<FounderMetrics> {
  if (!isSupabaseConfigured()) return emptyFounderMetrics(false)

  const db = createServiceClient()
  const weekAgo = new Date(now - 7 * 86_400_000).toISOString()

  try {
    // Parallel, because these are six independent reads and a founder page that
    // takes six sequential round-trips is the bug we just fixed on the customer
    // dashboard.
    const [orders, partners, profiles, events, recentEvents, synthetic] = await Promise.all([
      db.from('report_orders')
        .select('id, email, company, vertical, amount_cents, status, is_wholesale, partner_ref, created_at, report_delivered_at')
        .order('created_at', { ascending: false })
        .limit(LIST_LIMIT),
      db.from('partner_applications')
        .select('id, name, company, email, partner_type, client_count, status, created_at')
        .order('created_at', { ascending: false })
        .limit(LIST_LIMIT),
      db.from('profiles')
        .select('id, email, company, tier, role, created_at')
        .order('created_at', { ascending: false })
        .limit(LIST_LIMIT),
      db.from('compliance_events').select('user_id, action_taken'),
      db.from('compliance_events').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
      db.from('compliance_events').select('id', { count: 'exact', head: true }).eq('metadata->>synthetic', 'true'),
    ])

    const orderRows = (orders.data ?? []) as Row[]
    const partnerRows = (partners.data ?? []) as Row[]
    const profileRows = (profiles.data ?? []) as Row[]
    const eventRows = (events.data ?? []) as Row[]

    const paid = orderRows.filter((o) => str(o.status) === 'paid')

    // Which accounts have ever sent a prompt. One pass, no extra query.
    const eventsByUser = new Map<string, number>()
    let blocked = 0
    for (const e of eventRows) {
      const uid = str(e.user_id)
      if (uid) eventsByUser.set(uid, (eventsByUser.get(uid) ?? 0) + 1)
      if (str(e.action_taken) === 'BLOCKED') blocked += 1
    }

    return {
      connected: true,
      stage1: {
        // Paid rows only. A pending checkout is not revenue and must never be
        // counted toward a gate the founder makes decisions on.
        paidReports: paid.length,
        reportTarget: STAGE1_REPORT_TARGET,
        signedPartners: partnerRows.filter((p) =>
          SIGNED_PARTNER_STATUSES.has((str(p.status) ?? '').toLowerCase()),
        ).length,
        partnerTarget: STAGE1_PARTNER_TARGET,
        revenueCents: paid.reduce((n, o) => n + num(o.amount_cents), 0),
      },
      accounts: {
        total: profileRows.length,
        activated: profileRows.filter((p) => (eventsByUser.get(String(p.id)) ?? 0) > 0).length,
        newThisWeek: profileRows.filter((p) => String(p.created_at ?? '') >= weekAgo).length,
      },
      gateway: {
        totalEvents: eventRows.length,
        blocked,
        last7d: recentEvents.count ?? 0,
        syntheticEvents: synthetic.count ?? 0,
      },
      reports: orderRows.map((o) => ({
        id: String(o.id),
        email: str(o.email),
        company: str(o.company),
        vertical: str(o.vertical),
        amountCents: num(o.amount_cents),
        status: str(o.status) ?? 'unknown',
        isWholesale: o.is_wholesale === true,
        partnerRef: str(o.partner_ref),
        createdAt: String(o.created_at ?? ''),
        deliveredAt: str(o.report_delivered_at),
      })),
      partners: partnerRows.map((p) => ({
        id: String(p.id),
        name: str(p.name),
        company: str(p.company),
        email: str(p.email),
        partnerType: str(p.partner_type),
        clientCount: typeof p.client_count === 'number' ? p.client_count : null,
        status: str(p.status) ?? 'new',
        createdAt: String(p.created_at ?? ''),
      })),
      signups: profileRows.map((p) => ({
        id: String(p.id),
        email: str(p.email),
        company: str(p.company),
        tier: str(p.tier),
        role: str(p.role),
        createdAt: String(p.created_at ?? ''),
        events: eventsByUser.get(String(p.id)) ?? 0,
      })),
    }
  } catch (err) {
    console.error('[admin/founder-metrics] read failed:', err)
    // Fail to "not connected", never to a page of zeros. A zero here reads as
    // "nobody bought anything", which is a different and much worse claim than
    // "we could not ask".
    return emptyFounderMetrics(false)
  }
}
