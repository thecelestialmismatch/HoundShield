"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Lock, HeartPulse, Shield } from "lucide-react";

// Dynamic import — recharts uses browser APIs (ResizeObserver) incompatible with SSR
const PlatformDashboard = dynamic(
  () => import("@/components/landing/PlatformDashboard").then((m) => m.PlatformDashboard),
  { ssr: false, loading: () => <div className="h-[500px] bg-[#0d0d16] animate-pulse rounded-b-2xl" /> }
);

/* ── Live counter (animates up every 4s) ───────────────── */
function LiveCounter() {
  const [blocked, setBlocked] = useState(14_312);
  useEffect(() => {
    const t = setInterval(
      () => setBlocked((n) => n + Math.floor(Math.random() * 5) + 1),
      4000
    );
    return () => clearInterval(t);
  }, []);
  return (
    <motion.span
      key={blocked}
      initial={{ opacity: 0.4, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="tabular-nums"
    >
      {blocked.toLocaleString()}
    </motion.span>
  );
}

const FRAMEWORKS = [
  { icon: Lock,       label: "SOC 2",   color: "text-indigo-400",  ring: "ring-indigo-500/30 bg-indigo-500/10"  },
  { icon: HeartPulse, label: "HIPAA",   color: "text-emerald-400", ring: "ring-emerald-500/30 bg-emerald-500/10" },
  { icon: Shield,     label: "CMMC L2", color: "text-amber-400",   ring: "ring-amber-500/30 bg-amber-500/10"   },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-28 pb-0 px-6">
      {/* Layered bg */}
      <div className="absolute inset-0 bg-dot-grid opacity-[0.06] pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(245,200,66,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 80% 80%, rgba(99,102,241,0.04) 0%, transparent 60%)",
        }}
      />

      {/* Hero text — centered */}
      <div className="relative z-10 max-w-4xl mx-auto text-center mb-14">

        {/* Framework badges */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
          className="flex flex-wrap items-center justify-center gap-2 mb-8"
        >
          {FRAMEWORKS.map(({ icon: Icon, label, color, ring }) => (
            <div key={label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ring-1 ${ring} text-xs font-semibold uppercase tracking-wider`}>
              <Icon className={`w-3 h-3 ${color}`} />
              <span className={color}>{label}</span>
            </div>
          ))}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ring-1 ring-white/10 bg-white/[0.04] text-xs font-semibold uppercase tracking-wider text-slate-500">
            One Deployment
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.25, 0.4, 0.25, 1] }}
          className="font-editorial text-[clamp(40px,7vw,80px)] font-bold leading-[1.0] tracking-[-2px] text-white mb-6"
        >
          Stop AI data leaks.
          <br />
          <span className="bg-gradient-to-r from-brand-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">
            Pass every audit.
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-[clamp(16px,2vw,20px)] text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Kaelus intercepts every AI prompt before it leaves your network —
          simultaneously enforcing SOC&nbsp;2, HIPAA, and CMMC Level&nbsp;2.
          One 15-minute deployment. No switching between tools.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
        >
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(200,125,62,0.4)] text-base"
          >
            Start Free — All Frameworks
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white/[0.05] hover:bg-white/[0.09] text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all hover:-translate-y-0.5 text-base"
          >
            Watch Demo
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Live threat counter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.42 }}
          className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.07]"
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Live</span>
          </span>
          <span className="text-sm font-mono text-white"><LiveCounter /></span>
          <span className="text-xs font-mono text-slate-500">AI threats blocked today</span>
          <span className="hidden sm:block w-px h-4 bg-white/10" />
          <span className="hidden sm:block text-xs font-mono text-slate-600">&lt;10ms · 16 engines</span>
        </motion.div>
      </div>

      {/* ── Floating Dashboard Mockup — Vanta-style 3D perspective ──── */}
      {/* Perspective parent — must be separate from transformed child */}
      <div style={{ perspective: "1400px" }} className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 80, rotateX: 22, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, rotateX: 10, scale: 1 }}
          transition={{ duration: 1.3, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Glow beneath the screen for depth */}
          <div
            aria-hidden="true"
            className="absolute -inset-x-10 -bottom-10 h-40 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(99,102,241,0.18) 0%, transparent 70%)",
              filter: "blur(24px)",
            }}
          />

          {/* Browser chrome bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-[#111118] border border-white/[0.07] rounded-t-2xl border-b-0">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/60" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
            </div>
            <div className="flex-1 mx-4">
              <div className="max-w-xs mx-auto flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.05] border border-white/[0.06]">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-mono text-slate-500">app.kaelus.online/command-center</span>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="w-3.5 h-1 rounded-full bg-white/10" />
              <span className="w-3.5 h-1 rounded-full bg-white/10" />
            </div>
          </div>

          {/* Dashboard content */}
          <div className="border border-white/[0.07] border-t-0 rounded-b-2xl overflow-hidden shadow-[0_60px_160px_rgba(0,0,0,0.9)]">
            <PlatformDashboard />
          </div>

          {/* Bottom fade — blends into next section */}
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#07070b] via-[#07070b]/70 to-transparent pointer-events-none z-20" />
        </motion.div>
      </div>
    </section>
  );
}
