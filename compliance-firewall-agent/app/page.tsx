import Link from 'next/link'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { NavV3 } from '@/components/layout/NavV3'
import { FooterV3 } from '@/components/layout/FooterV3'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { PlatformDashboardClient } from '@/components/landing/PlatformDashboardClient'
import { ComparisonFlow } from '@/components/ui/ComparisonFlow'
import { FaqAccordion, type FaqItem } from '@/components/ui/FaqAccordion'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { FeaturesGrid } from '@/components/landing/FeaturesGrid'

const STATS = [
  { value: '16',       label: 'Detection engines',  sub: 'CUI · PHI · PII · IP' },
  { value: '~80,000',  label: 'contractors at risk', sub: 'Need CMMC Level 2' },
  { value: 'Nov 2026', label: 'CMMC deadline',       sub: 'For DoD prime contractors' },
  { value: '<10ms',    label: 'Scan latency',        sub: 'Median, fully local' },
]

const STEPS = [
  {
    n: '01',
    title: 'Change one URL',
    body: 'Replace api.openai.com with your HoundShield endpoint. No agents, no code changes, no firewall rules.',
    code: 'OPENAI_BASE_URL=https://proxy.houndshield.com',
  },
  {
    n: '02',
    title: 'Every prompt scanned locally',
    body: '16 detection engines check each request in under 10ms on your infrastructure. The AI never knows.',
  },
  {
    n: '03',
    title: 'You get a compliance record',
    body: 'Tamper-proof SHA-256 signed logs. Exportable PDF evidence for your C3PAO or auditor on demand.',
  },
]

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Does prompt content ever leave my network?',
    answer: 'No. HoundShield runs entirely on your infrastructure. The scanning engine, detection patterns, and audit logs all stay local. Only a license key hash and prompt count (no content) go external for billing.',
  },
  {
    question: 'How long does setup take?',
    answer: 'Under 10 minutes for most organizations. Change one environment variable to point AI tools at your HoundShield endpoint. Docker deployment is 3 commands. No agents, no firewall rules, no code changes.',
  },
  {
    question: 'Which AI tools does HoundShield support?',
    answer: "Any tool using an OpenAI-compatible API: ChatGPT, Copilot, Claude, Gemini, Cursor, Codeium, and open-source models. It operates at the network layer, so it's model-agnostic.",
  },
  {
    question: 'Is HoundShield CMMC Level 2 compliant?',
    answer: "HoundShield maps all 110 NIST 800-171 Rev 2 controls and generates C3PAO-ready PDF evidence. Because it's local-only, CUI never crosses your control boundary.",
  },
  {
    question: 'What happens when a violation is detected?',
    answer: 'The prompt is blocked and the user receives a policy violation message. A tamper-proof, SHA-256 signed log entry is created with the timestamp, matched pattern, and affected framework.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <NavV3 />

      {/* ── 1. HERO ─────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(129,166,198,0.15), transparent 70%)' }}
        />

        <div className="relative max-w-6xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--hs-border)] bg-white text-xs font-medium text-[var(--hs-ink-secondary)] font-[var(--font-body)] shadow-[var(--shadow-sm)]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              CMMC Level 2 deadline: November 2026
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-[var(--hs-ink)] leading-tight tracking-tight mb-6"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Stop your team from leaking CUI to{' '}
                <span className="text-gradient-brand">ChatGPT.</span>
              </h1>

              <p className="text-lg text-[var(--hs-ink-secondary)] leading-relaxed mb-8 max-w-lg font-[var(--font-body)]">
                HoundShield intercepts every AI prompt before it leaves your network. 16 detection engines. Sub-10ms latency. CMMC Level 2, HIPAA, and SOC 2 — enforced simultaneously.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/sign-up" className="btn-primary text-sm">
                  Start free — no card required
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/how-it-works" className="btn-ghost text-sm">
                  See how it works
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
                {['One URL change', 'Local-only', 'Free to start', 'C3PAO-ready'].map((t) => (
                  <span key={t} className="flex items-center gap-1.5 text-xs text-[var(--hs-ink-tertiary)] font-[var(--font-body)]">
                    <CheckCircle className="w-3.5 h-3.5 text-[var(--hs-steel)]" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden shadow-[var(--shadow-xl)] border border-[var(--hs-border)]">
              <PlatformDashboardClient />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. STATS STRIP ──────────────────────────────────────── */}
      <section className="py-14 border-y border-[var(--hs-border-subtle)] bg-[var(--hs-surface-2)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div
                  className="text-3xl sm:text-4xl font-semibold text-[var(--hs-ink)] mb-1 tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {s.value}
                </div>
                <div className="text-sm font-semibold text-[var(--hs-ink-secondary)] mb-0.5 font-[var(--font-body)]">
                  {s.label}
                </div>
                <div className="text-xs text-[var(--hs-ink-tertiary)] font-[var(--font-body)]">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. ASYMMETRIC ADVANTAGE ─────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--hs-navy)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--hs-steel-dark)]/10 to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-[var(--hs-sky)] uppercase mb-3 font-[var(--font-body)]">
              THE ASYMMETRIC ADVANTAGE
            </p>
            <h2
              className="text-3xl sm:text-4xl font-semibold text-white mb-4 leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Every other tool makes
              <br />
              the problem worse.
            </h2>
            <p className="text-base text-[var(--hs-sky)]/80 max-w-2xl mx-auto font-[var(--font-body)]">
              Nightfall, Strac, and Microsoft Purview all send your CUI to their cloud to scan it.
              That&apos;s itself a DFARS 7012 spill. HoundShield scans locally. Nothing leaves your network.
            </p>
          </div>
          <ComparisonFlow />
        </div>
      </section>

      {/* ── 4. FEATURES GRID ────────────────────────────────────── */}
      <FeaturesGrid />

      {/* ── 5. HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--hs-surface-1)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-3xl sm:text-4xl font-semibold text-[var(--hs-ink)] mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Live in ten minutes.
              <br />
              Audited in ten seconds.
            </h2>
            <p className="text-base text-[var(--hs-ink-secondary)] max-w-xl mx-auto font-[var(--font-body)]">
              No agents. No code changes. One environment variable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.n} className="glass-card p-6">
                <div
                  className="text-xs font-semibold tracking-widest mb-3 font-[var(--font-mono)]"
                  style={{ color: 'var(--hs-steel)' }}
                >
                  {step.n}
                </div>
                <h3 className="text-base font-semibold text-[var(--hs-ink)] mb-2 font-[var(--font-body)]">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed mb-4 font-[var(--font-body)]">
                  {step.body}
                </p>
                {step.code && <CodeBlock code={step.code} language="env" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. JORDAN SECTION ───────────────────────────────────── */}
      <section
        className="py-20 px-4 sm:px-6 lg:px-8 border-y border-[var(--hs-border-subtle)]"
        style={{ background: 'var(--hs-surface-2)' }}
        data-testid="jordan-section"
      >
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-[var(--hs-steel-dark)] uppercase mb-8 text-center font-[var(--font-body)]">
            BUILT FOR JORDAN
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
            <div className="lg:col-span-3">
              <blockquote>
                <p
                  className="text-2xl sm:text-3xl font-semibold text-[var(--hs-ink)] leading-snug mb-6"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  &ldquo;I needed the PDF I could hand my C3PAO assessor. Not another dashboard that tells me I have problems.&rdquo;
                </p>
                <footer>
                  <div className="text-sm font-semibold text-[var(--hs-ink)] font-[var(--font-body)]">Jordan M.</div>
                  <div className="text-sm text-[var(--hs-ink-tertiary)] font-[var(--font-body)]">IT Security Manager · 180-person DoD subcontractor</div>
                </footer>
              </blockquote>
            </div>

            <div className="lg:col-span-2">
              <div className="glass-card p-5 space-y-3">
                <div className="text-xs font-semibold text-[var(--hs-ink-tertiary)] uppercase tracking-wider mb-1 font-[var(--font-body)]">
                  Buyer Profile
                </div>
                {[
                  { label: 'Role',     value: 'IT Security Manager' },
                  { label: 'Company',  value: '180-person DoD subcontractor' },
                  { label: 'Fear',     value: 'CUI spill triggering DFARS audit' },
                  { label: 'Goal',     value: 'CMMC Level 2 certification by Nov 2026' },
                  { label: 'Budget',   value: '$500–$1,500/mo' },
                  { label: 'Deadline', value: 'November 10, 2026' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-3">
                    <span className="text-xs text-[var(--hs-ink-tertiary)] font-[var(--font-body)] w-16 shrink-0 pt-px">{label}</span>
                    <span className="text-xs text-[var(--hs-ink)] font-[var(--font-body)] font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. PRICING — HERMES STAGE 1 LEAD PRODUCT ───────────── */}
      {/* See DECISIONS.md 2026-05-26: $499 one-time report is the front-door offer.
          Subscription tiers ($299/$799/$1,499) are Stage 2, deferred to /pricing. */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--hs-surface-1)]" id="pricing">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest text-[var(--hs-steel-dark)] uppercase mb-4 font-[var(--font-body)]">
            Stage 1 — Lead Product
          </p>

          <h2
            className="text-3xl sm:text-4xl font-semibold text-[var(--hs-ink)] mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            $499. One-time. C3PAO-ready PDF in two weeks.
          </h2>

          <p className="text-lg font-semibold text-[var(--hs-ink)] mb-2 font-[var(--font-body)]">
            CMMC AI Risk Assessment Report
          </p>

          <p className="text-base text-[var(--hs-ink-secondary)] mb-8 max-w-xl mx-auto font-[var(--font-body)]">
            14-day deployment in your environment. 110 NIST 800-171 Rev 2 controls mapped. Signed PDF your C3PAO accepts. One PO. No MSA required.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link
              href="/contact?subject=cmmc-report"
              className="btn-primary text-sm"
            >
              Get your report — $499
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-xs text-[var(--hs-ink-tertiary)] font-[var(--font-body)]">
            Need ongoing monitoring?{' '}
            <Link href="/pricing" className="text-[var(--hs-steel-dark)] underline">
              See Stage 2 subscription tiers
            </Link>
            {' '}— available July 2026.
          </p>
        </div>
      </section>

      {/* ── 8. FAQ ──────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-semibold text-[var(--hs-ink)] text-center mb-12"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Frequently asked
          </h2>
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* ── 9. FINAL CTA ────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--hs-navy)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--hs-steel-dark)]/10 to-transparent" />

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="text-xs text-[var(--hs-sky)] uppercase tracking-widest mb-4 font-semibold font-[var(--font-body)]">
            CMMC Level 2 deadline
          </div>

          <div className="flex justify-center mb-6">
            <CountdownTimer />
          </div>

          <h2
            className="text-3xl sm:text-4xl font-semibold text-white mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            The audit doesn&apos;t care if you were busy.
          </h2>
          <p className="text-base text-[var(--hs-sky)] mb-10 max-w-lg mx-auto font-[var(--font-body)]">
            One URL change. 10 minutes to full AI compliance coverage. Your assessor will ask what changed — the answer is everything.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-[var(--hs-navy)] bg-white rounded-[var(--radius-md)] hover:bg-[var(--hs-cream)] transition-colors font-[var(--font-body)]"
            >
              Start free — deploy in 10 min
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white border border-white/20 rounded-[var(--radius-md)] hover:bg-white/10 transition-colors font-[var(--font-body)]"
            >
              Talk to a compliance expert
            </Link>
          </div>
        </div>
      </section>

      <FooterV3 />
    </div>
  )
}
