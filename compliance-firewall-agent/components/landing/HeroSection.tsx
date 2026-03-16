"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";

function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden pt-24 pb-20 bg-[#F7F5F0]">
      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <FadeIn>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 text-xs font-semibold uppercase tracking-widest mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            CMMC Level 2 · NIST 800-171 · 87,000+ DIB Contractors
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="text-[clamp(38px,6.5vw,80px)] font-extrabold leading-[1.05] tracking-[-2px] max-w-[900px] mx-auto mb-6 text-gray-900">
            Your team is one ChatGPT session away from a{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 bg-clip-text text-transparent">
              CMMC violation.
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="text-[clamp(16px,2vw,20px)] text-gray-600 max-w-[620px] mx-auto mb-10 leading-relaxed">
            Kaelus.ai intercepts every AI query before it leaves your network.
            Protect CUI. Pass your C3PAO assessment. Keep your DoD contracts.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/command-center/shield/onboarding"
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(99,102,241,0.3)] text-base"
            >
              Start Free Assessment
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl border border-gray-200 hover:border-gray-300 transition-all hover:-translate-y-0.5 text-base"
            >
              See a Live Demo
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </FadeIn>

        {/* Trust bar */}
        <FadeIn delay={0.38}>
          <div className="flex flex-wrap items-center justify-center gap-6 mb-14 text-xs text-gray-500 uppercase tracking-widest font-semibold">
            {["CMMC Level 2", "NIST SP 800-171", "Real-time Protection", "<50ms Latency"].map((item, i) => (
              <span key={item} className="flex items-center gap-2">
                {i > 0 && <span className="w-1 h-1 rounded-full bg-gray-300" />}
                {item}
              </span>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.45}>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {[
              { num: "80,000+", label: "DIB contractors must certify" },
              { num: "0.5%", label: "certified today" },
              { num: "$76K", label: "avg C3PAO assessment cost" },
              { num: "<50ms", label: "Kaelus intercept latency" },
            ].map(({ num, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-1">
                  {num}
                </div>
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
