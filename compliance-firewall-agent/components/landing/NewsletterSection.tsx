"use client";

import { useState, useRef } from "react";
import { useInView } from "framer-motion";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const ref = useRef(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail("");
  }

  return (
    <section className="py-16 bg-[#0a0a10]">
      <div className="max-w-3xl mx-auto px-6">
        <div
          ref={ref}
          className="relative rounded-3xl p-14 text-center overflow-hidden border border-white/[0.06]"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          {/* Gradient overlays */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(168,85,247,0.04) 50%, transparent 100%)" }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-60 h-px"
            style={{ background: "linear-gradient(to right, transparent, rgba(99,102,241,0.4), transparent)" }} />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[12px] font-bold text-indigo-300 mb-5">
              ✨ Stay Ahead
            </div>
            <h3 className="text-[28px] font-extrabold tracking-tight text-white mb-2.5">
              AI Security Intelligence
            </h3>
            <p className="text-sm text-white/40 max-w-[400px] mx-auto mb-7 leading-[1.7]">
              Get weekly insights on AI security threats, compliance updates, and product features. No spam, unsubscribe anytime.
            </p>

            {submitted ? (
              <div className="text-emerald-400 text-base font-semibold py-3">
                ✓ You&apos;re on the list!
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-3 max-w-[420px] mx-auto">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none">✉️</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-indigo-500/50 rounded-xl py-3 pl-10 pr-3.5 text-sm text-white placeholder:text-white/20 outline-none transition-colors"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
                >
                  Subscribe →
                </button>
              </form>
            )}

            <p className="text-[11px] text-white/15 mt-3.5">
              Join 2,000+ security professionals. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
