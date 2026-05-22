'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ChevronDown } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Product',  href: '/features' },
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Pricing',  href: '/pricing' },
  { label: 'Docs',     href: '/docs' },
  { label: 'Blog',     href: '/blog' },
]

export function NavV3() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

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
              className="logo-img"
              priority
            />
            <span className="font-semibold text-[var(--hs-ink)] text-sm tracking-tight font-[var(--font-body)]">
              HoundShield
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
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

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/sign-in"
              className="px-4 py-1.5 text-sm text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)] rounded-[var(--radius-md)] hover:bg-[var(--hs-mist)] transition-colors font-[var(--font-body)]"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
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
              href="/sign-in"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center px-4 py-2.5 text-sm text-[var(--hs-ink)] border border-[var(--hs-border)] rounded-[var(--radius-md)] hover:bg-[var(--hs-mist)] transition-colors font-[var(--font-body)]"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
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
