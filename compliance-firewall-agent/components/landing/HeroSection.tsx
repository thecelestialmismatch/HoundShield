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

/* CSS-only particle field using pseudo-layered divs */
function ParticleField() {
  const particles = Array.from({ length: 60 }, (_, i) => i);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((i) => {
        const left = ((i * 37 + 13) % 97) + 1;
        const top = ((i * 53 + 7) % 93) + 2;
        const size = (i % 3) + 1;
        const animDuration = 4 + (i % 6);
        const animDelay = (i * 0.3) % 8;
        const opacity = 0.1 + (i % 5) * 0.06;
        return (
          <div
            key={i}
            className="absolute rounded-full bg-indigo-400"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}px`,
              height: `${size}px`,
              opacity,
              animation: `particle-float-${i % 4} ${animDuration}s ease-in-out ${animDelay}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden pt-24 pb-20 bg-[#07070b]">
      {/* Particle field */}
      <ParticleField />

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.4) 0%, transparent 70%)" }} />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <FadeIn>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            CMMC Level 2 · NIST 800-171 · 87,000+ DIB Contractors
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="text-[clamp(42px,7vw,88px)] font-extrabold leading-[1.05] tracking-[-2px] max-w-[920px] mx-auto mb-6 text-white">
            Your AI is leaking.{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              We stop that.
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="text-[clamp(16px,2vw,20px)] text-slate-400 max-w-[580px] mx-auto mb-10 leading-relaxed">
            Real-time compliance firewall for defense contractors. Protect CUI, ace your CMMC audit, and know your SPRS score — without hiring a consultant.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(99,102,241,0.4)] text-base"
            >
              Get your free SPRS score
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#setup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/8 text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all hover:-translate-y-0.5 text-base"
            >
              See how it works
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </FadeIn>

        <FadeIn delay={0.45}>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {[
              { num: "87,000+", label: "Defense contractors need CMMC" },
              { num: "110", label: "NIST controls covered" },
              { num: "<50ms", label: "Scan latency P99" },
              { num: "10 min", label: "to your first SPRS score" },
            ].map(({ num, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-1">
                  {num}
                </div>
                <div className="text-sm text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#07070b] to-transparent pointer-events-none" />
    </section>
  );
}
