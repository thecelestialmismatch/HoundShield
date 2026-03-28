"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Lock, HeartPulse, Shield, Zap } from "lucide-react";

// Dynamic import — recharts uses browser APIs incompatible with SSR
const PlatformDashboard = dynamic(
  () => import("@/components/landing/PlatformDashboard").then((m) => m.PlatformDashboard),
  { ssr: false, loading: () => <div className="h-full w-full bg-[#0d0d16] animate-pulse rounded-b-2xl min-h-[360px]" /> }
);

/* ── Live counter ──────────────────────────────────────── */
function LiveCounter() {
  const [blocked, setBlocked] = useState(14_388);
  useEffect(() => {
    const t = setInterval(
      () => setBlocked((n) => n + Math.floor(Math.random() * 4) + 1),
      3500
    );
    return () => clearInterval(t);
  }, []);
  return (
    <motion.span
      key={blocked}
      initial={{ opacity: 0.4, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="tabular-nums"
    >
      {blocked.toLocaleString()}
    </motion.span>
  );
}

const FRAMEWORKS = [
  { icon: Lock,       label: "SOC 2",          color: "text-indigo-400",  ring: "ring-indigo-500/30 bg-indigo-500/10"   },
  { icon: HeartPulse, label: "HIPAA",          color: "text-emerald-400", ring: "ring-emerald-500/30 bg-emerald-500/10" },
  { icon: Shield,     label: "CMMC L2",        color: "text-amber-400",   ring: "ring-amber-500/30 bg-amber-500/10"    },
  { icon: Zap,        label: "One Deployment", color: "text-violet-400",  ring: "ring-violet-500/30 bg-violet-500/10"  },
];

const ease = [0.25, 0.4, 0.25, 1] as const;

export function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-screen flex items-center">
      {/* Background */}
      <div className="absolute inset-0 bg-dot-grid opacity-[0.06] pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 60% at 0% 50%, rgba(245,200,66,0.05) 0%, transparent 55%)," +
            "radial-gradient(ellipse 55% 60% at 100% 30%, rgba(99,102,241,0.06) 0%, transparent 55%)",
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-28 lg:py-36">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── LEFT — text ──────────────────────────────── */}
          <div>
            {/* Framework badges */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease }}
              className="flex flex-wrap gap-2 mb-7"
            >
              {FRAMEWORKS.map(({ icon: Icon, label, color, ring }) => (
                <div
                  key={label}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ring-1 ${ring} text-xs font-semibold uppercase tracking-wider`}
                >
                  <Icon className={`w-3 h-3 ${color}`} />
                  <span className={color}>{label}</span>
                </div>
              ))}
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.08, ease }}
              className="font-editorial text-[clamp(38px,5.5vw,72px)] font-bold leading-[1.0] tracking-[-2px] text-white mb-6"
            >
              Stop AI data leaks.
              <br />
              <span className="bg-gradient-to-r from-brand-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">
                Pass every audit.
              </span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16, ease }}
              className="text-[clamp(15px,1.6vw,18px)] text-slate-400 max-w-lg mb-9 leading-relaxed"
            >
              Kaelus intercepts every AI prompt before it leaves your network —
              simultaneously enforcing SOC&nbsp;2, HIPAA, and CMMC Level&nbsp;2.
              One 15-minute deployment. No switching between tools.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className="flex flex-col sm:flex-row gap-3 mb-10"
            >
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(200,125,62,0.4)] text-[15px]"
              >
                Start Free — All Frameworks
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/[0.05] hover:bg-white/[0.09] text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all hover:-translate-y-0.5 text-[15px]"
              >
                Watch Demo
                <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Live counter pill */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.38 }}
              className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.07]"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">Live</span>
              </span>
              <span className="text-sm font-mono text-white font-bold"><LiveCounter /></span>
              <span className="text-[11px] font-mono text-slate-500">threats blocked today</span>
              <span className="hidden sm:block w-px h-4 bg-white/10" />
              <span className="hidden sm:block text-[11px] font-mono text-slate-600">&lt;10ms · 16 engines</span>
            </motion.div>

            {/* Proof dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-8"
            >
              {["SOC 2 ready", "HIPAA covered", "CMMC Level 2", "<10ms latency"].map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600 uppercase tracking-wider">
                  <span className="w-1 h-1 rounded-full bg-brand-400/60" />
                  {t}
                </span>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT — live dashboard ────────────────────── */}
          <div style={{ perspective: "1200px" }} className="relative hidden lg:block">
            <motion.div
              initial={{ opacity: 0, x: 60, rotateY: -8, rotateX: 4 }}
              animate={{ opacity: 1, x: 0,  rotateY: -3, rotateX: 2 }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* Glow behind the card */}
              <div
                aria-hidden="true"
                className="absolute -inset-4 rounded-3xl pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse 80% 70% at 60% 50%, rgba(99,102,241,0.14) 0%, transparent 65%)",
                  filter: "blur(20px)",
                }}
              />

              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#111118] border border-white/[0.08] rounded-t-2xl">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                </div>
                <div className="flex-1 mx-3">
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/[0.06]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-mono text-slate-500">app.kaelus.online/command-center</span>
                  </div>
                </div>
              </div>

              {/* Dashboard */}
              <div className="border border-white/[0.08] border-t-0 rounded-b-2xl overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.85)]">
                <PlatformDashboard />
              </div>
            </motion.div>
          </div>

          {/* Mobile-only: dashboard below text */}
          <div className="lg:hidden mt-4">
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.7)]">
              <PlatformDashboard />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
