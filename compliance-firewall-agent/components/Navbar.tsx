"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import {
  Menu, X, ChevronRight, ChevronDown, Sun, Moon,
  Lock, HeartPulse, Shield, Briefcase, Globe, Landmark,
  ArrowRight, Zap, Eye, Clock, FileCheck, DollarSign,
  Users, Plug, BookOpen, Terminal, Mail, Calendar,
  Activity, Layers,
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
        dark ? "bg-brand-600/20 border border-brand-600/30" : "bg-slate-200 border border-slate-300"
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
        dark ? "translate-x-7 bg-brand-600 text-white" : "translate-x-0 bg-white text-brand-500 shadow-sm"
      }`}>
        {dark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
      </span>
    </button>
  );
}

/* ── Live Shield Badge ───────────────────────────────────── */
function LiveShieldBadge() {
  const [count, setCount] = useState(14_312);
  useEffect(() => {
    const t = setInterval(() => setCount((n) => n + Math.floor(Math.random() * 3) + 1), 6000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
      </span>
      <motion.span
        key={count}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        className="text-[10px] font-mono font-bold text-emerald-400 tabular-nums"
      >
        {count.toLocaleString()} blocked
      </motion.span>
    </div>
  );
}

/* ── Products Mega-Menu Data ─────────────────────────────── */
const PRODUCTS = [
  { icon: Lock,      color: "text-brand-400", bg: "bg-[rgba(234,88,12,0.10)]",  border: "border-[rgba(234,88,12,0.15)]",  label: "Technology",    framework: "SOC 2 · AI Governance",        useCase: "Engineers pasting API keys and source code into Copilot and ChatGPT daily.", saves: "Avg. $400K breach cost", href: "/features", live: true },
  { icon: HeartPulse,color: "text-brand-500",bg: "bg-[rgba(234,88,12,0.08)]", border: "border-[rgba(234,88,12,0.12)]", label: "Healthcare",    framework: "HIPAA · 45 CFR Part 164",      useCase: "Clinicians pasting patient records into AI tools for documentation and billing.", saves: "Avg. $1.9M HIPAA penalty", href: "/hipaa", live: true },
  { icon: Shield,    color: "text-brand-600",  bg: "bg-[rgba(234,88,12,0.12)]",   border: "border-[rgba(234,88,12,0.18)]",   label: "Defense",       framework: "CMMC Level 2 · NIST 800-171",  useCase: "DoD contractors leaking CUI and contract data into AI proposal tools.", saves: "Avg. $150K C3PAO cost", href: "/command-center/shield/onboarding", live: true },
  { icon: Briefcase, color: "text-brand-700", bg: "bg-[rgba(234,88,12,0.14)]",  border: "border-[rgba(234,88,12,0.20)]",  label: "Legal & Finance",framework: "SOC 2 · PCI DSS",             useCase: "Lawyers and analysts sharing privileged client data with AI assistants.", saves: "Avg. $200K per breach", href: "/features", live: true },
  { icon: Globe,     color: "text-orange-300",    bg: "bg-[rgba(234,88,12,0.06)]",     border: "border-[rgba(234,88,12,0.10)]",     label: "Five Eyes / Global",framework: "DISP · ASD Essential Eight", useCase: "International defence suppliers navigating AUKUS and allied compliance.", saves: "DISP audit costs", href: "/partners", live: true },
  { icon: Landmark,  color: "text-brand-800",   bg: "bg-[rgba(234,88,12,0.16)]",    border: "border-[rgba(234,88,12,0.22)]",    label: "Government",    framework: "FedRAMP · FISMA",              useCase: "Federal agencies adopting AI without a compliant data handling framework.", saves: "Authorization costs", href: "/signup", live: false },
];

/* ── Nav Flyout Panel Data ───────────────────────────────── */
const FEATURES_ITEMS = [
  { icon: Eye,       color: "text-brand-400", bg: "bg-[rgba(234,88,12,0.10)]", label: "AI Prompt Interception",  desc: "Every LLM request inspected before it leaves the network",       href: "/features#interception" },
  { icon: Zap,       color: "text-brand-600",  bg: "bg-[rgba(234,88,12,0.12)]",  label: "16 Detection Engines",    desc: "CUI, PII, IP, PHI, secrets, CAGE codes, clearances",             href: "/features#interception" },
  { icon: Clock,     color: "text-brand-500",bg: "bg-[rgba(234,88,12,0.08)]",label: "<10ms Latency",           desc: "Zero user impact — transparent to every employee",               href: "/features#interception" },
  { icon: FileCheck, color: "text-brand-700", bg: "bg-[rgba(234,88,12,0.14)]", label: "Immutable Audit Trail",   desc: "SHA-256 tamper-evident logs. Ready for any audit",               href: "/features#audit" },
  { icon: Layers,    color: "text-orange-300",    bg: "bg-[rgba(234,88,12,0.06)]",    label: "One Proxy URL Deploy",    desc: "Works with ChatGPT, Copilot, Claude, Gemini — all at once",      href: "/docs#quickstart" },
  { icon: Activity,  color: "text-brand-800",   bg: "bg-[rgba(234,88,12,0.16)]",   label: "Live Threat Dashboard",   desc: "Real-time blocked prompts, risk scores, and compliance posture",  href: "/command-center" },
];

const PRICING_TIERS = [
  { label: "Free",       price: "$0",    note: "Up to 1,000 prompts/mo", color: "text-slate-400",   href: "/signup" },
  { label: "Pro",        price: "$199",  note: "SOC 2 + HIPAA coverage",  color: "text-brand-400",  href: "/signup?plan=pro" },
  { label: "Growth",     price: "$499",  note: "PDF compliance reports",  color: "text-brand-500", href: "/signup?plan=growth" },
  { label: "Enterprise", price: "$999",  note: "Unlimited orgs + CMMC",   color: "text-brand-600",   href: "/contact" },
  { label: "Agency",     price: "$2,499",note: "White-label for MSPs",    color: "text-brand-700",  href: "/contact" },
];

const PARTNER_ITEMS = [
  { icon: Users,    color: "text-brand-400", bg: "bg-[rgba(234,88,12,0.10)]", label: "MSP / Agency",    desc: "20% revenue share · White-label option · $599/mo base",         href: "/partners#msp" },
  { icon: Plug,     color: "text-brand-500",bg: "bg-[rgba(234,88,12,0.08)]",label: "Integrations",    desc: "Drop-in proxy for ChatGPT, Copilot, Claude, Gemini, Llama",    href: "/docs#integrations" },
  { icon: DollarSign,color:"text-amber-400",  bg: "bg-[rgba(234,88,12,0.12)]",  label: "Reseller Program",desc: "Margin-first pricing · Co-branded compliance reports",           href: "/partners#reseller" },
];

const DOC_ITEMS = [
  { icon: Zap,      color: "text-brand-500", bg: "bg-[rgba(234,88,12,0.08)]", label: "5-min Quickstart",         desc: "One URL change → full compliance", href: "/docs#quickstart" },
  { icon: Terminal, color: "text-brand-400",  bg: "bg-[rgba(234,88,12,0.10)]",  label: "API Reference",            desc: "Gateway, classifier, and audit endpoints", href: "/docs#api" },
  { icon: Shield,   color: "text-brand-600",   bg: "bg-[rgba(234,88,12,0.12)]",   label: "CMMC Configuration Guide", desc: "NIST 800-171 pattern reference", href: "/docs#cmmc" },
  { icon: BookOpen, color: "text-brand-700",  bg: "bg-[rgba(234,88,12,0.14)]",  label: "Detection Engine Docs",    desc: "16 engine patterns, thresholds, overrides", href: "/docs#detection" },
];

const CONTACT_ITEMS = [
  { icon: Calendar, color: "text-brand-400", bg: "bg-[rgba(234,88,12,0.10)]", label: "Book a Demo",     desc: "30-min live walkthrough · No commitment", href: "/contact" },
  { icon: Mail,     color: "text-brand-500",bg: "bg-[rgba(234,88,12,0.08)]",label: "Enterprise Sales", desc: "Custom pricing · SLA · Dedicated CSM",    href: "/contact" },
  { icon: Users,    color: "text-brand-600",  bg: "bg-[rgba(234,88,12,0.12)]",  label: "Partner Inquiry", desc: "MSP, reseller, and integration partnerships", href: "/partners" },
];

/* ── Generic Flyout Panel ────────────────────────────────── */
function FlyoutPanel<T extends { icon: React.ElementType; color: string; bg: string; label: string; desc: string; href?: string }>({
  open,
  width = 480,
  header,
  items,
  footer,
}: {
  open: boolean;
  width?: number;
  header: { eyebrow: string; sub: string };
  items: T[];
  footer?: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.25, 0.4, 0.25, 1] }}
          style={{ width }}
          className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/95 backdrop-blur-2xl shadow-[0_32px_80px_rgba(0,0,0,0.7)] overflow-hidden z-50"
        >
          <div className="px-5 pt-4 pb-3 border-b border-white/[0.06]">
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-brand-400">{header.eyebrow}</p>
            <p className="text-xs text-slate-500 mt-0.5">{header.sub}</p>
          </div>

          <div className="p-3 grid grid-cols-1 gap-1">
            {items.map((item) => {
              const Icon = item.icon;
              const inner = (
                <div className="group flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer">
                  <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-brand-400 transition-colors">{item.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
              return item.href ? (
                <Link key={item.label} href={item.href}>{inner}</Link>
              ) : (
                <div key={item.label}>{inner}</div>
              );
            })}
          </div>

          {footer && (
            <div className="px-5 py-3 border-t border-white/[0.06] bg-white/[0.01]">
              {footer}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Hover Nav Item (wraps each link with flyout) ────────── */
function HoverNavItem({
  label,
  href,
  isDark,
  isActive,
  children,
}: {
  label: string;
  href: string;
  isDark: boolean;
  isActive: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  const linkActive  = isDark ? "text-brand-400 bg-brand-500/10" : "text-brand-500 bg-brand-50";
  const linkDefault = isDark ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50";
  const activeOpen  = open && !isActive ? (isDark ? "text-white bg-white/8" : "text-slate-900 bg-slate-100") : "";

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <Link
        href={href}
        className={`inline-flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
          isActive ? linkActive : activeOpen || linkDefault
        }`}
      >
        {label}
        {children && (
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
            <ChevronDown className="w-3 h-3" />
          </motion.span>
        )}
      </Link>
      {children && open && children}
    </div>
  );
}

/* ── Products Mega-Menu ──────────────────────────────────── */
function ProductsMenu({ isDark }: { isDark: boolean }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const linkDefault = isDark ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50";

  const handleEnter = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setOpen(true); };
  const handleLeave = () => { closeTimer.current = setTimeout(() => setOpen(false), 150); };

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
          open ? (isDark ? "text-white bg-white/8" : "text-slate-900 bg-slate-100") : linkDefault
        }`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Products
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
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
            className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] w-[740px] rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/95 backdrop-blur-2xl shadow-[0_32px_80px_rgba(0,0,0,0.7)] overflow-hidden z-50"
          >
            <div className="px-5 pt-4 pb-3 border-b border-white/[0.06]">
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-brand-400">Products by Industry</p>
              <p className="text-xs text-slate-500 mt-0.5">One firewall · Every compliance framework · One deployment</p>
            </div>

            <div className="grid grid-cols-3 gap-px bg-white/[0.04] p-px">
              {PRODUCTS.map((p) => {
                const Icon = p.icon;
                return (
                  <Link
                    key={p.label}
                    href={p.href}
                    onClick={() => setOpen(false)}
                    className={`group relative flex flex-col gap-2 p-4 bg-[#0a0a0a] transition-colors hover:bg-white/[0.04] ${!p.live ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    {!p.live && (
                      <span className="absolute top-3 right-3 text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-500 border border-slate-600/40">Soon</span>
                    )}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.bg} border ${p.border}`}>
                      <Icon className={`w-4 h-4 ${p.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors">{p.label}</span>
                        {p.live && <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-brand-400 transition-all group-hover:translate-x-0.5" />}
                      </div>
                      <p className={`text-[10px] font-mono font-semibold uppercase tracking-wider mb-1.5 ${p.color}`}>{p.framework}</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{p.useCase}</p>
                    </div>
                    <div className="mt-auto">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                         Saves: {p.saves}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
              <span className="text-[11px] text-slate-600 font-mono">SOC 2 · HIPAA · CMMC L2 · 16 detection engines · &lt;10ms</span>
              <Link href="/signup" onClick={() => setOpen(false)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors">
                Start free — all frameworks included <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Pricing Flyout ──────────────────────────────────────── */
function PricingFlyout({ open }: { open: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] w-[320px] rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/95 backdrop-blur-2xl shadow-[0_32px_80px_rgba(0,0,0,0.7)] overflow-hidden z-50"
        >
          <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-brand-400">Pricing</p>
            <p className="text-xs text-slate-500 mt-0.5">All frameworks included in every plan</p>
          </div>
          <div className="p-3 space-y-1">
            {PRICING_TIERS.map((t) => (
              <Link
                key={t.label}
                href={t.href}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group"
              >
                <div>
                  <span className={`text-sm font-bold group-hover:brightness-125 transition-all ${t.color}`}>{t.label}</span>
                  <p className="text-[11px] text-slate-500">{t.note}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-white">{t.price}<span className="text-slate-600 text-[10px] font-normal">/mo</span></span>
                  <ArrowRight className="w-3 h-3 text-slate-700 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-white/[0.06] bg-white/[0.01]">
            <Link href="/pricing" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors">
              Compare all plans <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Nav Links with flyouts ──────────────────────────────── */
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
  const hoverBg = isDark ? "hover:bg-white/5 hover:text-white" : "hover:bg-slate-50 hover:text-slate-900";

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg text-slate-400 ${hoverBg}`}
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
                  <Link key={p.label} href={p.href} onClick={onClose}
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
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const isDark = variant === "dark";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const frostedClass = isDark
    ? "bg-[#0a0a0a]/85 backdrop-blur-xl border-b border-brand-600/15"
    : "nav-frosted shadow-sm";
  const linkActive  = isDark ? "text-brand-400 bg-brand-500/10" : "text-brand-500 bg-brand-50";
  const linkDefault = isDark ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50";
  const linkOpenStyle = isDark ? "text-white bg-white/8" : "text-slate-900 bg-slate-100";
  const signInClass = isDark ? "text-sm font-medium text-slate-400 hover:text-white px-3 py-2 transition-colors" : "text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors";
  const mobileBg    = isDark ? "bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-brand-600/15" : "bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-lg";
  const mobileLinkDefault = isDark ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-slate-50";
  const mobileDivider     = isDark ? "pt-3 border-t border-white/5 flex flex-col gap-2" : "pt-3 border-t border-slate-100 flex flex-col gap-2";

  const panelProps = (key: string) => ({
    onMouseEnter: () => { if (closeTimer.current) clearTimeout(closeTimer.current); setOpenPanel(key); },
    onMouseLeave: () => { closeTimer.current = setTimeout(() => setOpenPanel(null), 150); },
  });

  const linkClass = (href: string, key: string) => {
    if (pathname === href) return `px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${linkActive}`;
    if (openPanel === key) return `px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${linkOpenStyle}`;
    return `px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${linkDefault}`;
  };

  return (
    <>
      {/* Pentagon scan line */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[1px] z-[60] bg-gradient-to-r from-transparent via-brand-400/60 to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? frostedClass : "bg-transparent"}`}>
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

            {/* Features */}
            <div className="relative" {...panelProps("features")}>
              <Link href="/features" className={linkClass("/features", "features")}>Features</Link>
              <FlyoutPanel
                open={openPanel === "features"}
                width={440}
                header={{ eyebrow: "Core Capabilities", sub: "Everything inside the Hound Shield firewall engine" }}
                items={FEATURES_ITEMS}
                footer={
                  <Link href="/features" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors">
                    All 16 detection engines <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              />
            </div>

            {/* Pricing */}
            <div className="relative" {...panelProps("pricing")}>
              <Link href="/pricing" className={linkClass("/pricing", "pricing")}>Pricing</Link>
              <PricingFlyout open={openPanel === "pricing"} />
            </div>

            {/* Partners */}
            <div className="relative" {...panelProps("partners")}>
              <Link href="/partners" className={linkClass("/partners", "partners")}>Partners</Link>
              <FlyoutPanel
                open={openPanel === "partners"}
                width={380}
                header={{ eyebrow: "Partner Program", sub: "Build and grow with Hound Shield" }}
                items={PARTNER_ITEMS}
                footer={
                  <Link href="/partners" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors">
                    Apply to partner program <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              />
            </div>

            {/* Docs */}
            <div className="relative" {...panelProps("docs")}>
              <Link href="/docs" className={linkClass("/docs", "docs")}>Docs</Link>
              <FlyoutPanel
                open={openPanel === "docs"}
                width={400}
                header={{ eyebrow: "Documentation", sub: "Deploy in 5 minutes · No code changes required" }}
                items={DOC_ITEMS}
              />
            </div>

            {/* Contact */}
            <div className="relative" {...panelProps("contact")}>
              <Link href="/contact" className={linkClass("/contact", "contact")}>Contact</Link>
              <FlyoutPanel
                open={openPanel === "contact"}
                width={360}
                header={{ eyebrow: "Get in Touch", sub: "Talk to a compliance engineer today" }}
                items={CONTACT_ITEMS}
              />
            </div>
          </div>

          {/* CTA + Shield Badge */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <LiveShieldBadge />
            <Link href="/login" className={signInClass}>Sign in</Link>
            <ThemeToggle />
            <Link href="/signup" className="btn-primary text-sm px-5 py-2.5">
              Start Free <ChevronRight className="w-3.5 h-3.5" />
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
              <MobileProductsAccordion isDark={isDark} onClose={() => setMobileOpen(false)} />
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium rounded-lg ${pathname === link.href ? linkActive : mobileLinkDefault}`}
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
