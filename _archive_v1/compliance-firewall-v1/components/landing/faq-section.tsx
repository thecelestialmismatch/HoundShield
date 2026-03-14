"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { AnimatedSection } from "./animated-section";

const faqs = [
    {
        question: "What exactly does Kaelus do?",
        answer:
            "Kaelus is an AI compliance firewall. It sits between your employees and AI providers (OpenAI, Anthropic, Google, Meta). Every prompt is scanned for sensitive data — SSNs, API keys, source code, financial data, medical records — and blocked or quarantined before it ever reaches the AI provider. Think of it as a security guard for your AI traffic.",
    },
    {
        question: "How long does it take to set up?",
        answer:
            "Under 15 minutes. You change a single line in your AI SDK configuration to point to our gateway URL — that's it. No agents to install, no infrastructure changes, no configuration files. We're API-compatible with OpenAI, Anthropic, Google, and Meta SDKs.",
    },
    {
        question: "Will it slow down my AI requests?",
        answer:
            "No. Our P99 latency is under 50ms. We use zero-copy stream scanning and parallel pattern matching across all 16 detection engines simultaneously. In real-world usage, users don't notice any difference.",
    },
    {
        question: "How is Kaelus different from traditional DLP tools?",
        answer:
            "Traditional DLP tools are regex-based — they flag the word 'Apple' even when the prompt is about a pie recipe. Kaelus uses 13 AI agents running a ReAct reasoning loop to understand context. We have a 99.9% detection rate with only 0.01% false positives. We don't just scan. We think.",
    },
    {
        question: "What compliance standards does Kaelus support?",
        answer:
            "Kaelus is designed for SOC 2 Type II, GDPR, EU AI Act, HIPAA, and ISO 27001 compliance. Every scan event is logged in an immutable SHA-256 hash chain, giving you tamper-proof audit trails. You can generate board-ready compliance reports with a single click.",
    },
    {
        question: "What happens when sensitive data is detected?",
        answer:
            "Depending on your configured policy, the data is either: (1) Blocked — the request is stopped and the user is notified with a safe alternative, (2) Quarantined — the prompt is encrypted with AES-256 and queued for human review in the HITL portal, or (3) Redacted — the sensitive portion is masked and the clean request is forwarded.",
    },
    {
        question: "Is there a free tier?",
        answer:
            "Yes. Our free tier includes up to 1,000 scans per month, 8 detection patterns, and basic audit logging. No credit card required, and the free tier is available forever. Enterprise plans unlock all 16 patterns, unlimited scans, HITL review, compliance reports, and 24/7 monitoring.",
    },
    {
        question: "Can I self-host Kaelus?",
        answer:
            "Yes. We offer a Docker-based self-hosted option for enterprises that require on-premise deployment. The self-hosted version includes the full gateway, all detection engines, the audit trail, and the dashboard. Contact our sales team for pricing.",
    },
];

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

    // JSON-LD structured data for SEO
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
            },
        })),
    };

    return (
        <section className="py-28 relative">
            <div className="absolute inset-0 bg-mesh-gradient" />
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* SEO Schema */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />

                <AnimatedSection className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] mb-6">
                        <HelpCircle className="w-4 h-4 text-brand-400" />
                        <span className="text-xs font-semibold tracking-wide text-white/50 uppercase">
                            Common Questions
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        Frequently Asked{" "}
                        <span className="text-gradient-brand">Questions</span>
                    </h2>
                    <p className="text-lg text-white/40">
                        Everything you need to know about Kaelus.
                    </p>
                </AnimatedSection>

                <div className="space-y-3">
                    {faqs.map((faq, i) => (
                        <AnimatedSection key={i} delay={i * 50}>
                            <div className="glass-card overflow-hidden">
                                <button
                                    onClick={() => toggle(i)}
                                    className="w-full flex items-center justify-between gap-4 p-6 text-left hover:bg-white/[0.02] transition-colors"
                                >
                                    <span className="text-sm font-semibold text-white/90">
                                        {faq.question}
                                    </span>
                                    <ChevronDown
                                        className={`w-5 h-5 text-white/30 shrink-0 transition-transform duration-300 ${openIndex === i ? "rotate-180" : ""
                                            }`}
                                    />
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                        }`}
                                >
                                    <div className="px-6 pb-6 text-sm text-white/40 leading-relaxed border-t border-white/[0.04] pt-4">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        </AnimatedSection>
                    ))}
                </div>
            </div>
        </section>
    );
}
