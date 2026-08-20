'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RISK_REPORT, formatUSD } from '@/lib/pricing/plans'
import { NAV_TRUST_BADGE } from '@/lib/site/metrics'
import { PURCHASABLE_OFFER } from '@/lib/billing/entitlements'
import {
  Menu, ChevronDown, ArrowRight,
  Lock, Heart, Shield, Briefcase, Globe, Landmark,
  Eye, Zap, FileCheck, Activity, Users, Plug, Terminal, HelpCircle,
} from 'lucide-react'

/* ──────────────────────────────────────────────────────────────────
 * HERMES Direction-A nav — exact-match port of the approved demo's
 * `.nav / .brand / .dropdown` system. All styling lives in
 * app/hermes.css (verbatim demo CSS); this file is only markup.
 *
 * Deliberate deviations from the demo (documented, guard-tested):
 *  - live-badge shows real numbers (16 engines · <10ms scan), not the
 *    demo's fabricated "14,372 intercepted" counter (Rule: real
 *    numbers only — enforced by NavV3 test).
 *  - Partners dropdown is RPO/MSP-framed, never C3PAO referral
 *    (32 CFR Part 170 — NEVER-DO list).
 *  - Pricing rows read the single pricing source of truth so the nav
 *    can never drift from /pricing.
 * ────────────────────────────────────────────────────────────────── */

interface MenuItem {
  icon: React.ElementType
  label: string
  tag?: string
  soon?: boolean
  body: string
  href: string
}

// Products by industry — demo's wide 3-col mega-menu.
const INDUSTRIES: MenuItem[] = [
  { icon: Lock,      label: 'Technology',      tag: 'SOC 2',   body: 'Engineers pasting API keys & source into Copilot.', href: '/products/technology' },
  { icon: Heart,     label: 'Healthcare',      tag: 'HIPAA',   body: 'Clinicians pasting PHI into AI for documentation.',  href: '/products/healthcare' },
  { icon: Shield,    label: 'Defense',         tag: 'CMMC L2', body: 'DoD contractors leaking CUI into proposal tools.',   href: '/products/defense' },
  // Reinstated 2026-08-07 (founder decision): enforcement was paused on
  // 13 July 2026 pending the DoW review and no replacement date was issued, so
  // HoundShield continues to work to 10 November 2026 — and the buyer searching
  // "CMMC Phase 2" has a page again.
  { icon: Shield,    label: 'CMMC Phase 2',    tag: 'Nov 10',  body: 'What is binding today, and how to be ready.',        href: '/cmmc-phase-2' },
  { icon: Briefcase, label: 'Legal & Finance', tag: 'PCI',     body: 'Privileged client data shared with AI assistants.',  href: '/products/legal' },
  { icon: Globe,     label: 'Five Eyes',       tag: 'AUKUS',   body: 'Allied suppliers navigating DISP & Essential 8.',    href: '/products/global' },
  { icon: Landmark,  label: 'Government',      soon: true,     body: 'FedRAMP / FISMA — agency AI governance.',            href: '/products/government' },
]

const FEATURES: MenuItem[] = [
  { icon: Eye,       label: 'AI Prompt Interception', body: 'Every LLM request inspected before it leaves the network.', href: '/features#interception' },
  { icon: Zap,       label: '16 Detection Engines',   body: 'CUI, PII, IP, PHI, secrets, CAGE codes, clearances.',       href: '/features#engines' },
  { icon: FileCheck, label: 'Immutable Audit Trail',  body: 'SHA-256 tamper-evident logs. assessor-reviewable.',                 href: '/features#audit' },
  { icon: FileCheck, label: 'Evidence Intake',         body: 'Review selected PDFs locally with human approval.',          href: '/evidence-intake' },
  // Points at the PUBLIC demo, not the dashboard. The dashboard moved behind
  // login on 2026-07-29, so a prospect clicking a FEATURES flyout item would
  // otherwise land on a login wall — /demo scans a real prompt with no signup.
  { icon: Activity,  label: 'Live Threat Dashboard',  body: 'Scan a real prompt and watch it get blocked — no signup.',  href: '/demo' },
]

