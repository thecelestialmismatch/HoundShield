import Link from 'next/link'
import Image from 'next/image'
import { Shield } from 'lucide-react'

const FOOTER_LINKS = {
  Product: [
    { label: 'Features',      href: '/features' },
    { label: 'How it works',  href: '/how-it-works' },
    { label: 'Pricing',       href: '/pricing' },
    { label: 'Dashboard',     href: '/command-center' },
    { label: 'Changelog',     href: '/changelog' },
  ],
  Compliance: [
    { label: 'CMMC Level 2',  href: '/features' },
    { label: 'HIPAA',         href: '/hipaa' },
    { label: 'SOC 2',         href: '/features' },
    { label: 'NIST 800-171',  href: '/features' },
    { label: 'DFARS 7012',    href: '/features' },
  ],
  Company: [
    { label: 'Partners',      href: '/partners' },
    { label: 'Documentation', href: '/docs' },
    { label: 'Contact sales', href: '/contact' },
    { label: 'About',         href: '/about' },
    { label: 'Security',      href: '/security' },
  ],
}

const BADGES = [
  'CMMC LVL 2',
  'HIPAA',
  'SOC 2',
  'NIST 800-171',
  'DFARS 7012',
]

interface FooterV3Props {
  dark?: boolean
}

export function FooterV3({ dark = false }: FooterV3Props) {
  if (dark) {
    return (
      <footer className="border-t border-white/[0.06] bg-[#0a0a0a]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-12">
            {/* Brand column */}
            <div className="md:col-span-1">
              <Link href="/" className="group/brand flex items-center gap-2.5 mb-4">
                <Image
                  src="/houndshield-logo.png"
                  alt="HoundShield"
                  width={48}
                  height={48}
                  className="logo-on-dark opacity-90 transition-transform duration-300 ease-[cubic-bezier(.22,.61,.36,1)] group-hover/brand:[transform:rotate(-4deg)_scale(1.06)] motion-reduce:transition-none motion-reduce:group-hover/brand:[transform:none]"
                />
                <span className="font-bold text-white text-lg font-[var(--font-body)]">
                  HoundShield
                </span>
              </Link>

              <p className="text-xs text-slate-500 leading-relaxed mb-6 font-[var(--font-body)]">
                Local-only AI compliance firewall for CMMC Level 2, HIPAA, and SOC 2. Prompt content never leaves your network.
              </p>

              {/* Compliance badges */}
              <div className="flex flex-wrap gap-1.5">
                {BADGES.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-white/[0.06] border border-white/10 text-slate-400 font-[var(--font-body)]"
                  >
                    <Shield className="w-2.5 h-2.5 text-slate-500" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(FOOTER_LINKS).map(([section, links]) => (
              <div key={section}>
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4 font-[var(--font-body)]">
                  {section}
                </h3>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-xs text-slate-500 hover:text-slate-200 transition-colors font-[var(--font-body)]"
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
          <div className="mt-12 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-600 font-[var(--font-body)]">
              © {new Date().getFullYear()} HoundShield. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-xs text-slate-600 hover:text-slate-400 transition-colors font-[var(--font-body)]">
                Privacy
              </Link>
              <Link href="/terms" className="text-xs text-slate-600 hover:text-slate-400 transition-colors font-[var(--font-body)]">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    )
  }

  /* HERMES Direction-A footer — verbatim port of the demo's `.footer` block.
     Styling lives in app/hermes.css. Privacy/Terms links are kept in the
     bottom bar (legal discoverability — deliberate addition to the demo). */
  return (
    <div className="hermes">
      <footer className="footer">
        <div className="container">
          <div className="foot-grid">
            <div className="foot-brand">
              <Link href="/" className="brand" title="HoundShield home">
                <Image
                  className="brand-mark"
                  src="/houndshield-logo.png"
                  alt="HoundShield"
                  width={28}
                  height={36}
                />
                <span className="brand-text">Hound<b>Shield</b></span>
              </Link>
              <p>
                Local-only AI compliance firewall for CMMC Level 2, HIPAA &amp; SOC 2. Prompt
                content never leaves your network.
              </p>
              <div className="foot-badges">
                {BADGES.map((badge) => <span key={badge}>{badge}</span>)}
              </div>
            </div>

            {Object.entries(FOOTER_LINKS).map(([section, links]) => (
              <div className="foot-col" key={section}>
                <h6>{section}</h6>
                {links.map((link) => (
                  <Link key={link.label} href={link.href}>{link.label}</Link>
                ))}
              </div>
            ))}
          </div>

          <div className="foot-bottom">
            <span>
              © {new Date().getFullYear()} HoundShield. All rights reserved. ·{' '}
              <Link href="/privacy" style={{ cursor: 'pointer' }}>Privacy</Link> ·{' '}
              <Link href="/terms" style={{ cursor: 'pointer' }}>Terms</Link>
            </span>
            <span className="mono">houndshield.com · local-only · zero data exfiltration</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
