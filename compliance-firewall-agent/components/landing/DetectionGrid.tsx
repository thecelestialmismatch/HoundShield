"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const DETECTION_TYPES = [
  { icon: "🔑", title: "API Keys", example: "sk-proj-***, AKIA***" },
  { icon: "👁️", title: "SSN / Gov IDs", example: "123-45-6789" },
  { icon: "💳", title: "Credit Cards", example: "4111-****-****-1111" },
  { icon: "🏥", title: "Medical Data", example: "Patient names, Diagnosis" },
  { icon: "💰", title: "Financial Data", example: "Q4 Revenue, M&A terms" },
  { icon: "📧", title: "Emails / Phones", example: "user@company.com" },
  { icon: "🖥️", title: "Internal IPs", example: "192.168.x.x, *.corp" },
  { icon: "🔐", title: "Passwords", example: "DB passwords, tokens" },
  { icon: "📁", title: "Source Code", example: "private keys, schemas" },
  { icon: "🔏", title: "Crypto Secrets", example: "Private keys, seeds" },
  { icon: "📋", title: "Legal Documents", example: "Contracts, NDAs" },
  { icon: "⚗️", title: "Trade Secrets", example: "Formulas, blueprints" },
  { icon: "🪖", title: "CUI / ITAR Data", example: "Export-controlled data" },
  { icon: "🏢", title: "Corp Identifiers", example: "EIN, CAGE codes" },
  { icon: "📍", title: "PII Locations", example: "Home address, GPS" },
  { icon: "🧬", title: "Biometric Data", example: "Face IDs, fingerprints" },
];

export function DetectionGrid() {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center mb-14">
          <div className="inline-flex justify-center text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 mb-4">
            What We Detect
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-extrabold tracking-tight leading-[1.1] text-gray-900 mb-4">
            16 Data Categories.
            <br />
            Real-Time. Every Request.
          </h2>
          <p className="text-lg text-gray-600 max-w-[560px] mx-auto">
            We scan for every type of sensitive data — from API keys to medical records — across every AI request your team makes.
          </p>
        </FadeIn>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {DETECTION_TYPES.map((item, i) => (
            <FadeIn key={item.title} delay={i * 0.04}>
              <div className="group relative p-5 rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden cursor-default hover:bg-indigo-50 hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-300">
                <div className="text-[22px] mb-3 relative z-10">
                  {item.icon}
                </div>
                <h4 className="text-sm font-bold text-gray-900 mb-1.5 relative z-10">{item.title}</h4>
                <div className="text-[12px] text-gray-500 font-mono group-hover:text-indigo-600 transition-colors relative z-10">
                  {item.example}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
