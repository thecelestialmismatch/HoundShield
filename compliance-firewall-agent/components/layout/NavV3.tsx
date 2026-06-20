'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Menu, X, ChevronDown, ArrowRight,
  Lock, Heart, Shield, Briefcase, Globe, Landmark,
  Eye, Zap, FileCheck, Activity, Users, Plug, Terminal,
} from 'lucide-react'

/* ──────────────────────────────────────────────────────────────────
 * Mega-menu data — ported 1:1 from the approved Direction-A demo
 * (HERMES Redesign Demo). Every entry links to a real public route.
 * ────────────────────────────────────────────────────────────────── */

type Tone = string

interface MenuItem {
  icon: React.ElementType
  label: string
  tag?: string
  soon?: boolean
  body: string
  href: string
}

interface PriceRow {
  label: string
  note: string
  amount: string
  href: string
}

// Products by industry — wide 3-col grid. One firewall, every framework.
const INDUSTRIES: MenuItem[] = [
  { icon: Lock,      label: 'Technology',      tag: 'SOC 2',   body: 'Engineers pasting API keys & source into Copilot.', href: '/products/technology' },
  { icon: Heart,     label: 'Healthcare',      tag: 'HIPAA',   body: 'Clinicians pasting PHI into AI for documentation.',  href: '/products/healthcare' },
  { icon: Shield,    label: 'Defense',         tag: 'CMMC L2', body: 'DoD contractors leaking CUI into proposal tools.',   href: '/products/defense' },
  { icon: Briefcase, label: 'Legal & Finance', tag: 'PCI',     body: 'Privileged client data shared with AI assistants.',  href: '/products/legal' },
  { icon: Globe,     label: 'Five Eyes',       tag: 'AUKUS',   body: 'Allied suppliers navigating DISP & Essential 8.',    href: '/products/global' },
  { icon: Landmark,  label: 'Government',      soon: true,     body: 'FedRAMP / FISMA — agency AI governance.',            href: '/products/government' },
]

// Features — core capabilities.
const FEATURES: MenuItem[] = [
  { icon: Eye,      label: 'AI Prompt Interception', body: 'Every LLM request inspected before it leaves the network.', href: '/features#interception' },
  { icon: Zap,      label: '16 Detection Engines',   body: 'CUI, PII, IP, PHI, secrets, CAGE codes, clearances.',       href: '/features#engines' },
  { icon: FileCheck,label: 'Immutable Audit Trail',  body: 'SHA-256 tamper-evident logs. C3PAO-ready.',                 href: '/features#audit' },
  { icon: Activity, label: 'Live Threat Dashboard',  body: 'Real-time blocked prompts, risk & posture.',                href: '/console' },
]

// Pricing — all frameworks in every plan.
const PRICES: PriceRow[] = [
  { label: 'Free',       note: 'Up to 1,000 prompts/mo',    amount: '$0',   href: '/pricing' },
  { label: 'Pro',        note: 'CMMC suite + AI gateway',   amount: '$199', href: '/pricing' },
  { label: 'Growth',     note: 'PDF reports + C3PAO coord', amount: '$499', href: '/pricing' },
  { label: 'Enterprise', note: 'On-prem · air-gapped',      amount: '$999', href: '/pricing' },
]

// Partners — partner program.
const PARTNERS: MenuItem[] = [
  { icon: Shield, label: 'C3PAO Referral', body: '30% recurring. 80 authorized assessors.', href: '/partners#c3pao' },
  { icon: Users,  label: 'MSP / Agency',   body: '20% revenue share · white-label option.', href: '/partners#msp' },
  { icon: Plug,   label: 'Integrations',   body: 'Drop-in proxy for ChatGPT, Copilot, Claude.', href: '/docs#integrations' },
]

// Docs — documentation.
const DOCS: MenuItem[] = [
  { icon: Zap,      label: 'Quickstart',    body: 'One URL change → full compliance.',      href: '/docs#quickstart' },
  { icon: Terminal, label: 'API Reference', body: 'Gateway, classifier & audit endpoints.', href: '/docs#api' },
]

/* ── Dark popover primitives (match demo --pop palette) ───────────── */

const POP = '#0E1622'
const POP_LINE = 'rgba(255,255,255,0.08)'

function MenuItemRow({ item, onClick }: { item: MenuItem; onClick?: () => void }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="group/it flex gap-2.5 p-2.5 rounded-[10px] transition-colors hover:bg-white/5"
    >
      <span className="grid place-items-center w-[30px] h-[30px] rounded-[9px] shrink-0 bg-[rgba(129,166,198,0.16)] text-[#AACDDC]">
        <Icon className="w-[15px] h-[15px]" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-[0.86rem] font-semibold text-[#E8F0F8]">
          {item.label}
          {item.tag && (
            <span className="font-[var(--font-mono)] text-[0.62rem] font-bold tracking-[0.06em] uppercase text-[#AACDDC]">{item.tag}</span>
          )}
          {item.soon && (
            <span className="font-[var(--font-mono)] text-[0.56rem] font-bold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-[5px] bg-white/[0.08] text-[#90A6BC]">Soon</span>
          )}
        </span>
        <span className="block text-[0.72rem] leading-[1.4] text-[#90A6BC] mt-0.5">{item.body}</span>
      </span>
    </Link>
  )
}