const PARTNERS: MenuItem[] = [
  { icon: Shield, label: 'RPO / MSP Referral', body: 'Co-brand the $499 report · keep the margin.',   href: '/partners#reseller' },
  { icon: Users,  label: 'MSP / Agency',       body: '40% per report · 20% recurring · white-label.', href: '/partners#reseller' },
  { icon: Plug,   label: 'Integrations',       body: 'Drop-in proxy for ChatGPT, Copilot, Claude.',   href: '/docs#integrations' },
]

const DOCS: MenuItem[] = [
  { icon: Zap,        label: 'Quickstart',    body: 'One URL change → scoped control coverage.',        href: '/docs#quickstart' },
  { icon: Terminal,   label: 'API Reference', body: 'Gateway, classifier & audit endpoints.',   href: '/docs#api' },
  { icon: HelpCircle, label: 'FAQ',           body: 'Searchable answers — pricing, HIPAA, CUI.', href: '/faq' },
]

/*
 * Pricing rows — sourced from the pricing single source of truth.
 *
 * This flyout used to list four monthly tiers (Free / $199 / $499 / $999),
 * every row linking to /pricing. But /pricing deliberately sells exactly one
 * thing — the $499 one-time report — and its own guard asserts the page shows
 * no monthly price at all. So a visitor who clicked the "Pro" row in the nav
 * landed on a page that offered no such plan, on every page of the site.
 *
 * The subscription ladder in lib/pricing/plans.ts is NOT deleted: it is the
 * deliberate secondary ladder that returns once three customers have paid
 * $499. It simply must not be quoted in site-wide chrome before it can be
 * bought (CLAUDE.md: never a second pricing grid, never lead with a
 * subscription before the report is proven to sell).
 *
 * Both rows below are things a buyer can actually purchase today.
 */
const PRICES = [
  {
    label: 'AI Risk Assessment Report',
    note: '14-day scan → signed NIST 800-171 PDF',
    amount: formatUSD(RISK_REPORT.oneTimePrice),
    unit: 'one-time',
    href: '/pricing',
  },
  {
    label: 'Partner wholesale',
    note: 'Co-branded for RPOs & MSPs',
    amount: formatUSD(RISK_REPORT.wholesalePrice),
    unit: 'per report',
    href: '/partners/kit',
  },
]

/* Demo `.dd-item` row */
function DdItem({ item, onClick }: { item: MenuItem; onClick?: () => void }) {
  const Icon = item.icon
  return (
    <Link href={item.href} className="dd-item" onClick={onClick}>
      <div className="dd-ic"><Icon /></div>
      <div>
        <h5>
          {item.label}
          {item.tag && <span className="dd-tag">{item.tag}</span>}
          {item.soon && <span className="dd-soon">Soon</span>}
        </h5>
        <p>{item.body}</p>
      </div>
    </Link>
  )
}

/* Demo `.dd-head` */
function DdHead({ eyebrow, sub }: { eyebrow: string; sub: string }) {
  return (
    <div className="dd-head">
      <div className="eyebrow">{eyebrow}</div>
      <p>{sub}</p>
    </div>
  )
}

