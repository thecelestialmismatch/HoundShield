"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import { AnimatedSection } from "./animated-section";

const testimonials = [
    {
        quote:
            "We deployed Kaelus in 15 minutes and it caught 47 sensitive data leaks in the first week that we had no idea were happening. Our CISO approved the budget on the spot.",
        author: "Sarah Chen",
        role: "VP of Engineering",
        company: "Series C FinTech Startup",
        rating: 5,
        metric: "47 leaks caught in Week 1",
        avatar: "SC",
        color: "bg-brand-500/20 text-brand-400",
    },
    {
        quote:
            "Before Kaelus, we had zero visibility into what our engineers were sending to AI. Now we have a complete audit trail that satisfies our SOC 2 auditors. It literally saved our compliance program.",
        author: "Marcus Williams",
        role: "Chief Information Security Officer",
        company: "Healthcare SaaS Platform",
        rating: 5,
        metric: "SOC 2 audit passed in 3 weeks",
        avatar: "MW",
        color: "bg-emerald-500/20 text-emerald-400",
    },
    {
        quote:
            "The ReAct agent loop is what sets Kaelus apart. Other DLP tools flag everything. Kaelus actually understands context — it let through recipe prompts mentioning 'Apple' while blocking actual Apple Inc. financials.",
        author: "Dr. Keiko Tanaka",
        role: "Head of AI Safety",
        company: "Enterprise Cloud Provider",
        rating: 5,
        metric: "0.01% false positive rate",
        avatar: "KT",
        color: "bg-purple-500/20 text-purple-400",
    },
    {
        quote:
            "We were about to build our own DLP solution for AI traffic. Then we found Kaelus and integrated it in a single afternoon. The ROI was immediate — we estimated it saved us $400K in potential breach costs.",
        author: "James Rodriguez",
        role: "CTO",
        company: "Legal Tech Unicorn",
        rating: 5,
        metric: "$400K saved in breach prevention",
        avatar: "JR",
        color: "bg-rose-500/20 text-rose-400",
    },
];

export function Testimonials() {
    const [active, setActive] = useState(0);

    const next = () => setActive((prev) => (prev + 1) % testimonials.length);
    const prev = () =>
        setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);

    return (
        <section className="py-28 relative">
            <div className="absolute inset-0 bg-aurora" />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <AnimatedSection className="text-center mb-16">
                    <p className="text-xs uppercase tracking-[0.2em] text-purple-400 font-semibold mb-3">
                        Customer Stories
                    </p>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        Loved by{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-brand-400">
                            Security Teams
                        </span>
                    </h2>
                    <p className="text-lg text-white/40 max-w-2xl mx-auto">
                        See why enterprise security leaders trust Kaelus to protect their most sensitive data.
                    </p>
                </AnimatedSection>

                {/* Desktop: Grid */}
                <div className="hidden md:grid md:grid-cols-2 gap-6">
                    {testimonials.map((t, i) => (
                        <AnimatedSection key={t.author} delay={i * 100}>
                            <div className="glass-card-glow p-8 h-full relative group">
                                <Quote className="absolute top-6 right-6 w-8 h-8 text-white/[0.04]" />

                                {/* Stars */}
                                <div className="flex gap-1 mb-4">
                                    {Array.from({ length: t.rating }).map((_, j) => (
                                        <Star
                                            key={j}
                                            className="w-4 h-4 fill-amber-400 text-amber-400"
                                        />
                                    ))}
                                </div>

                                {/* Quote */}
                                <p className="text-sm text-white/60 leading-relaxed mb-6 italic">
                                    &ldquo;{t.quote}&rdquo;
                                </p>

                                {/* Metric badge */}
                                <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400 mb-6">
                                    ✓ {t.metric}
                                </div>

                                {/* Author */}
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-sm font-bold border border-white/10`}
                                    >
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            {t.author}
                                        </p>
                                        <p className="text-xs text-white/30">
                                            {t.role} · {t.company}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </AnimatedSection>
                    ))}
                </div>

                {/* Mobile: Carousel */}
                <div className="md:hidden">
                    <div className="glass-card-glow p-8 relative">
                        <Quote className="absolute top-6 right-6 w-8 h-8 text-white/[0.04]" />

                        <div className="flex gap-1 mb-4">
                            {Array.from({ length: testimonials[active].rating }).map(
                                (_, j) => (
                                    <Star
                                        key={j}
                                        className="w-4 h-4 fill-amber-400 text-amber-400"
                                    />
                                )
                            )}
                        </div>

                        <p className="text-sm text-white/60 leading-relaxed mb-6 italic">
                            &ldquo;{testimonials[active].quote}&rdquo;
                        </p>

                        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400 mb-6">
                            ✓ {testimonials[active].metric}
                        </div>

                        <div className="flex items-center gap-3">
                            <div
                                className={`w-10 h-10 rounded-full ${testimonials[active].color} flex items-center justify-center text-sm font-bold border border-white/10`}
                            >
                                {testimonials[active].avatar}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">
                                    {testimonials[active].author}
                                </p>
                                <p className="text-xs text-white/30">
                                    {testimonials[active].role} · {testimonials[active].company}
                                </p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-center gap-4 mt-6">
                            <button
                                onClick={prev}
                                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="flex gap-2">
                                {testimonials.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActive(i)}
                                        className={`w-2 h-2 rounded-full transition-colors ${i === active ? "bg-brand-400" : "bg-white/20"
                                            }`}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={next}
                                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
