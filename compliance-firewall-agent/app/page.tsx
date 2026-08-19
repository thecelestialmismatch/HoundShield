import Link from 'next/link'
import { ArrowRight, Check, Globe, Briefcase, Shield, Brain, FileText, Eye, Zap, Activity } from 'lucide-react'
import { NavV3 } from '@/components/layout/NavV3'
import { FooterV3 } from '@/components/layout/FooterV3'
import { ModeBNotice } from '@/components/ModeBNotice'
import { HeroDemoDashboard } from '@/components/landing/HeroDemoDashboard'
import { UpcomingHeroBanner } from '@/components/landing/UpcomingHeroBanner'
import { ReportOfferCard } from '@/components/ReportOfferCard'
import { FaqSection } from '@/components/seo/FaqSection'
import { homeFaqs } from '@/lib/seo/faqs'
import { ENGINE_COUNT, PATTERN_COUNT } from '@/lib/detection/engines'
import { CROSS_INDUSTRY_GENAI, REGULATED_SHARE_GENAI } from '@/lib/market/netskope'
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
  { n: String(ENGINE_COUNT), l: 'Detection engines',     s: `${PATTERN_COUNT} patterns · CUI · PHI · PII` },
  // Resolved in the #302 <- main merge. Both sides rewrote this same tile:
  // this branch put "2 / deployment paths" here, main put the Netskope figure.
  // The grid is a hard `repeat(4, 1fr)` (app/hermes.css:263), so a fifth tile
  // orphans on its own row — it is genuinely one or the other.
  //
  // Main's tile wins because keeping it loses nothing: <ModeBNotice> renders
  // IMMEDIATELY below this row and already says "CUI-safe = Mode B (Docker on
  // your infrastructure); the hosted trial runs on Vercel and is not
  // FedRAMP-authorized" — the same two paths, with the honesty the NEVER-DO
  // list requires. The Netskope figure has no such second home, and it is the
  // market proof for Rachel, the fastest-closing buyer.
  //
  // Scope matters: this is the GENERATIVE-AI slice, not all healthcare
  // violations (that figure is 81%). Both live in lib/market/netskope.ts with
  // their denominators attached, so the tile cannot drift off its source.
  { n: REGULATED_SHARE_GENAI.value, l: 'of healthcare genAI', s: `violations involve regulated data — vs ${CROSS_INDUSTRY_GENAI.value} across all industries` },
  { n: '110',                l: 'NIST 800-171 controls', s: 'Mapped & SPRS-scored' },
  { n: '<10ms',              l: 'Local scan target',     s: 'Measured locally; workload dependent' },
]

const PLATFORM_CARDS = [
  { Icon: Shield,   chip: '110 controls', title: 'CMMC Self-Assessment',    body: 'Guided questionnaires across all 110 NIST SP 800-171 controls. Your SPRS score updates live as you complete each practice.' },
  { Icon: Brain,    chip: 'Prioritized',  title: 'AI-Powered Gap Analysis', body: 'Brain AI flags unmet controls and generates a remediation roadmap ranked by risk severity and cost — on-device, your key.' },
  { Icon: FileText, chip: '1-click',      title: 'SSP & POA&M Export',      body: 'Auto-generate your System Security Plan and Plan of Action & Milestones as C3PAO-ready PDFs with SHA-256 signed evidence.' },
  { Icon: Eye,      chip: null,           title: 'AI Prompt Interception',  body: 'Every LLM request inspected before it leaves the perimeter. Works with ChatGPT, Copilot, Claude, Gemini — all at once.' },
  { Icon: Zap,      chip: null,           title: `${ENGINE_COUNT} Detection Engines`, body: `PHI, CUI, PII, IP, secrets, CAGE codes, contract numbers and clearance markers — ${PATTERN_COUNT} shipped patterns, flagged, blocked or quarantined.` },
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
              {/* No SOC 2 here. In a badge row next to "Local-only" it reads as a
                  certification we hold, and we have not started SOC 2 — the pitch
                  deck says so in as many words. Claiming it to an RPO principal who
                  asks for the report costs the relationship, not just the deal. */}
              <div className="pill"><i className="live-dot" /> Local-only · HIPAA · NIST 800-171</div>
              {/* Renders nothing today. Flip one item's `promote` in
                  lib/product/upcoming.ts when it is close enough that a
                  visitor would act on it. */}
              <UpcomingHeroBanner />
              <h1 className="display">
                Keep regulated data inside <span className="accent">your control boundary.</span>
              </h1>
              <p className="sub">
                Evaluate AI prompt controls without pretending every workload is the same. HoundShield
                scans compatible traffic <b>inside your environment</b>, helps you document the control
                boundary, and produces an evidence-oriented assessment mapped to HIPAA and NIST 800-171.
              </p>
              <div className="hero-actions">
                <Link className="btn btn-primary" href="/demo#snapshot">
                  Explore the control boundary <ArrowRight />
                </Link>
                <Link className="btn btn-ghost" href="/pricing">Get the $499 report</Link>
              </div>
              <div className="hero-trust">
                <span><Check /> Hosted evaluation clearly labelled</span>
                <span><Check /> Self-hosted path for sensitive workloads</span>
                <span><Check /> Your deployment, your boundary</span>
                <span><Check /> Evidence-oriented PDF</span>
              </div>
            </div>
            <HeroDemoDashboard />
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
              <h2 className="display">Start with the boundary your assessor will ask about.</h2>
              <p>
                Cloud controls, Microsoft governance and local proxy enforcement solve different problems.
                HoundShield is designed for teams that need a self-hosted control path for AI traffic outside
                their existing productivity suite. Validate the deployment model against your contract and SSP.
              </p>
            </div>
            <div className="grid-3">
              <div className="card">
                <div className="ic"><Globe /></div>
                <h3>Nightfall &amp; Strac</h3>
                <p>
                  Broad cloud DLP can be a strong fit for SaaS data protection. Teams handling controlled
                  data should document its data path and decide whether a cloud inspection model fits their boundary.
                </p>
              </div>
              <div className="card">
                <div className="ic"><Briefcase /></div>
                <h3>Microsoft Purview</h3>
                <p>
                  Strong Microsoft 365 governance. It complements—not replaces—a deliberate control path for
                  third-party AI services and developer tools outside the Microsoft productivity surface.
                </p>
              </div>
              <div className="card" style={{ borderColor: 'var(--brand)' }}>
                <div className="ic"><Shield /></div>
                <h3>HoundShield</h3>
                <p>
                  A self-hosted enforcement option for compatible AI traffic. Detection runs in your environment;
                  use the deployment guide to validate scope, integrations and data residency before rollout.
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

        {/* ── $499 REPORT OFFER (Stage-1 lead product) ─────────── */}
        <div className="section tight">
          <div className="container">
            <ReportOfferCard />
          </div>
        </div>

        {/* ── FAQ (visible Q&A + FAQPage JSON-LD, AEO) ─────────── */}
        <div className="section alt tight">
          <div className="container">
            <FaqSection
              items={homeFaqs}
              title="Questions teams ask before deploying"
              className="!py-0"
            />
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
