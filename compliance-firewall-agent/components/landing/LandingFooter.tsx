"use client";

import Link from "next/link";
import { Shield } from "lucide-react";

const FOOTER_LINKS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Demo", href: "/demo" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Knowledge Base", href: "/knowledge-base" },
      { label: "NIST Controls", href: "/nist-controls" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Security", href: "/security" },
      { label: "CMMC Policy", href: "/cmmc-policy" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#07070b]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-lg text-white">
                kaelus<span className="text-indigo-400">.ai</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              AI compliance firewall for defense contractors.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold text-white/70 mb-4">{group.title}</h4>
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
            &copy; {new Date().getFullYear()} Kaelus.online. Built for defense contractors.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-xs text-slate-600 hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="/terms" className="text-xs text-slate-600 hover:text-white/60 transition-colors">Terms</Link>
            <Link href="/docs" className="text-xs text-slate-600 hover:text-white/60 transition-colors">Docs</Link>
            <Link href="/contact" className="text-xs text-slate-600 hover:text-white/60 transition-colors">Contact</Link>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="status-dot" />
            <span className="text-xs text-emerald-400">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