export function NavV3() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const close = () => setMobileOpen(false)

  return (
    <div className="hermes">
      <nav className="nav" aria-label="Main navigation" data-mobile-open={mobileOpen}>
        <div className="nav-inner">
          {/* Brand — 36px static mark, hover tilt only (demo .brand:hover .brand-mark) */}
          <Link href="/" className="brand" title="HoundShield home" onClick={close}>
            <Image
              className="brand-mark"
              src="/houndshield-logo.png"
              alt="HoundShield"
              width={28}
              height={36}
              priority
            />
            <span className="brand-text">Hound<b>Shield</b></span>
          </Link>

          <div className={`nav-links${mobileOpen ? ' open' : ''}`}>
            {/* Products mega */}
            <div className="nav-item">
              <Link href="/features" className="nav-link" onClick={close}>
                Products <ChevronDown className="chev" />
              </Link>
              <div className="dropdown wide">
                <DdHead eyebrow="Products by Industry" sub="One firewall · every compliance framework · one deployment" />
                <div className="dd-grid">
                  {INDUSTRIES.map((it) => <DdItem key={it.label} item={it} onClick={close} />)}
                </div>
                <div className="dd-foot">
                  <span className="mono">SOC 2 · HIPAA · CMMC L2 · 16 engines · &lt;10ms</span>
                  <Link href="/features" onClick={close}>All capabilities <ArrowRight style={{ width: 13, height: 13 }} /></Link>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="nav-item">
              <Link href="/features" className="nav-link" onClick={close}>
                Features <ChevronDown className="chev" />
              </Link>
              <div className="dropdown dd-narrow">
                <DdHead eyebrow="Core Capabilities" sub="Inside the HoundShield firewall engine" />
                <div className="dd-grid">
                  {FEATURES.map((it) => <DdItem key={it.label} item={it} onClick={close} />)}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="nav-item">
              <Link href="/pricing" className="nav-link" onClick={close}>
                Pricing <ChevronDown className="chev" />
              </Link>
              <div className="dropdown dd-narrow">
                <DdHead eyebrow="Pricing" sub="One report. One price. No subscription." />
                {PRICES.map((p) => (
                  <Link key={p.label} href={p.href} className="dd-price" onClick={close}>
                    <div>
                      <h5>{p.label}</h5>
                      <p>{p.note}</p>
                    </div>
                    <span className="amt">{p.amount}<small>{p.unit}</small></span>
                  </Link>
                ))}
                <div className="dd-foot">
                  <Link href={PURCHASABLE_OFFER.tryHref} onClick={close}>{PURCHASABLE_OFFER.tryLabel} <ArrowRight style={{ width: 13, height: 13 }} /></Link>
                </div>
              </div>
            </div>

            {/* Partners */}
            <div className="nav-item">
              <Link href="/partners" className="nav-link" onClick={close}>
                Partners <ChevronDown className="chev" />
              </Link>
              <div className="dropdown dd-narrow">
                <DdHead eyebrow="Partner Program" sub="Build & grow with HoundShield" />
                <div className="dd-grid">
                  {PARTNERS.map((it) => <DdItem key={it.label} item={it} onClick={close} />)}
                </div>
              </div>
            </div>

            {/* Docs */}
            <div className="nav-item">
              <Link href="/docs" className="nav-link" onClick={close}>
                Docs <ChevronDown className="chev" />
              </Link>
              <div className="dropdown dd-narrow">
                <DdHead eyebrow="Documentation" sub="Live in under 5 minutes · no code changes" />
                <div className="dd-grid">
                  {DOCS.map((it) => <DdItem key={it.label} item={it} onClick={close} />)}
                </div>
              </div>
            </div>
          </div>

          <div className="nav-cta">
            {/* Real numbers only — never the demo's fabricated counter */}
            <div className="live-badge" title="16 local detection engines, sub-10ms median scan">
              <i className="live-dot" />
              <span>{NAV_TRUST_BADGE}</span>
            </div>
            <Link className="btn btn-ghost btn-sm" href="/login" onClick={close}>Sign in</Link>
            {/* The global CTA sells the one thing that has a checkout. It used
                to read "Start free → /signup", promising a tier /pricing no
                longer offers. Copy comes from PURCHASABLE_OFFER so it cannot
                drift from what is actually for sale. */}
            <Link className="btn btn-primary btn-sm" href={PURCHASABLE_OFFER.href} onClick={close}>
              {PURCHASABLE_OFFER.ctaLabel} <ArrowRight />
            </Link>
            <button
              type="button"
              className="btn btn-ghost btn-sm burger"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(v => !v)}
            >
              <Menu style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}
