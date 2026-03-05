"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, TrendingUp, Zap, Globe } from "lucide-react";
import { AnimatedSection, AnimatedCounter } from "./animated-section";

interface ThreatPing {
    id: number;
    x: number;
    y: number;
    label: string;
    type: "critical" | "warning" | "info";
}

const threatTypes = [
    { label: "SSN detected in prompt", type: "critical" as const },
    { label: "API key intercepted", type: "critical" as const },
    { label: "Source code blocked", type: "warning" as const },
    { label: "Credit card redacted", type: "critical" as const },
    { label: "Internal IP filtered", type: "warning" as const },
    { label: "M&A data quarantined", type: "critical" as const },
    { label: "Medical ID blocked", type: "warning" as const },
    { label: "Password hash detected", type: "critical" as const },
    { label: "Trade secret flagged", type: "warning" as const },
    { label: "Database creds blocked", type: "critical" as const },
];

const pingColors = {
    critical: "bg-rose-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
};

const pingGlows = {
    critical: "shadow-[0_0_20px_rgba(244,63,94,0.6)]",
    warning: "shadow-[0_0_20px_rgba(245,158,11,0.6)]",
    info: "shadow-[0_0_20px_rgba(59,130,246,0.6)]",
};

export function ThreatGlobe() {
    const [pings, setPings] = useState<ThreatPing[]>([]);
    const [totalBlocked, setTotalBlocked] = useState(2847);

    useEffect(() => {
        let counter = 0;
        const interval = setInterval(() => {
            const threat = threatTypes[Math.floor(Math.random() * threatTypes.length)];
            const newPing: ThreatPing = {
                id: counter++,
                x: 10 + Math.random() * 80,
                y: 15 + Math.random() * 70,
                label: threat.label,
                type: threat.type,
            };

            setPings((prev) => [...prev.slice(-8), newPing]);
            setTotalBlocked((prev) => prev + 1);
        }, 2200);

        return () => clearInterval(interval);
    }, []);

    return (
        <section className="py-28 relative overflow-hidden bg-black/30 border-y border-white/[0.04]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <AnimatedSection className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 mb-6">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-xs font-semibold tracking-wide text-rose-300 uppercase">
                            Live Threat Intelligence
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        Threats Blocked{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">
                            Worldwide
                        </span>
                    </h2>
                    <p className="text-lg text-white/40 max-w-2xl mx-auto">
                        Our global network intercepts sensitive data leaks across every timezone, every AI provider, in real-time.
                    </p>
                </AnimatedSection>

                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    {/* Globe visualization */}
                    <AnimatedSection delay={100} className="lg:col-span-2">
                        <div className="glass-card-glow relative h-[400px] overflow-hidden">
                            {/* Grid background */}
                            <div className="absolute inset-0 bg-dot-grid opacity-30" />

                            {/* World map outline (CSS) */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Globe className="w-64 h-64 text-white/[0.03]" />
                            </div>

                            {/* Animated pings */}
                            {pings.map((ping) => (
                                <div
                                    key={ping.id}
                                    className="absolute animate-ping-fade"
                                    style={{ left: `${ping.x}%`, top: `${ping.y}%` }}
                                >
                                    {/* Outer ring */}
                                    <div
                                        className={`absolute -inset-3 rounded-full ${pingColors[ping.type]} opacity-20 animate-ping`}
                                    />
                                    {/* Core dot */}
                                    <div
                                        className={`w-3 h-3 rounded-full ${pingColors[ping.type]} ${pingGlows[ping.type]} relative z-10`}
                                    />
                                    {/* Label */}
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap bg-black/80 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white/70 font-medium backdrop-blur-sm">
                                        {ping.label}
                                    </div>
                                </div>
                            ))}

                            {/* Scan lines */}
                            <div className="scan-line" />
                        </div>
                    </AnimatedSection>

                    {/* Stats sidebar */}
                    <AnimatedSection delay={200} className="space-y-4">
                        <div className="glass-card-glow p-6 border-rose-500/20">
                            <div className="flex items-center gap-3 mb-3">
                                <ShieldAlert className="w-5 h-5 text-rose-400" />
                                <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                                    Total Blocked
                                </span>
                            </div>
                            <div className="text-4xl font-black text-rose-400 tabular-nums">
                                <AnimatedCounter target={totalBlocked} />
                            </div>
                            <p className="text-xs text-white/30 mt-2">Threats intercepted this month</p>
                        </div>

                        <div className="glass-card p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <Zap className="w-5 h-5 text-amber-400" />
                                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                                    Avg Response
                                </span>
                            </div>
                            <div className="text-4xl font-black text-amber-400">&lt;50ms</div>
                            <p className="text-xs text-white/30 mt-2">P99 interception latency</p>
                        </div>

                        <div className="glass-card p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                                    Detection Rate
                                </span>
                            </div>
                            <div className="text-4xl font-black text-emerald-400">99.9%</div>
                            <p className="text-xs text-white/30 mt-2">Zero false negatives in production</p>
                        </div>
                    </AnimatedSection>
                </div>
            </div>
        </section>
    );
}
