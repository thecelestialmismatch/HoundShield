import Link from "next/link";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { ScrollProgressBar } from "@/components/scroll-effects";
import { InstantSnapshot } from "@/components/InstantSnapshot";
import { ENGINES, ENGINE_COUNT, PATTERN_COUNT } from "@/lib/detection/engines";
import { ArrowRight, CheckCircle2, Zap, Shield, BookOpen } from "lucide-react";

/**
 * /demo — the free, ungated, in-browser risk snapshot.
 *
 * This page used to run TWO scanners that shared no code: a canned 9-regex
 * demo with a hardcoded 1400ms `setTimeout` at the top, and `InstantSnapshot`
 * (the real engine, ending on the PDF) below it. The canned one was deleted.
 *
 * Three reasons, all of which apply to whatever replaces this next:
 *
 *   1. It was a SECOND pattern registry, and it drifted. The page said
 *      "9 categories" three times before mentioning the real 53, and the
 *      comparison table shipped "90 local patterns" — a double-counted figure
 *      `lib/detection/engines.ts` was written to delete, which survived here as
 *      a string literal where that module's guard could not see it.
 *   2. The fake `setTimeout` manufactured latency on a product whose entire
 *      claim is a sub-10ms local scan. `InstantSnapshot` reports a real
 *      `performance.now()` measurement instead.
 *   3. Its "Connect Your Company" step connected to nothing.
 *
 * Every number on this page is now computed from the shipped engine list.
 * Do not hardcode a count here; import it.
 *
 * This is a SERVER component. It was `"use client"` only because the deleted
 * scanner held useState; nothing here is interactive any more, so the engine
 * import is evaluated on the server rather than shipped. (`InstantSnapshot`
 * carries its own "use client" and pulls the pattern regexes into the browser
 * deliberately — that local scan is the product demo.)
 */
