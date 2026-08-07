import Link from 'next/link'
import { ArrowLeft, Target, Users, Activity, Handshake, Receipt } from 'lucide-react'
import type { FounderMetrics } from '@/lib/admin/founder-metrics'

/**
 * Presentation only — every number arrives already computed and already true.
 *
 * The one rule running through this file: a zero is rendered as a zero, and a
 * "we could not ask" is rendered as that, never as a zero. Those are different
 * claims and the founder makes different decisions on them.
 */

const money = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const when = (iso: string) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—')

function Gate({ label, value, target, note }: { label: string; value: number; target: number; note: string }) {
  const met = value >= target
  const pct = Math.min(100, Math.round((value / Math.max(1, target)) * 100))
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-semibold text-slate-600">{label}</span>
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide uppercase ${
            met
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border border-amber-200 bg-amber-50 text-amber-700'
          }`}
        >
          {met ? 'met' : 'open'}
        </span>
      </div>
      <div className="mt-2 font-mono text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
        {value}
        <span className="text-lg text-slate-400"> / {target}</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${met ? 'bg-emerald-500' : 'bg-amber-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2.5 text-[12px] leading-snug text-slate-500">{note}</p>
    </div>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="text-[13px] font-semibold text-slate-600">{label}</div>
      <div className="mt-1.5 font-mono text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</div>
      <p className="mt-1.5 text-[12px] leading-snug text-slate-500">{note}</p>
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  sub,
  children,
}: {
  icon: typeof Users
  title: string
  sub: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-9">
      <div className="mb-3 flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-slate-400" aria-hidden />
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
        <span className="text-[12px] text-slate-500">{sub}</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">{children}</div>
    </section>
  )
}

const TH = 'px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500'
const TD = 'px-4 py-2.5 text-[13px] text-slate-700 whitespace-nowrap'

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-6 text-[13px] text-slate-500">{children}</p>
}

export function AdminPanel({ metrics }: { metrics: FounderMetrics }) {
  const { stage1, accounts, gateway, reports, partners, signups } = metrics

  return (
    <div className="min-h-screen bg-[#f6f9fc] px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-editorial text-2xl font-semibold tracking-tight text-slate-900">
              Founder admin
            </h1>
            <p className="mt-1 text-[13px] text-slate-600">
              Every tenant, one view. The only surface in the product that reads across accounts.
            </p>
          </div>
          <Link
            href="/command-center/overview"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Your dashboard
          </Link>
        </div>

        {!metrics.connected && (
          /* Not "everything is zero" — "we could not ask". Different claim, and
             the founder makes a different decision on each. */
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-900">
            <b>No database connection.</b> These figures could not be read, so nothing below is a
            measurement. This is not the same as &ldquo;no customers yet&rdquo; — check
            <code className="mx-1 rounded bg-amber-100 px-1 py-0.5 font-mono text-[12px]">
              SUPABASE_SERVICE_ROLE_KEY
            </code>
            before drawing any conclusion.
          </div>
        )}

        {/* ── Stage 1 gate ──────────────────────────────────────────────── */}
        <div className="mt-7 flex items-center gap-2.5">
          <Target className="h-4 w-4 text-slate-400" aria-hidden />
          <h2 className="text-[15px] font-semibold text-slate-900">Stage 1 gate</h2>
          <span className="text-[12px] text-slate-500">both must be met before Stage 2 opens</span>
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Gate
            label="Paid $499 reports"
            value={stage1.paidReports}
            target={stage1.reportTarget}
            note="report_orders with status=paid. A pending checkout is not revenue."
          />
          <Gate
            label="Signed channel partners"
            value={stage1.signedPartners}
            target={stage1.partnerTarget}
            note="RPO/MSP applications marked signed, approved or active."
          />
          <Stat
            label="Revenue collected"
            value={money(stage1.revenueCents)}
            note="Sum of paid orders. Not billings, not pipeline."
          />
          <Stat
            label="Accounts"
            value={`${accounts.total}`}
            note={`${accounts.activated} have sent a prompt · ${accounts.newThisWeek} new this week`}
          />
        </div>

        {/* ── Gateway, all tenants ──────────────────────────────────────── */}
        <div className="mt-7 flex items-center gap-2.5">
          <Activity className="h-4 w-4 text-slate-400" aria-hidden />
          <h2 className="text-[15px] font-semibold text-slate-900">Gateway, all tenants</h2>
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat
            label="Events, all time"
            value={gateway.totalEvents.toLocaleString('en-US')}
            note={
              gateway.syntheticEvents > 0
                ? `${gateway.syntheticEvents.toLocaleString('en-US')} of these are seeded demo rows — not traction`
                : 'All observed traffic. No seeded rows.'
            }
          />
          <Stat
            label="Blocked"
            value={gateway.blocked.toLocaleString('en-US')}
            note="Prompts stopped before reaching a provider."
          />
          <Stat
            label="Last 7 days"
            value={gateway.last7d.toLocaleString('en-US')}
            note="Events across every account in the past week."
          />
        </div>

        {/* ── Orders ────────────────────────────────────────────────────── */}
        <Section icon={Receipt} title="Report orders" sub={`${reports.length} most recent`}>
          {reports.length === 0 ? (
            <Empty>
              No orders yet. The Stage 1 gate is three paid reports — this table is where the first
              one shows up.
            </Empty>
          ) : (
            <table className="w-full border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className={TH}>Date</th>
                  <th className={TH}>Company</th>
                  <th className={TH}>Email</th>
                  <th className={TH}>Vertical</th>
                  <th className={TH}>Amount</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Delivered</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0">
                    <td className={`${TD} font-mono text-slate-500`}>{when(r.createdAt)}</td>
                    <td className={`${TD} font-medium text-slate-900`}>
                      {r.company ?? '—'}
                      {r.isWholesale && (
                        <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                          wholesale{r.partnerRef ? ` · ${r.partnerRef}` : ''}
                        </span>
                      )}
                    </td>
                    <td className={TD}>{r.email ?? '—'}</td>
                    <td className={TD}>{r.vertical ?? '—'}</td>
                    <td className={`${TD} font-mono tabular-nums`}>{money(r.amountCents)}</td>
                    <td className={TD}>
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ${
                          r.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className={`${TD} font-mono text-slate-500`}>
                      {r.deliveredAt ? when(r.deliveredAt) : 'not yet'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* ── Partner applications ──────────────────────────────────────── */}
        <Section icon={Handshake} title="Partner applications" sub={`${partners.length} most recent`}>
          {partners.length === 0 ? (
            <Empty>
              No applications yet. One signed RPO/MSP referral agreement is the other half of the
              Stage 1 gate.
            </Empty>
          ) : (
            <table className="w-full border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className={TH}>Date</th>
                  <th className={TH}>Company</th>
                  <th className={TH}>Contact</th>
                  <th className={TH}>Type</th>
                  <th className={TH}>Clients</th>
                  <th className={TH}>Status</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className={`${TD} font-mono text-slate-500`}>{when(p.createdAt)}</td>
                    <td className={`${TD} font-medium text-slate-900`}>{p.company ?? '—'}</td>
                    <td className={TD}>{p.name ?? p.email ?? '—'}</td>
                    <td className={TD}>{p.partnerType ?? '—'}</td>
                    <td className={`${TD} font-mono tabular-nums`}>{p.clientCount ?? '—'}</td>
                    <td className={TD}>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* ── Signups ───────────────────────────────────────────────────── */}
        <Section icon={Users} title="Accounts" sub={`${signups.length} most recent`}>
          {signups.length === 0 ? (
            <Empty>No accounts yet.</Empty>
          ) : (
            <table className="w-full border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className={TH}>Joined</th>
                  <th className={TH}>Email</th>
                  <th className={TH}>Company</th>
                  <th className={TH}>Tier</th>
                  <th className={TH}>Role</th>
                  <th className={TH}>Events</th>
                </tr>
              </thead>
              <tbody>
                {signups.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0">
                    <td className={`${TD} font-mono text-slate-500`}>{when(s.createdAt)}</td>
                    <td className={`${TD} font-medium text-slate-900`}>{s.email ?? '—'}</td>
                    <td className={TD}>{s.company ?? '—'}</td>
                    <td className={TD}>{s.tier ?? 'free'}</td>
                    <td className={TD}>
                      {s.role === 'admin' ? (
                        <span className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] text-white">
                          admin
                        </span>
                      ) : (
                        (s.role ?? 'user')
                      )}
                    </td>
                    <td className={`${TD} font-mono tabular-nums`}>
                      {s.events > 0 ? (
                        s.events.toLocaleString('en-US')
                      ) : (
                        <span className="text-slate-400">never connected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <p className="mt-8 text-[12px] leading-relaxed text-slate-500">
          Every figure here is a count of rows that exist. No projections, no run-rate, no estimated
          pipeline. Seeded demo events are called out separately so a fixture can never be read as
          traction.
        </p>
      </div>
    </div>
  )
}
