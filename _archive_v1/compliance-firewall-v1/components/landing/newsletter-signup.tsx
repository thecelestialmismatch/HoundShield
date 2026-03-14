"use client";

import { useState } from "react";
import { Mail, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { AnimatedSection } from "./animated-section";

export function NewsletterSignup() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Please enter a valid email address");
            return;
        }

        // Simulate submission
        setSubmitted(true);
        setEmail("");
    };

    return (
        <section className="py-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/[0.03] to-transparent" />
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <AnimatedSection>
                    <div className="glass-card-glow p-10 md:p-14 text-center relative overflow-hidden">
                        {/* Decorative gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-purple-500/5 rounded-2xl" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/20 bg-brand-500/10 mb-6">
                                <Sparkles className="w-4 h-4 text-brand-400" />
                                <span className="text-xs font-semibold text-brand-300 uppercase tracking-wider">
                                    Stay Ahead
                                </span>
                            </div>

                            <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
                                AI Security Intelligence
                            </h3>
                            <p className="text-sm text-white/40 mb-8 max-w-md mx-auto leading-relaxed">
                                Get weekly insights on AI security threats, compliance updates,
                                and product features. No spam, unsubscribe anytime.
                            </p>

                            {submitted ? (
                                <div className="flex items-center justify-center gap-3 text-emerald-400 py-4">
                                    <CheckCircle2 className="w-6 h-6" />
                                    <span className="text-lg font-semibold">
                                        You&apos;re on the list!
                                    </span>
                                </div>
                            ) : (
                                <form
                                    onSubmit={handleSubmit}
                                    className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                                >
                                    <div className="relative flex-1">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn-primary px-6 py-3.5 whitespace-nowrap"
                                    >
                                        Subscribe <ArrowRight className="w-4 h-4" />
                                    </button>
                                </form>
                            )}

                            {error && (
                                <p className="text-xs text-rose-400 mt-3">{error}</p>
                            )}

                            <p className="text-[11px] text-white/15 mt-4">
                                Join 2,000+ security professionals. Unsubscribe anytime.
                            </p>
                        </div>
                    </div>
                </AnimatedSection>
            </div>
        </section>
    );
}
