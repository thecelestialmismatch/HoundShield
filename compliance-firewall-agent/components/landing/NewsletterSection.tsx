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
    <section className="py-16 bg-[#07070b]">
      <div className="max-w-3xl mx-auto px-6">
        <div
          ref={ref}
          className="relative rounded-3xl p-14 text-center overflow-hidden border border-white/[0.08] bg-white/[0.04]"
        >
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-400/[0.08] border border-brand-400/20 text-[12px] font-bold text-brand-400 mb-5">
              ✨ Stay Ahead
            </div>
            <h3 className="text-[28px] font-editorial font-bold tracking-tight text-white mb-2.5">
              AI Security Intelligence
            </h3>
            <p className="text-sm text-slate-400 max-w-[400px] mx-auto mb-7 leading-[1.7]">
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
                    className="w-full bg-white/[0.06] border border-white/[0.1] focus:border-brand-400/50 rounded-xl py-3 pl-10 pr-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition-colors"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-accent hover:bg-accent-dark text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
                >
                  Subscribe →
                </button>
              </form>
            )}

            <p className="text-[11px] text-slate-600 mt-3.5">
              Join 2,000+ security professionals. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
