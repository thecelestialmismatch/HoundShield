import type { Metadata } from 'next'
import Link from 'next/link'
import { NavV3 } from '@/components/layout/NavV3'
import { FooterV3 } from '@/components/layout/FooterV3'
import { CheckCircle2, Loader2, CalendarClock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Roadmap',
  description:
    'What HoundShield has shipped, what we are building now, and what is coming next — browser extension, air-gapped mode, SSO, and more.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://houndshield.com'}/roadmap`,
  },
}

type ItemStatus = 'shipped' | 'building' | 'planned'

interface RoadmapItem {
  title: string
  body: string
}

interface RoadmapColumn {
  status: ItemStatus
  label: string
  sublabel: string
  items: RoadmapItem[]
}

const COLUMNS: RoadmapColumn[] = [
  {
    status: 'shipped',
    label: 'Shipped',
    sublabel: 'Live in production today',
    items: [
      { title: 'AI gateway proxy', body: 'One URL change intercepts every prompt to ChatGPT, Copilot, Claude, Gemini, and 800+ models.' },
      { title: '16-engine detection matrix', body: 'CUI, PHI (all 18 HIPAA identifiers), PII, API keys, source code, and financial data — under 10ms.' },
      { title: 'Tamper-evident audit trail', body: 'SHA-256 hash chain on every compliance event, with Base L2 blockchain anchoring.' },
      { title: 'C3PAO-ready PDF reports', body: 'One-click evidence packages covering all 110 NIST 800-171 Rev 2 controls.' },
      { title: 'Live SPRS scoring', body: 'Real-time score (−203 to +110) with per-control gap analysis and remediation priorities.' },
      { title: 'Slack, Teams & SIEM alerts', body: 'Block Kit / Adaptive Cards plus Splunk HEC and Azure Sentinel forwarding.' },
      { title: 'Docker self-host deploy', body: 'Three commands to a hardened, non-root deployment on your own hardware.' },
    ],
  },
  {
    status: 'building',
    label: 'In Progress',
    sublabel: 'Actively in development',
    items: [
      { title: 'Browser extension', body: 'Chrome/Edge interception for browser-native AI tools that bypass the proxy.' },
      { title: 'MCP server integration', body: 'Compliance scanning for Claude Desktop, Cursor, and every MCP-compatible agent tool call.' },
      { title: 'C3PAO partner portal', body: 'White-label, multi-client dashboard for assessors and CMMC consultants.' },
      { title: 'Onboarding email sequence', body: 'Guided day 1 / 3 / 7 path from install to first exported PDF report.' },
    ],
  },
  {
    status: 'planned',
    label: 'Planned',
    sublabel: 'Next on the list',
    items: [
      { title: 'Full air-gapped mode', body: 'Ollama-served local models for IL-5+ environments — zero outbound connections.' },
      { title: 'SAML / SSO', body: 'Okta, Azure AD, and JumpCloud for enterprise identity.' },
      { title: 'Custom pattern library', body: 'Org-specific regex and ML detection rules on top of the 16 core engines.' },
      { title: 'Zero-trust mode', body: 'Deny-by-default AI access with per-team allowlists.' },
      { title: 'Mobile app', body: 'iOS and Android dashboard with push alerts for critical events.' },
      { title: 'Azure Sentinel & Splunk suite', body: 'Deeper SIEM analytics packs and saved searches.' },
    ],
  },
]

const STATUS_STYLE: Record<ItemStatus, { badge: string; icon: typeof CheckCircle2 }> = {
  shipped: { badge: 'bg-[rgba(5,150,105,0.08)] text-[var(--hs-success)] border-[rgba(5,150,105,0.25)]', icon: CheckCircle2 },
  building: { badge: 'bg-[var(--hs-mist)] text-[var(--hs-steel-dark)] border-[var(--hs-border)]', icon: Loader2 },
  planned: { badge: 'bg-[var(--hs-surface-1)] text-[var(--hs-ink-secondary)] border-[var(--hs-border)]', icon: CalendarClock },
}

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <NavV3 />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-[var(--hs-steel-dark)] uppercase mb-3">
            ROADMAP
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--hs-ink)] tracking-tight mb-5">
            Built in the open.<br />Shipped on a deadline.
          </h1>
          <p className="text-lg text-[var(--hs-ink-secondary)] max-w-2xl mx-auto leading-relaxed">
            CMMC enforcement lands November 2026. Here is exactly what HoundShield has
            shipped, what we are building right now, and what comes next.
          </p>
        </div>
      </section>

      {/* Columns */}
      <section className="pb-20 px-6">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map((col) => {
            const style = STATUS_STYLE[col.status]
            const Icon = style.icon
            return (
              <div key={col.status} className="flex flex-col">
                <div className="mb-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${style.badge}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {col.label}
                  </span>
                  <p className="text-xs text-[var(--hs-ink-tertiary)] mt-2">{col.sublabel}</p>
                </div>
                <div className="space-y-3">
                  {col.items.map((item) => (
                    <div
                      key={item.title}
                      className="bg-white border border-[var(--hs-border-subtle)] rounded-xl p-5 hover:border-[var(--hs-border)] hover:shadow-[var(--shadow-md)] transition-all"
                    >
                      <h3 className="text-sm font-semibold text-[var(--hs-ink)] mb-1.5">{item.title}</h3>
                      <p className="text-xs text-[var(--hs-ink-secondary)] leading-relaxed">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 px-6 text-center">
        <div className="max-w-xl mx-auto border border-[var(--hs-border)] bg-[var(--hs-surface-1)] rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-[var(--hs-ink)] mb-4">
            Want to shape what we build?
          </h2>
          <p className="text-[var(--hs-ink-secondary)] mb-8">
            Tell us which integration unblocks your CMMC assessment and we will prioritize it.
          </p>
          <Link href="/contact" className="btn-primary">
            Talk to the team
          </Link>
        </div>
      </section>

      <FooterV3 />
    </div>
  )
}
