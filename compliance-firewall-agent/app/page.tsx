import Link from 'next/link'
import { ArrowRight, Check, Globe, Briefcase, Shield, Brain, FileText, Eye, Zap, Activity } from 'lucide-react'
import { NavV3 } from '@/components/layout/NavV3'
import { FooterV3 } from '@/components/layout/FooterV3'
import { ModeBNotice } from '@/components/ModeBNotice'
import { HeroScanLog } from '@/components/landing/HeroScanLog'
import type { Metadata } from 'next'

// Self-referencing canonical for the homepage. The root layout no longer sets a
// cascading canonical, so the homepage declares its own here.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

/* ─────────────────────────────────────────────────────────────────
 * Homepage — verbatim port of the HERMES demo's home view
 * (Direction A · Steel & Cream). Section order matches the demo
 * exactly: hero → stat-row → asymmetric advantage → one platform →
 * CTA band. All styling lives in app/hermes.css.
 *
 * One deliberate addition (compliance gate, not design): the Mode-B
 * deployment-boundary notice after the stat row — the hosted plane
 * is never presented as CUI-safe (CLAUDE.md NEVER-DO list).
 * ───────────────────────────────────────────────────────────────── */

const STATS = [
  { n: '16',      l: 'Detection engines',    s: 'CUI · PHI · PII · IP' },
  { n: '~80,000', l: 'Contractors at risk',  s: 'Need CMMC Level 2' },
  { n: '110',     l: 'NIST 800-171 controls', s: 'Mapped & SPRS-scored' },
  { n: '<10ms',   l: 'Scan latency',         s: 'Median, fully local' },
]

const PLATFORM_CARDS = [
  { Icon: Shield,   chip: '110 controls', title: 'CMMC Self-Assessment',    body: 'Guided questionnaires across all 110 NIST SP 800-171 controls. Your SPRS score updates live as you complete each practice.' },
  { Icon: Brain,    chip: 'Prioritized',  title: 'AI-Powered Gap Analysis', body: 'Brain AI flags unmet controls and generates a remediation roadmap ranked by risk severity and cost — on-device, your key.' },
  { Icon: FileText, chip: '1-click',      title: 'SSP & POA&M Export',      body: 'Auto-generate your System Security Plan and Plan of Action & Milestones as C3PAO-ready PDFs with SHA-256 signed evidence.' },
  { Icon: Eye,      chip: null,           title: 'AI Prompt Interception',  body: 'Every LLM request inspected before it leaves the perimeter. Works with ChatGPT, Copilot, Claude, Gemini — all at once.' },
  { Icon: Zap,      chip: null,           title: '16 Detection Engines',    body: 'CUI, PII, IP, PHI, secrets, CAGE codes, contract numbers and clearance markers — flagged, blocked or quarantined.' },
  { Icon: Activity, chip: null,           title: 'Live Threat Dashboard',   body: 'Real-time blocked prompts, risk scores and compliance posture for every employee, in one command center.' },
]

export default function HomePage() {
  return (
    <div className="hermes" style={{ minHeight: '100vh' }}>
      <NavV3 />

      <main className="page">
        {/* ── HERO ─────────────────────────────────────────────── */}
        <div className="hero">
          <div className="container hero-grid">
            <div>
              <div className="pill"><i className="live-dot" /> Local-only · CMMC Level 2 · HIPAA · SOC 2</div>
              <h1 className="display">
                Stop your team from leaking <span className="accent">CUI to ChatGPT.</span>
              </h1>
              <p className="sub">
                HoundShield intercepts every AI prompt before it leaves your network. 16 detection
                engines. Sub-10ms latency. CMMC Level 2, HIPAA &amp; SOC 2 — enforced simultaneously,
                scanned <b>on your hardware</b>.
              </p>
              <div className="hero-actions">
                <Link className="btn btn-primary" href="/signup">
                  Start free — no card required <ArrowRight />
                </Link>
                <Link className="btn btn-ghost" href="/how-it-works">See how it works</Link>
              </div>
              <div className="hero-trust">
                <span><Check /> One URL change</span>
                <span><Check /> Local-only</span>
                <span><Check /> Free to start</span>
                <span><Check /> C3PAO-ready</span>
              </div>
            </div>
            <HeroScanLog />
          </div>
        </div>

        {/* ── STAT ROW ─────────────────────────────────────────── */}
        <div className="container" style={{ paddingTop: 34, paddingBottom: 34 }}>
          <div className="stat-row">
            {STATS.map((s) => (
              <div className="stat" key={s.l}>
                <div className="n">{s.n}</div>
                <div className="l">{s.l}</div>
                <div className="s">{s.s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Deployment boundary: Mode A vs Mode B (CUI honesty) ── */}
        <div className="container" style={{ paddingBottom: 10 }}>
          <ModeBNotice variant="inline" />
        </div>

        {/* ── ASYMMETRIC ADVANTAGE ─────────────────────────────── */}
        <div className="section tight">
          <div className="container">
            <div className="section-head">
              <div className="eyebrow">The asymmetric advantage</div>
              <h2 className="display">Cloud DLP scans your CUI in their cloud. That&apos;s the spill.</h2>
              <p>
                Every cloud-based AI DLP tool has to receive your data to inspect it. For a DoD
                contractor, that transmission is itself a DFARS 7012 CUI exposure. HoundShield is
                the only one that never sees your data.
              </p>
            </div>
            <div className="grid-3">
              <div className="card">
                <div className="ic"><Globe /></div>
                <h3>Nightfall &amp; Strac</h3>
                <p>
                  Cloud DLP. To scan a prompt they must transmit your CUI to their servers — the
                  exact exposure CMMC L2 forbids. Architecturally disqualified for the DIB.
                </p>
              </div>
              <div className="card">
                <div className="ic"><Briefcase /></div>
                <h3>Microsoft Purview</h3>
                <p>
                  M365-only. No API proxy. Your team&apos;s ChatGPT, Claude, Cursor and Copilot
                  traffic outside Microsoft&apos;s walls goes completely unmonitored.
                </p>
              </div>
              <div className="card" style={{ borderColor: 'var(--brand)' }}>
                <div className="ic"><Shield /></div>
                <h3>HoundShield</h3>
                <p>
                  Local-only. Detection runs on <b>your</b> hardware. Nothing reaches our servers —
                  ever. The moat cloud vendors can&apos;t match without a full rebuild.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── ONE PLATFORM ─────────────────────────────────────── */}
        <div className="section tight" style={{ background: 'var(--page-2)' }}>
          <div className="container">
            <div className="section-head">
              <div className="eyebrow">One platform</div>
              <h2 className="display">Everything you need for CMMC Level 2</h2>
              <p>
                Map, assess and close gaps across all 110 NIST 800-171 controls — with AI-driven
                remediation and C3PAO-ready evidence.
              </p>
            </div>
            <div className="grid-3">
              {PLATFORM_CARDS.map((c) => (
                <div className="card" key={c.title}>
                  {c.chip && <span className="chip">{c.chip}</span>}
                  <div className="ic"><c.Icon /></div>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA BAND ─────────────────────────────────────────── */}
        <div className="section tight">
          <div className="container">
            <div className="cta-band">
              <h2 className="display">Ready to protect your CUI?</h2>
              <p>
                No credit card required. Assess all 110 controls and see your SPRS score in under
                30 minutes.
              </p>
              <Link className="btn btn-primary" href="/signup">
                Get started free <ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <FooterV3 />
    </div>
  )
}
