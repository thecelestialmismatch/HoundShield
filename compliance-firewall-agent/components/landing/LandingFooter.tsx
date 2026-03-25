"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { TextLogo } from "@/components/TextLogo";

const FOOTER_LINKS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Demo", href: "/demo" },
      { label: "Partners", href: "/partners" },
    ],
  },
  {
    title: "Industries",
    links: [
      { label: "Defense (CMMC)", href: "/features" },
      { label: "Healthcare (HIPAA)", href: "/hipaa" },
      { label: "Technology (SOC 2)", href: "/features" },
      { label: "Five Eyes / DISP", href: "/features" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "NIST Controls", href: "/docs" },
      { label: "FAQ", href: "#faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Security", href: "/terms" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Logo />
              <TextLogo className="text-lg" variant="dark" />
            </div>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              AI compliance firewall for regulated industries.
            </p>
            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-600 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                All systems operational
              </span>
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">{group.title}</h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-white/80 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} Kaelus.online. Built for regulated industries.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-xs text-slate-600 hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="/terms" className="text-xs text-slate-600 hover:text-white/60 transition-colors">Terms</Link>
            <Link href="/docs" className="text-xs text-slate-600 hover:text-white/60 transition-colors">Docs</Link>
            <Link href="/contact" className="text-xs text-slate-600 hover:text-white/60 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