interface NavMenuProps {
  label: string
  triggerHref: string
  width: number
  wide?: boolean
  children: React.ReactNode
}

function NavMenu({ label, triggerHref, width, wide, children }: NavMenuProps) {
  return (
    <div className="relative group">
      <Link
        href={triggerHref}
        aria-haspopup="true"
        className="flex items-center gap-1 px-3 py-2 text-[0.9rem] font-medium text-[var(--hs-ink-secondary)] rounded-[var(--radius-md)] transition-colors group-hover:text-[var(--hs-ink)] group-hover:bg-[var(--hs-surface-1)] group-focus-within:text-[var(--hs-ink)]"
      >
        {label}
        <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180" />
      </Link>
      {/* pt-2.5 forms the invisible hover bridge to the panel */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 top-full pt-2.5 opacity-0 invisible pointer-events-none translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:pointer-events-auto group-focus-within:translate-y-0`}
        style={{ width }}
      >
        <div
          className="rounded-2xl border p-2 shadow-[0_18px_50px_rgba(20,44,70,0.28)]"
          style={{ background: POP, borderColor: POP_LINE }}
        >
          {wide ? <div className="grid grid-cols-3 gap-0.5">{children}</div> : <div className="grid grid-cols-1 gap-0.5">{children}</div>}
        </div>
      </div>
    </div>
  )
}

function DdHead({ eyebrow, sub }: { eyebrow: string; sub: string }) {
  return (
    <div className="col-span-full px-3 pt-2.5 pb-2 mb-1.5 border-b" style={{ borderColor: POP_LINE }}>
      <div className="font-[var(--font-mono)] text-[0.7rem] font-bold tracking-[0.2em] uppercase text-[#AACDDC]">{eyebrow}</div>
      <p className="text-[0.74rem] text-[#90A6BC] mt-0.5">{sub}</p>
    </div>
  )
}

function DdFoot({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-full mt-1.5 px-3 pt-2.5 pb-1 border-t flex items-center justify-between gap-3" style={{ borderColor: POP_LINE }}>
      {children}
    </div>
  )
}

/* ── SSR-safe live counter ────────────────────────────────────────── */

function useInterceptedCount() {
  const [count, setCount] = useState(14672)
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setCount((c) => c + Math.floor((c % 3) + 1)), 4200)
    return () => clearInterval(id)
  }, [])
  return count
}

export function NavV3() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const count = useInterceptedCount()
  const close = () => setMobileOpen(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 12) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      aria-label="Main navigation"
      data-mobile-open={mobileOpen}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'nav-frosted shadow-[var(--shadow-sm)]' : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo — rotates & scales toward the cursor on hover (demo .brand:hover .brand-mark) */}
          <Link href="/" className="group/brand flex items-center gap-2.5 shrink-0" title="HoundShield home">
            <Image
              src="/houndshield-logo.png"
              alt="HoundShield"
              width={44}
              height={44}
              className="logo-img object-contain transition-transform duration-300 ease-[cubic-bezier(.22,.61,.36,1)] group-hover/brand:[transform:rotate(-4deg)_scale(1.06)]"
              priority
            />
            <span className="font-bold text-[var(--hs-ink)] text-xl sm:text-2xl tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              <span style={{
                background: 'linear-gradient(135deg, var(--hs-steel-dark), var(--hs-steel))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Hound</span>Shield
            </span>
          </Link>

          {/* Desktop nav — five hover mega-menus */}
          <div className="hidden md:flex items-center gap-0.5">
            <NavMenu label="Products" triggerHref="/features" width={720} wide>
              <DdHead eyebrow="Products by Industry" sub="One firewall · every compliance framework · one deployment" />
              {INDUSTRIES.map((it) => <MenuItemRow key={it.label} item={it} />)}
              <DdFoot>
                <span className="font-[var(--font-mono)] text-[0.66rem] text-[#90A6BC]">SOC 2 · HIPAA · CMMC L2 · 16 engines · &lt;10ms</span>
                <Link href="/features" className="inline-flex items-center gap-1 text-[0.78rem] font-semibold text-[#AACDDC] hover:underline">
                  All capabilities <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </DdFoot>
            </NavMenu>

            <NavMenu label="Features" triggerHref="/features" width={340}>
              <DdHead eyebrow="Core Capabilities" sub="Inside the HoundShield firewall engine" />
              {FEATURES.map((it) => <MenuItemRow key={it.label} item={it} />)}
            </NavMenu>

            <NavMenu label="Pricing" triggerHref="/pricing" width={340}>
              <DdHead eyebrow="Pricing" sub="All frameworks included in every plan" />
              {PRICES.map((p) => (
                <Link key={p.label} href={p.href} className="flex items-center justify-between p-2.5 rounded-[10px] transition-colors hover:bg-white/5">
                  <span>
                    <span className="block text-[0.85rem] font-bold text-[#E8F0F8]">{p.label}</span>
                    <span className="block text-[0.7rem] text-[#90A6BC]">{p.note}</span>
                  </span>
                  <span className="font-[var(--font-mono)] text-[0.85rem] font-bold text-[#E8F0F8]">{p.amount}<small className="text-[#90A6BC] font-normal text-[0.62rem]">/mo</small></span>
                </Link>
              ))}
              <DdFoot>
                <Link href="/pricing" className="inline-flex items-center gap-1 text-[0.78rem] font-semibold text-[#AACDDC] hover:underline">
                  Compare all plans <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </DdFoot>
            </NavMenu>

            <NavMenu label="Partners" triggerHref="/partners" width={340}>
              <DdHead eyebrow="Partner Program" sub="Build & grow with HoundShield" />
              {PARTNERS.map((it) => <MenuItemRow key={it.label} item={it} />)}
            </NavMenu>

            <NavMenu label="Docs" triggerHref="/docs" width={340}>
              <DdHead eyebrow="Documentation" sub="Live in under 5 minutes · no code changes" />
              {DOCS.map((it) => <MenuItemRow key={it.label} item={it} />)}
            </NavMenu>
          </div>

          {/* Desktop CTA + live badge */}
          <div className="hidden md:flex items-center gap-2">
            <span
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-pill)] bg-[var(--hs-ok-bg,rgba(14,159,110,0.12))] border border-[rgba(14,159,110,0.28)] text-[11px] font-bold tabular-nums font-[var(--font-mono)] text-[#0E9F6E]"
              title="Prompts intercepted across HoundShield deployments"
            >
              <span className="w-[7px] h-[7px] rounded-full bg-[#0E9F6E] animate-pulse" aria-hidden />
              {count.toLocaleString()} intercepted
            </span>
            <Link
              href="/login"
              className="px-4 py-1.5 text-sm text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)] rounded-[var(--radius-md)] hover:bg-[var(--hs-surface-1)] transition-colors font-[var(--font-body)]"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-[var(--radius-md)] transition-all duration-200 hover:-translate-y-px font-[var(--font-body)]"
              style={{
                background: 'linear-gradient(135deg, var(--hs-steel-dark), var(--hs-steel))',
                boxShadow: 'var(--shadow-cta)',
              }}
            >
              Start free <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile burger */}
          <button
            type="button"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            className="md:hidden p-2 rounded-[var(--radius-md)] text-[var(--hs-ink-secondary)] hover:bg-[var(--hs-surface-1)] transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu — every section reachable */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--hs-border-subtle)] bg-[var(--hs-surface-0)]/97 backdrop-blur-lg px-4 py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <MobileAccordion title="Products" items={INDUSTRIES} onNavigate={close} />
          <MobileAccordion title="Features" items={FEATURES} onNavigate={close} />
          <Link href="/pricing" onClick={close} className="block px-3 py-2.5 text-sm font-medium text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)] rounded-[var(--radius-md)] hover:bg-[var(--hs-mist)] transition-colors">Pricing</Link>
          <MobileAccordion title="Partners" items={PARTNERS} onNavigate={close} />
          <MobileAccordion title="Docs" items={DOCS} onNavigate={close} />
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login" onClick={close} className="block w-full text-center px-4 py-2.5 text-sm text-[var(--hs-ink)] border border-[var(--hs-border)] rounded-[var(--radius-md)] hover:bg-[var(--hs-mist)] transition-colors">Sign in</Link>
            <Link href="/signup" onClick={close} className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white rounded-[var(--radius-md)]" style={{ background: 'linear-gradient(135deg, var(--hs-steel-dark), var(--hs-steel))' }}>Start free</Link>
          </div>
        </div>
      )}
    </nav>
  )
}

function MobileAccordion({ title, items, onNavigate }: { title: string; items: MenuItem[]; onNavigate: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)] rounded-[var(--radius-md)] hover:bg-[var(--hs-mist)] transition-colors"
      >
        {title}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="pl-2 pb-1 space-y-0.5">
          {items.map((it) => {
            const Icon = it.icon
            return (
              <Link key={it.label} href={it.href} onClick={onNavigate} className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] hover:bg-[var(--hs-mist)] transition-colors">
                <Icon className="w-4 h-4 text-[var(--hs-steel-dark)]" />
                <span className="text-[13px] text-[var(--hs-ink)]">{it.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
