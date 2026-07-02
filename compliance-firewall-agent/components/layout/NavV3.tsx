'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getPlan, formatUSD } from '@/lib/pricing/plans'
import { NAV_TRUST_BADGE } from '@/lib/site/metrics'
import {
  Menu, ChevronDown, ArrowRight,
  Lock, Heart, Shield, Briefcase, Globe, Landmark,
  Eye, Zap, FileCheck, Activity, Users, Plug, Terminal,
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
  { icon: Briefcase, label: 'Legal & Finance', tag: 'PCI',     body: 'Privileged client data shared with AI assistants.',  href: '/products/legal' },
  { icon: Globe,     label: 'Five Eyes',       tag: 'AUKUS',   body: 'Allied suppliers navigating DISP & Essential 8.',    href: '/products/global' },
  { icon: Landmark,  label: 'Government',      soon: true,     body: 'FedRAMP / FISMA — agency AI governance.',            href: '/products/government' },
]

const FEATURES: MenuItem[] = [
  { icon: Eye,       label: 'AI Prompt Interception', body: 'Every LLM request inspected before it leaves the network.', href: '/features#interception' },
  { icon: Zap,       label: '16 Detection Engines',   body: 'CUI, PII, IP, PHI, secrets, CAGE codes, clearances.',       href: '/features#engines' },
  { icon: FileCheck, label: 'Immutable Audit Trail',  body: 'SHA-256 tamper-evident logs. C3PAO-ready.',                 href: '/features#audit' },
  { icon: Activity,  label: 'Live Threat Dashboard',  body: 'Real-time blocked prompts, risk & posture.',                href: '/console' },
]

const PARTNERS: MenuItem[] = [
  { icon: Shield, label: 'RPO / MSP Referral', body: 'Co-brand the $499 report · keep the margin.',   href: '/partners#reseller' },
  { icon: Users,  label: 'MSP / Agency',       body: '40% per report · 20% recurring · white-label.', href: '/partners#reseller' },
  { icon: Plug,   label: 'Integrations',       body: 'Drop-in proxy for ChatGPT, Copilot, Claude.',   href: '/docs#integrations' },
]

const DOCS: MenuItem[] = [
  { icon: Zap,      label: 'Quickstart',    body: 'One URL change → full compliance.',      href: '/docs#quickstart' },
  { icon: Terminal, label: 'API Reference', body: 'Gateway, classifier & audit endpoints.', href: '/docs#api' },
]

// Pricing rows — sourced from the pricing single source of truth.
const PRICES = [
  { label: 'Free',       note: 'Up to 1,000 prompts/mo',    amount: formatUSD(getPlan('free').monthlyPrice) },
  { label: 'Pro',        note: 'CMMC suite + AI gateway',   amount: formatUSD(getPlan('pro').monthlyPrice) },
  { label: 'Growth',     note: 'PDF reports + C3PAO coord', amount: formatUSD(getPlan('growth').monthlyPrice) },
  { label: 'Enterprise', note: 'On-prem · air-gapped',      amount: formatUSD(getPlan('enterprise').monthlyPrice) },
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
                <DdHead eyebrow="Pricing" sub="All frameworks included in every plan" />
                {PRICES.map((p) => (
                  <Link key={p.label} href="/pricing" className="dd-price" onClick={close}>
                    <div>
                      <h5>{p.label}</h5>
                      <p>{p.note}</p>
                    </div>
                    <span className="amt">{p.amount}<small>/mo</small></span>
                  </Link>
                ))}
                <div className="dd-foot">
                  <Link href="/pricing" onClick={close}>Compare all plans <ArrowRight style={{ width: 13, height: 13 }} /></Link>
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
            <Link className="btn btn-primary btn-sm" href="/signup" onClick={close}>
              Start free <ArrowRight />
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
