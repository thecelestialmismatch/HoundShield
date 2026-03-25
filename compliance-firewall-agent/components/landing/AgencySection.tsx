"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import {
  LayoutDashboard,
  Server,
  Wifi,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Layers,
} from "lucide-react";

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const LAYERS = [
  {
    num: "01",
    icon: LayoutDashboard,
    title: "Branded Command Center",
    body: "Your client logs in to a mission control panel with your agency's identity — logo, colors, domain. They can see active agents, session history, compliance scores, and audit logs without ever asking you for a status update.",
    accent: "text-[#818cf8]",
    border: "border-[#818cf8]/20",
    bg: "bg-[#818cf8]/[0.06]",
    dot: "bg-[#818cf8]",
  },
  {
    num: "02",
    icon: Server,
    title: "Dedicated Client Instance",
    body: "Each client's agents and data run in complete isolation — their own Kaelus gateway tenant, their own audit trail, their own SPRS score. One client's issue never cascades to another. Data isolation by design.",
    accent: "text-brand-400",
    border: "border-brand-400/20",
    bg: "bg-brand-400/[0.06]",
    dot: "bg-brand-400",
  },
  {
    num: "03",
    icon: Wifi,
    title: "Secure Tunnel Routing",
    body: "Client traffic routes through a custom subdomain under your agency's domain — `client.youragency.com/v1`. No open ports, no firewall changes, no static IP required. Looks and feels like a hosted product, because functionally it is.",
    accent: "text-emerald-400",
    border: "border-emerald-400/20",
    bg: "bg-emerald-400/[0.06]",
    dot: "bg-emerald-400",
  },
  {
    num: "04",
    icon: ShieldCheck,
    title: "Authentication Gate",
    body: "Before the dashboard is reachable, an access policy requires authentication. Email-based magic links — no passwords to manage, no user accounts to provision. You control exactly which emails access which client portals.",
    accent: "text-accent",
    border: "border-accent/20",
    bg: "bg-accent/[0.06]",
    dot: "bg-accent",
  },
];

const BENEFITS = [
  {
    icon: TrendingUp,
    title: "Retention",
    body: "When a client logs into their command center every day, your agency becomes infrastructure. Infrastructure doesn't get cancelled on a whim — it gets renewed.",
    color: "text-[#818cf8]",
  },
  {
    icon: DollarSign,
    title: "Pricing Power",
    body: "A branded compliance platform justifies premium retainers in a way a spreadsheet handoff never will. You're not selling hours — you're selling an operating system.",
    color: "text-brand-400",
  },
  {
    icon: Layers,
    title: "Scalability",
    body: "Once you've built the pattern once, spinning up a new client is fast. Same architecture, new subdomain, new portal, new access policy. Marginal cost per client drops dramatically.",
    color: "text-emerald-400",
  },
];

export function AgencySection() {
  return (
    <section id="agency" className="py-24 md:py-32 bg-[#07070b] relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-dot-grid opacity-[0.08] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Header */}
        <FadeIn className="max-w-2xl mb-20">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-400 mb-4">
            For MSPs &amp; Consultants
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-editorial font-bold tracking-tight leading-[1.1] text-white mb-5">
            Run compliance as{" "}
            <span className="italic text-brand-400">infrastructure.</span>
            <br />
            Not a service.
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            The Agency tier gives you a four-layer deployment pattern: a branded command center
            per client, isolated gateway instances, secure tunnel routing, and an authentication
            gate — all under your domain. Your clients pay for a platform. Not your time.
          </p>
        </FadeIn>

        {/* 4-Layer Stack */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-20">
          {LAYERS.map((layer, i) => {
            const Icon = layer.icon;
            return (
              <FadeIn key={layer.num} delay={i * 0.1}>
                <div
                  className={`relative p-7 rounded-2xl border ${layer.border} ${layer.bg} hover:border-opacity-50 hover:-translate-y-1 transition-all duration-300`}
                >
                  {/* Layer number — watermark */}
                  <div className="absolute top-4 right-6 text-[56px] font-black text-white/[0.04] leading-none select-none pointer-events-none">
                    {layer.num}
                  </div>

                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl ${layer.bg} border ${layer.border} flex items-center justify-center mb-5`}>
                    <Icon className={`w-5 h-5 ${layer.accent}`} strokeWidth={1.5} />
                  </div>

                  {/* Content */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${layer.dot} flex-shrink-0`} />
                    <span className={`text-[11px] font-bold uppercase tracking-[0.18em] ${layer.accent}`}>
                      Layer {layer.num}
                    </span>
                  </div>
                  <h3 className="text-[17px] font-bold text-white mb-2.5">{layer.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{layer.body}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>

        {/* Why this changes agency economics */}
        <FadeIn className="mb-8">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-3 text-center">
            Why this changes agency economics
          </div>
          <h3 className="text-2xl md:text-3xl font-editorial font-bold text-white text-center mb-12">
            Most agencies can&apos;t replicate this.{" "}
            <span className="italic text-brand-400">That&apos;s the point.</span>
          </h3>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {BENEFITS.map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <FadeIn key={benefit.title} delay={i * 0.1}>
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300">
                  <Icon className={`w-6 h-6 ${benefit.color} mb-4`} strokeWidth={1.5} />
                  <h4 className="text-[15px] font-bold text-white mb-2">{benefit.title}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{benefit.body}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>

        {/* CTA */}
        <FadeIn className="text-center">
          <div className="inline-flex flex-col items-center gap-4">
            <Link
              href="/signup?plan=agency"
              className="btn-primary text-sm px-8 py-3.5 rounded-xl gap-2"
            >
              Start Agency at $599/mo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-slate-600">
              Includes 25 client accounts · White-label · Partner API · Dedicated onboarding
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
