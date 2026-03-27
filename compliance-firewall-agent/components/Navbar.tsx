"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, ChevronRight, ChevronDown, Sun, Moon,
  Lock, HeartPulse, Shield, Briefcase, Globe, Landmark,
  ArrowRight,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { TextLogo } from "@/components/TextLogo";
import { useTheme } from "@/components/theme-provider";

/* ── Theme Toggle ────────────────────────────────────────── */
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={`relative w-14 h-7 rounded-full transition-all duration-300 cursor-pointer flex-shrink-0 ${
        dark ? "bg-brand-500/20 border border-brand-500/30" : "bg-slate-200 border border-slate-300"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
          dark ? "translate-x-7 bg-brand-500 text-white" : "translate-x-0 bg-white text-amber-500 shadow-sm"
        }`}
      >
        {dark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
      </span>
    </button>
  );
}

/* ── Products Mega-Menu Data ─────────────────────────────── */
const PRODUCTS = [
  {
    icon: Lock,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    label: "Technology",
    framework: "SOC 2 · AI Governance",
    useCase: "Engineers pasting API keys and source code into Copilot and ChatGPT daily.",
    saves: "Avg. $400K breach cost",
    href: "/features",
    live: true,
  },
  {
    icon: HeartPulse,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    label: "Healthcare",
    framework: "HIPAA · 45 CFR Part 164",
    useCase: "Clinicians pasting patient records into AI tools for documentation and billing.",
    saves: "Avg. $1.9M HIPAA penalty",
    href: "/hipaa",
    live: true,
  },
  {
    icon: Shield,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    label: "Defense",
    framework: "CMMC Level 2 · NIST 800-171",
    useCase: "DoD contractors leaking CUI and contract data into AI proposal tools.",
    saves: "Avg. $150K C3PAO cost",
    href: "/command-center/shield/onboarding",
    live: true,
  },
  {
    icon: Briefcase,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    label: "Legal & Finance",
    framework: "SOC 2 · PCI DSS",
    useCase: "Lawyers and analysts sharing privileged client data with AI assistants.",
    saves: "Avg. $200K per breach",
    href: "/features",
    live: true,
  },
  {
    icon: Globe,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    label: "Five Eyes / Global",
    framework: "DISP · ASD Essential Eight",
    useCase: "International defence suppliers navigating AUKUS and allied compliance.",
    saves: "DISP audit costs",
    href: "/partners",
    live: true,
  },
  {
    icon: Landmark,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    label: "Government",
    framework: "FedRAMP · FISMA",
    useCase: "Federal agencies adopting AI without a compliant data handling framework.",
    saves: "Authorization costs",
    href: "/signup",
    live: false, // coming soon
  },
];

/* ── Products Dropdown ───────────────────────────────────── */
function ProductsMenu({ isDark }: { isDark: boolean }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
          open
            ? isDark ? "text-white bg-white/8" : "text-slate-900 bg-slate-100"
            : isDark ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
        }`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Products
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
            className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] w-[740px] rounded-2xl border border-white/[0.08] bg-[#0d0d16]/95 backdrop-blur-2xl shadow-[0_32px_80px_rgba(0,0,0,0.7)] overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-5 pt-4 pb-3 border-b border-white/[0.06]">
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-brand-400">
                Products by Industry
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                One firewall · Every compliance framework · One deployment
              </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-px bg-white/[0.04] p-px">
              {PRODUCTS.map((p) => {
                const Icon = p.icon;
                return (
                  <Link
                    key={p.label}
                    href={p.href}
                    onClick={() => setOpen(false)}
                    className={`group relative flex flex-col gap-2 p-4 bg-[#0d0d16] transition-colors hover:bg-white/[0.04] ${
                      !p.live ? "opacity-60 pointer-events-none" : ""
                    }`}
                  >
                    {!p.live && (
                      <span className="absolute top-3 right-3 text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-500 border border-slate-600/40">
                        Soon
                      </span>
                    )}

                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.bg} border ${p.border}`}>
                      <Icon className={`w-4 h-4 ${p.color}`} />
                    </div>

                    {/* Text */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors">
                          {p.label}
                        </span>
                        {p.live && (
                          <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-brand-400 transition-all group-hover:translate-x-0.5" />
                        )}
                      </div>
                      <p className={`text-[10px] font-mono font-semibold uppercase tracking-wider mb-1.5 ${p.color}`}>
                        {p.framework}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                        {p.useCase}
                      </p>
                    </div>

                    {/* Savings pill */}
                    <div className="mt-auto">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        ✓ Saves: {p.saves}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Footer CTA */}
            <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
              <span className="text-[11px] text-slate-600 font-mono">
                SOC 2 · HIPAA · CMMC L2 · 16 detection engines · &lt;10ms
              </span>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
              >
                Start free — all frameworks included
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Nav links (no Products — handled separately) ────────── */
const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing",  label: "Pricing"  },
  { href: "/partners", label: "Partners" },
  { href: "/docs",     label: "Docs"     },
  { href: "/contact",  label: "Contact"  },
];

