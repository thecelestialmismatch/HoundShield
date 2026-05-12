"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Shield } from "lucide-react";

const PlatformDashboard = dynamic(
  () => import("@/components/landing/PlatformDashboard").then((m) => m.PlatformDashboard),
  { ssr: false, loading: () => <div className="h-full w-full bg-[#0d0d14] rounded-b-2xl min-h-[360px]" /> }
);

const PROOF = [
  "16 CUI detection patterns",
  "CMMC Level 2 enforced",
  "HIPAA + SOC 2 simultaneous",
  "<10ms scan latency",
  "Nothing leaves your network",
];

const ease = [0.25, 0.4, 0.25, 1] as const;

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center bg-[#0a0a0a]">
      <div className="w-full max-w-7xl mx-auto px-6 py-28 lg:py-36">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">

          {/* LEFT — copy */}
          <div>
            {/* CMMC badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease }}
              className="inline-flex items-center gap-2 mb-7 px-3 py-1.5 rounded-md border border-brand-400/30 bg-brand-400/5"
            >
              <Shield className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-xs font-mono font-semibold text-brand-400 uppercase tracking-wider">
                CMMC Level 2 — HIPAA — SOC 2
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease }}
              className="font-editorial text-[clamp(38px,5.5vw,70px)] font-bold leading-[1.02] tracking-[-2px] text-white mb-5"
            >
              Proof,{" "}
              <span className="text-brand-400">not policy.</span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16, ease }}
              className="text-[clamp(15px,1.6vw,18px)] text-slate-400 max-w-lg mb-4 leading-[1.6]"
            >
              The only AI firewall that generates the audit PDF your C3PAO assessor
              actually accepts. Local-only. One URL change. Deploy in 15 minutes.
            </motion.p>

            {/* SVA callout */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.22 }}
              className="text-[13px] text-brand-400/70 font-mono mb-8"
            >
              Built for ISSO/ISSM at CMMC Level 2 defense contractors.
              November 2026 enforcement is 6 months away.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.28 }}
              className="flex flex-col sm:flex-row gap-3 mb-10"
            >
              <Link
                href="/docs/quickstart"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors text-[15px]"
              >
                Deploy in 15 minutes
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-white font-semibold rounded-lg border border-white/15 hover:border-white/30 transition-colors text-[15px]"
              >
                Book a demo
                <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Proof list */}
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.36 }}
              className="flex flex-wrap items-center gap-x-5 gap-y-2.5"
            >
              {PROOF.map((t) => (
                <li key={t} className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                  <span className="w-1 h-1 rounded-full bg-brand-400/70 flex-shrink-0" />
                  {t}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* RIGHT — product dashboard (desktop) */}
          <div className="relative hidden lg:block h-[580px]">
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#111118] border border-white/10 rounded-t-xl">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                </div>
                <div className="flex-1 mx-3">
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-white/[0.04] border border-white/[0.06]">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                    <span className="text-[10px] font-mono text-slate-500">app.houndshield.com/command-center</span>
                  </div>
                </div>
              </div>

              {/* Dashboard */}
              <div
                className="border border-white/10 border-t-0 rounded-b-xl overflow-hidden"
                style={{ height: "calc(100% - 40px)" }}
              >
                <PlatformDashboard />
              </div>
            </motion.div>
          </div>

          {/* Mobile dashboard */}
          <div className="lg:hidden mt-4">
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <PlatformDashboard />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
