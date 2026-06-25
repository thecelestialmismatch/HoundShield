import Link from 'next/link'
import Image from 'next/image'
import { Shield } from 'lucide-react'

const FOOTER_LINKS = {
  Product: [
    { label: 'Features',      href: '/features' },
    { label: 'How it works',  href: '/how-it-works' },
    { label: 'Pricing',       href: '/pricing' },
    { label: 'Changelog',     href: '/changelog' },
    { label: 'Roadmap',       href: '/roadmap' },
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
  Legal: [
    { label: 'Security',        href: '/security' },
    { label: 'Status',          href: '/status' },
    { label: 'Privacy',         href: '/privacy' },
    { label: 'Terms',           href: '/terms' },
    { label: 'DPA',             href: '/dpa' },
    { label: 'Acceptable Use',  href: '/acceptable-use' },
  ],
}

const BADGES = [
  'CMMC LVL 2',
  'HIPAA',
  'SOC 2',
  'NIST 800-171',
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
                <span className="inline-flex transition-transform duration-300 ease-[cubic-bezier(.22,.61,.36,1)] group-hover/brand:[transform:rotate(-4deg)_scale(1.06)] motion-reduce:transition-none motion-reduce:group-hover/brand:[transform:none]">
                  <Image
                    src="/houndshield-logo.png"
                    alt="HoundShield"
                    width={48}
                    height={48}
                    className="logo-on-dark opacity-90 logo-breathe"
                  />
                </span>
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

          {/* Deployment-boundary disclosure (site-wide compliance statement) */}
          <p className="mt-12 pt-6 border-t border-white/[0.04] text-[11px] leading-relaxed text-slate-600 font-[var(--font-body)] max-w-3xl">
            This hosted site is for demos and non-CUI evaluation only — it runs on Vercel, which is not FedRAMP-authorized. CUI-safe operation requires self-hosted Docker (Mode B) or air-gapped (Mode C), where prompt content never leaves your network.
          </p>

          {/* Bottom bar */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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

  return (
    <footer className="border-t border-[var(--hs-border-subtle)] bg-[var(--hs-surface-1)]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-12">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link href="/" className="group/brand flex items-center gap-2.5 mb-4">
              <span className="inline-flex transition-transform duration-300 ease-[cubic-bezier(.22,.61,.36,1)] group-hover/brand:[transform:rotate(-4deg)_scale(1.06)] motion-reduce:transition-none motion-reduce:group-hover/brand:[transform:none]">
                <Image
                  src="/houndshield-logo.png"
                  alt="HoundShield"
                  width={48}
                  height={48}
                  className="logo-img logo-breathe"
                />
              </span>
              <span className="font-bold text-[var(--hs-ink)] text-lg font-[var(--font-body)]">
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
                  <li key={link.label}>
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

        {/* Deployment-boundary disclosure (site-wide compliance statement) */}
        <p className="mt-12 pt-6 border-t border-[var(--hs-border-subtle)] text-[11px] leading-relaxed text-[var(--hs-ink-tertiary)] font-[var(--font-body)] max-w-3xl">
          This hosted site is for demos and non-CUI evaluation only — it runs on Vercel, which is not FedRAMP-authorized. CUI-safe operation requires self-hosted Docker (Mode B) or air-gapped (Mode C), where prompt content never leaves your network.
        </p>

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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