/* ── Mobile Products Accordion ───────────────────────────── */
function MobileProductsAccordion({ isDark, onClose }: { isDark: boolean; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const baseText = isDark ? "text-slate-400" : "text-slate-600";
  const hoverBg  = isDark ? "hover:bg-white/5 hover:text-white" : "hover:bg-slate-50 hover:text-slate-900";

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg ${baseText} ${hoverBg}`}
      >
        Products
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pl-4 pr-2 pb-2 space-y-1">
              {PRODUCTS.filter((p) => p.live).map((p) => {
                const Icon = p.icon;
                return (
                  <Link
                    key={p.label}
                    href={p.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${hoverBg} transition-colors`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${p.bg} border ${p.border}`}>
                      <Icon className={`w-3.5 h-3.5 ${p.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{p.label}</p>
                      <p className={`text-[10px] font-mono truncate ${p.color}`}>{p.framework}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Navbar ──────────────────────────────────────────────── */
export function Navbar({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isDark = variant === "dark";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const frostedClass = isDark
    ? "bg-[#07070b]/85 backdrop-blur-xl border-b border-indigo-500/15"
    : "nav-frosted shadow-sm";
  const linkActive  = isDark ? "text-brand-400 bg-brand-500/10" : "text-brand-500 bg-brand-50";
  const linkDefault = isDark ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50";
  const signInClass = isDark ? "text-sm font-medium text-slate-400 hover:text-white px-3 py-2 transition-colors" : "text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors";
  const mobileBg    = isDark ? "bg-[#0e0e18]/95 backdrop-blur-xl border-b border-indigo-500/15" : "bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-lg";
  const mobileLinkDefault = isDark ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-slate-50";
  const mobileDivider     = isDark ? "pt-3 border-t border-white/5 flex flex-col gap-2" : "pt-3 border-t border-slate-100 flex flex-col gap-2";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? frostedClass : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <Logo />
            <TextLogo className="text-lg" variant={variant} />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {/* Products mega-menu */}
            <ProductsMenu isDark={isDark} />

            {/* Regular links */}
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname === link.href ? linkActive : linkDefault
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <Link href="/login" className={signInClass}>Sign in</Link>
            <ThemeToggle />
            <Link href="/signup" className="btn-primary text-sm px-5 py-2.5">
              Start Free
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className={isDark ? "md:hidden p-2 text-slate-400 hover:text-white" : "md:hidden p-2 text-slate-600 hover:text-slate-900"}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-x-0 top-16 z-40 md:hidden ${mobileBg}`}
          >
            <div className="max-w-7xl mx-auto px-6 py-4 space-y-1">
              {/* Mobile Products accordion */}
              <MobileProductsAccordion isDark={isDark} onClose={() => setMobileOpen(false)} />

              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium rounded-lg ${
                    pathname === link.href ? linkActive : mobileLinkDefault
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className={mobileDivider}>
                <Link href="/login" className="btn-ghost text-center w-full">Sign in</Link>
                <Link href="/signup" className="btn-primary text-center w-full">Start Free</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
