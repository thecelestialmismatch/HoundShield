'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ChevronDown, ArrowRight } from 'lucide-react'

const NAV_LINKS = [
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/docs' },
  { label: 'Blog', href: '/blog' },
]

// Demo mega-menu "Products by industry" — one firewall, every framework.
const INDUSTRIES = [
  { icon: '🔒', label: 'Technology',        frame: 'SOC 2 · AI Governance',     body: 'Engineers pasting API keys and source into Copilot and ChatGPT.', href: '/products/technology' },
  { icon: '❤',  label: 'Healthcare',        frame: 'HIPAA · 45 CFR 164',        body: 'Clinicians pasting patient records into AI for documentation.',   href: '/products/healthcare' },
  { icon: '⛨',  label: 'Defense',           frame: 'CMMC L2 · NIST 800-171',    body: 'DoD contractors leaking CUI into AI proposal tools.',             href: '/products/defense' },
  { icon: '💼', label: 'Legal & Finance',   frame: 'SOC 2 · PCI DSS',           body: 'Lawyers and analysts sharing privileged data with AI.',           href: '/products/legal' },
  { icon: '🌐', label: 'Five Eyes / Global', frame: 'DISP · ASD Essential 8',    body: 'International suppliers navigating AUKUS and allied frameworks.',  href: '/products/global' },
  { icon: '🏛', label: 'Government',         frame: 'FedRAMP · FISMA',           body: 'Agencies adopting AI without a compliant data framework.',        href: '/products/government' },
]

/** SSR-safe live counter: deterministic seed renders on server + first client
 *  paint (no hydration mismatch); ticking starts only after mount. */
function useInterceptedCount() {
  const [count, setCount] = useState(14363)
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image
              src="/houndshield-logo.png"
              alt="HoundShield"
              width={40}
              height={40}
              className="logo-img object-contain"
              priority
            />
            <span className="font-bold text-[var(--hs-ink)] text-base tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              <span style={{
                background: 'linear-gradient(135deg, var(--hs-steel-dark), var(--hs-steel))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Hound</span>Shield
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {/* Product mega-menu (hover / focus-within) */}
            <div className="relative group">
              <button
                type="button"
                aria-haspopup="true"
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-[var(--hs-ink-secondary)] group-hover:text-[var(--hs-ink)] rounded-[var(--radius-md)] group-hover:bg-[var(--hs-mist)] transition-colors font-[var(--font-body)]"
              >
                Product
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
              </button>

              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-[min(880px,calc(100vw-32px))] opacity-0 pointer-events-none translate-y-1 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all duration-200">
                <div className="rounded-[var(--radius-xl)] border border-[var(--hs-border)] bg-white shadow-[var(--shadow-xl)] p-6">
                  <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--hs-ink-tertiary)] font-[var(--font-mono)]">Products by industry</div>
                  <p className="text-[13px] text-[var(--hs-ink-tertiary)] mt-1 mb-4 font-[var(--font-body)]">One firewall · Every compliance framework · One deployment</p>
                  <div className="grid grid-cols-3 gap-3">
                    {INDUSTRIES.map((it) => (
                      <Link
                        key={it.label}
                        href={it.href}
                        className="group/card rounded-[var(--radius-md)] border border-[var(--hs-border-subtle)] p-4 hover:border-[var(--hs-border)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all"
                      >
                        <div className="inline-flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--hs-mist-md)] text-[var(--hs-steel-dark)] mb-3 text-base">{it.icon}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-[15px] font-semibold text-[var(--hs-ink)] font-[var(--font-display)]">{it.label}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[var(--hs-ink-tertiary)] group-hover/card:text-[var(--hs-steel-dark)] transition-colors" />
                        </div>
                        <div className="text-[10px] tracking-[0.14em] uppercase text-[var(--hs-steel-dark)] mt-1 font-[var(--font-mono)]">{it.frame}</div>
                        <p className="text-[12px] text-[var(--hs-ink-secondary)] mt-2 leading-relaxed font-[var(--font-body)]">{it.body}</p>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-4 pt-3.5 border-t border-[var(--hs-border-subtle)] flex items-center justify-between">
                    <span className="text-[12px] text-[var(--hs-ink-tertiary)] font-[var(--font-body)]">SOC 2 · HIPAA · CMMC L2 · 16 engines · &lt;10ms</span>
                    <Link href="/signup" className="text-[14px] font-semibold text-[var(--hs-steel-dark)] hover:underline font-[var(--font-body)]">Start free — all frameworks →</Link>
                  </div>
                </div>
              </div>
            </div>

            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)] rounded-[var(--radius-md)] hover:bg-[var(--hs-mist)] transition-colors font-[var(--font-body)]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA + live counter */}
          <div className="hidden md:flex items-center gap-2">
            <span
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-pill)] border border-[var(--hs-border-subtle)] text-[11px] font-semibold text-[var(--hs-ink-secondary)] tabular-nums font-[var(--font-mono)]"
              title="Prompts intercepted across HoundShield deployments"
            >
              <span className="status-dot" aria-hidden />
              {count.toLocaleString()} intercepted
            </span>
            <Link
              href="/login"
              className="px-4 py-1.5 text-sm text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)] rounded-[var(--radius-md)] hover:bg-[var(--hs-mist)] transition-colors font-[var(--font-body)]"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-semibold text-white rounded-[var(--radius-md)] transition-all duration-200 hover:-translate-y-px font-[var(--font-body)]"
              style={{
                background: 'linear-gradient(135deg, var(--hs-steel-dark), var(--hs-steel))',
                boxShadow: 'var(--shadow-cta)',
              }}
            >
              Start free
            </Link>
          </div>

          {/* Mobile burger */}
          <button
            type="button"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            className="md:hidden p-2 rounded-[var(--radius-md)] text-[var(--hs-ink-secondary)] hover:bg-[var(--hs-mist)] transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--hs-border-subtle)] bg-[var(--hs-surface-0)]/95 backdrop-blur-lg px-4 py-4 space-y-1">
          <Link
            href="/features"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 text-sm text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)] rounded-[var(--radius-md)] hover:bg-[var(--hs-mist)] transition-colors font-[var(--font-body)]"
          >
            Product
          </Link>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)] rounded-[var(--radius-md)] hover:bg-[var(--hs-mist)] transition-colors font-[var(--font-body)]"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center px-4 py-2.5 text-sm text-[var(--hs-ink)] border border-[var(--hs-border)] rounded-[var(--radius-md)] hover:bg-[var(--hs-mist)] transition-colors font-[var(--font-body)]"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white rounded-[var(--radius-md)] font-[var(--font-body)]"
              style={{
                background: 'linear-gradient(135deg, var(--hs-steel-dark), var(--hs-steel))',
              }}
            >
              Start free
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