export default function FreeDemoPage() {
    return (
        <div className="min-h-screen bg-[var(--hs-surface-0)] text-[var(--hs-ink)] font-sans overflow-x-hidden">
            <ScrollProgressBar />
            <div className="fixed top-0 left-1/4 w-[800px] h-[800px] bg-brand-500/5 rounded-full blur-[150px] pointer-events-none -z-10" />
            <div className="fixed top-1/2 right-0 w-[600px] h-[600px] bg-[rgba(129,166,198,0.05)] rounded-full blur-[150px] pointer-events-none -z-10" />

            <NavV3 />

            <main className="pt-8 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* ═══ HEADER ═══ */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                            Test Your AI Security{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--hs-steel-dark)] to-[var(--hs-steel)]">Right Now</span>
                        </h1>
                        <p className="text-lg text-[var(--hs-ink-tertiary)] max-w-3xl mx-auto leading-relaxed">
                            Paste a prompt your team sends to ChatGPT, Claude or Copilot. The same{" "}
                            <strong className="text-[var(--hs-ink-secondary)]">{PATTERN_COUNT} detection patterns</strong>{" "}
                            that ship in the product scan it here — in your browser, on this device — and map every
                            finding to a NIST 800-171 control.
                        </p>
                        <p className="text-sm text-[var(--hs-ink-tertiary)] max-w-3xl mx-auto mt-3">
                            No signup. No email. Nothing uploaded.
                        </p>
                    </div>

                    {/* ═══ INSTANT AI RISK SNAPSHOT (the money-path climax — ends on the PDF) ═══ */}
                    <div className="mb-12">
                        <InstantSnapshot />
                    </div>

                    {/* ═══ WHAT THE ENGINE SCANS FOR ═══ */}
                    <div className="mt-20">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold tracking-tight mb-3">What the engine scans for</h2>
                            <p className="text-sm text-[var(--hs-ink-secondary)] max-w-2xl mx-auto">
                                {ENGINE_COUNT} detection engines across {PATTERN_COUNT} patterns — CUI markings, CAGE
                                codes, ITAR terms, PHI and more. The scan above runs this same set locally, so no
                                prompt text ever leaves your network.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
                            {ENGINES.map((engine) => (
                                <div
                                    key={engine}
                                    className="glass-card p-3 flex items-center gap-2 hover:border-brand-500/20 transition-all"
                                >
                                    <CheckCircle2 className="w-4 h-4 text-brand-700 shrink-0" />
                                    <span className="text-xs font-semibold text-[var(--hs-ink-secondary)]">{engine}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ═══ HOW TO TAKE THE TEST ═══ */}
                    <div className="mt-16 glass-card p-8 md:p-10">
                        <div className="flex items-center gap-3 mb-6">
                            <BookOpen className="w-6 h-6 text-brand-700" />
                            <h2 className="text-2xl font-bold">How to take the test — step by step</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-5">
                                <div>
                                    <h3 className="text-sm font-bold text-brand-700 mb-2">1. Paste a real prompt</h3>
                                    <p className="text-xs text-[var(--hs-ink-tertiary)] leading-relaxed">
                                        Use text your team actually sends to an AI tool — a code snippet, a support
                                        ticket, a config file, a draft email. The more realistic it is, the more
                                        honest the result. It stays on your device either way.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-brand-700 mb-2">2. Or load a scenario</h3>
                                    <p className="text-xs text-[var(--hs-ink-tertiary)] leading-relaxed">
                                        Four one-click scenarios cover defense (CUI, CAGE codes, ITAR), healthcare
                                        (a patient record), legal (an M&amp;A memo) and DevOps (a config paste with
                                        live credentials). Each one selects its industry automatically.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-brand-700 mb-2">3. Read the findings</h3>
                                    <p className="text-xs text-[var(--hs-ink-tertiary)] leading-relaxed">
                                        Every finding names the pattern, the data category, the NIST 800-171 control it
                                        implicates, and whether the proxy would block or flag it. Expand any finding for
                                        why it matters, a quick fix and a permanent one.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <h3 className="text-sm font-bold text-brand-700 mb-2">4. Check what is NOT shown</h3>
                                    <p className="text-xs text-[var(--hs-ink-tertiary)] leading-relaxed">
                                        Findings deliberately show the pattern <em>name</em>, never the matched text.
                                        Your SSN, key or CAGE code is detected and never echoed back — on screen or in
                                        the PDF. That constraint is the product, demonstrated rather than asserted.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-brand-700 mb-2">5. Generate the PDF</h3>
                                    <p className="text-xs text-[var(--hs-ink-tertiary)] leading-relaxed">
                                        A branded gap-report preview, built by your browser and never uploaded. It is
                                        marked as a preview, because a one-paste snapshot is not the tamper-evident
                                        artifact an assessor accepts.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[var(--hs-success)] mb-2">6. Get the real thing</h3>
                                    <p className="text-xs text-[var(--hs-ink-tertiary)] leading-relaxed">
                                        The $499 CMMC AI Risk Assessment Report runs the proxy in your own environment
                                        for 14 days and returns a signed PDF mapped to NIST 800-171, backed by an
                                        immutable audit trail.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══ PREVIEW vs THE REPORT ═══ */}
                    <div className="mt-10 grid md:grid-cols-2 gap-6">
                        <div className="glass-card p-6">
                            <h3 className="text-sm font-bold text-[var(--hs-ink-tertiary)] mb-4 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-brand-700" /> This free preview
                            </h3>
                            <ul className="space-y-2.5">
                                {[
                                    `All ${PATTERN_COUNT} patterns, on one prompt you paste`,
                                    "Runs in your browser — no server, no upload",
                                    "NIST 800-171 control per finding, plus remediation",
                                    "Preview PDF, generated on your device",
                                    "No real-time interception",
                                    "No audit log — nothing an assessor can verify",
                                ].map(item => (
                                    <li key={item} className="flex items-start gap-2 text-xs text-[var(--hs-ink-secondary)]">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--hs-ink-secondary)] mt-0.5 shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="glass-card-glow p-6 border-brand-500/20">
                            <h3 className="text-sm font-bold text-brand-700 mb-4 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-brand-700" /> The $499 report
                            </h3>
                            <ul className="space-y-2.5">
                                {[
                                    `The same ${ENGINE_COUNT} engines and ${PATTERN_COUNT} patterns, on EVERY prompt for 14 days`,
                                    "Inline gateway — blocks before the model sees the data",
                                    "Every finding mapped to a NIST 800-171 control",
                                    "Immutable SHA-256 hash-chained audit trail",
                                    "Signed PDF you can hand to a C3PAO assessor",
                                    "Runs in your environment (Docker) — nothing leaves it",
                                ].map(item => (
                                    <li key={item} className="flex items-start gap-2 text-xs text-[var(--hs-ink-secondary)]">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-700 mt-0.5 shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link href="/assessment" className="btn-primary w-full mt-5 text-center text-sm !py-3">
                                Get the $499 report <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/pricing"
                                className="block w-full mt-2 text-center text-xs text-[var(--hs-ink-secondary)] hover:text-brand-700"
                            >
                                See full pricing
                            </Link>
                        </div>
                    </div>

                    {/* ═══ BOTTOM STATS ═══ */}
                    <div className="mt-14 text-center">
                        <p className="text-sm text-[var(--hs-ink-secondary)] mb-6">
                            This demo runs 100% in your browser. No data is sent to any server.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                            {[
                                { label: "Patterns checked", value: String(PATTERN_COUNT) },
                                { label: "Detection engines", value: String(ENGINE_COUNT) },
                                { label: "Your data sent", value: "Nowhere" },
                                { label: "Cost", value: "$0" },
                            ].map((s) => (
                                <div key={s.label} className="glass-card p-4 text-center">
                                    <div className="text-xl font-bold text-[var(--hs-ink)] mb-1">{s.value}</div>
                                    <div className="text-xs text-[var(--hs-ink-secondary)]">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <FooterV3 />
        </div>
    );
}
