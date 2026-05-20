import Link from 'next/link'
import Image from 'next/image'
import { Shield } from 'lucide-react'

const FOOTER_LINKS = {
  Product: [
    { label: 'Features',      href: '/features' },
    { label: 'How it works',  href: '/how-it-works' },
    { label: 'Pricing',       href: '/pricing' },
    { label: 'Changelog',     href: '/changelog' },
    { label: 'Roadmap',       href: '/changelog' },
  ],
  Compliance: [
    { label: 'CMMC Level 2',  href: '/features' },
    { label: 'HIPAA',         href: '/hipaa' },
    { label: 'SOC 2',         href: '/features' },
    { label: 'NIST 800-171',  href: '/features' },
    { label: 'DFARS 7012',    href: '/features' },
  ],
  Resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'Blog',          href: '/blog' },
    { label: 'Partners',      href: '/partners' },
    { label: 'Contact',       href: '/contact' },
    { label: 'About',         href: '/about' },
  ],
}

const BADGES = [
  'CMMC LVL 2',
  'HIPAA',
  'SOC 2',
  'NIST 800-171',
]

export function FooterV3() {
  return (
    <footer className="border-t border-[var(--hs-border-subtle)] bg-[var(--hs-surface-1)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Image
                src="/houndshield-logo.png"
                alt="HoundShield"
                width={48}
                height={48}
                className="logo-img"
              />
              <span className="font-semibold text-[var(--hs-ink)] text-sm font-[var(--font-body)]">
                HoundShield
              </span>
            </Link>

            <p className="text-xs text-[var(--hs-ink-tertiary)] leading-relaxed mb-6 font-[var(--font-body)]">
              Local-only AI compliance firewall for CMMC Level 2, HIPAA, and SOC 2. Prompt content never leaves your network.
            </p>

            {/* Compliance badges */}
            <div className="flex flex-wrap gap-1.5">
              {BADGES.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-white border border-[var(--hs-border)] text-[var(--hs-ink-secondary)] font-[var(--font-body)]"
                >
                  <Shield className="w-2.5 h-2.5 text-[var(--hs-steel)]" />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-xs font-semibold text-[var(--hs-ink)] uppercase tracking-wider mb-4 font-[var(--font-body)]">
                {section}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs text-[var(--hs-ink-tertiary)] hover:text-[var(--hs-ink)] transition-colors font-[var(--font-body)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-[var(--hs-border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--hs-ink-tertiary)] font-[var(--font-body)]">
            © {new Date().getFullYear()} HoundShield. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-[var(--hs-ink-tertiary)] hover:text-[var(--hs-ink)] transition-colors font-[var(--font-body)]">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-[var(--hs-ink-tertiary)] hover:text-[var(--hs-ink)] transition-colors font-[var(--font-body)]">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
