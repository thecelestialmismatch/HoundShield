"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ArrowDown, Globe, Shield, Brain, Lock } from "lucide-react";

export function ArchitectureDiagram() {
    const [activeLayer, setActiveLayer] = useState<number | null>(1); // default open intermediate layer

    const layers = [
        {
            name: "The Employees (Client Layer)",
            icon: Globe,
            color: "brand",
            desc_eli5: "Your team doing their normal work. They don't even know we are there.",
            items: ["Chatgpt.com", "Cursor / VS Code", "Internal Apps", "Slack Bots"],
            description: "Employees hit 'Send' on a prompt containing a secret. The traffic is intercepted at the DNS or proxy level and routed to Kaelus.",
        },
        {
            name: "The Security Guard (Firewall Engine)",
            icon: Shield,
            color: "emerald",
            desc_eli5: "The split-second check of the backpack before it leaves the building.",
            items: ["Pattern Scanner (16 types)", "Decodes Base64/Hex", "Threat Classifier", "<50ms Latency"],
            description: "Our lightning-fast regex and pattern-matching engine scans the payload. If it's clean, it passes immediately. If it has PII, it triggers an alert.",
        },
        {
            name: "The Detective (Agentic AI)",
            icon: Brain,
            color: "purple",
            desc_eli5: "If the guard is confused, the detective investigates the context to be sure.",
            items: ["ReAct Agent Loop", "13 AI Models", "8 Diagnostic Tools", "Context Verification"],
            description: "Sometimes 'apple' is a fruit, sometimes it's the company. Our autonomous agents analyze borderline cases using LLM reasoning to prevent false positives.",
        },
        {
            name: "The Safe (Security Vault)",
            icon: Lock,
            color: "amber",
            desc_eli5: "Instead of going to ChatGPT, the secret gets locked in a box only you can open.",
            items: ["AES-256 Quarantine", "SHA-256 Hash Chain", "CFO-Ready Reports", "Human Review Queue"],
            description: "The request is blocked. The secret data is encrypted and saved to a quarantine queue where an admin can review it. An immutable audit log is generated.",
        },
    ];

    const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
        brand: { bg: "bg-brand-500/10", border: "border-brand-500/30", text: "text-brand-400", glow: "shadow-[0_0_30px_-5px_rgba(99,102,241,0.2)]" },
        emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", glow: "shadow-[0_0_30px_-5px_rgba(16,185,129,0.2)]" },
        purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", glow: "shadow-[0_0_30px_-5px_rgba(168,85,247,0.2)]" },
        amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", glow: "shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)]" },
    };

    return (
        <div className="space-y-4">
            {layers.map((layer, i) => {
                const Icon = layer.icon;
                const colors = colorMap[layer.color];
                const isActive = activeLayer === i;
                return (
                    <div key={layer.name} className="relative group">
                        <button
                            onClick={() => setActiveLayer(isActive ? null : i)}
                            className={`w-full glass-card p-5 md:p-6 text-left transition-all duration-300 ${isActive ? `${colors.border} ${colors.glow} bg-white/[0.04]` : "hover:border-white/10"
                                }`}
                        >
                            <div className="flex items-start md:items-center justify-between gap-4">
                                <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
                                    <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center shrink-0 transition-transform ${isActive ? "scale-110" : ""}`}>
                                        <Icon className={`w-6 h-6 ${colors.text}`} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono font-bold tracking-wider text-white/30">LAYER {i + 1}</span>
                                        </div>
                                        <h3 className="text-lg md:text-xl font-bold text-white mb-1.5">{layer.name}</h3>
                                        <p className={`text-sm font-medium ${colors.text}`}>{layer.desc_eli5}</p>
                                    </div>
                                </div>
                                <div className="shrink-0 pt-2 md:pt-0">
                                    <ChevronDown className={`w-5 h-5 text-white/30 transition-transform duration-300 ${isActive ? "rotate-180" : ""}`} />
                                </div>
                            </div>

                            <div
                                className="overflow-hidden transition-all duration-500"
                                style={{ maxHeight: isActive ? "300px" : "0", opacity: isActive ? 1 : 0, marginTop: isActive ? "20px" : "0" }}
                            >
                                <div className="pt-5 border-t border-white/[0.06]">
                                    <p className="text-sm text-white/60 mb-5 leading-relaxed">{layer.description}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {layer.items.map((item) => (
                                            <div key={item} className="flex items-center gap-2.5 text-sm p-2 rounded-lg bg-black/20 border border-white/[0.03]">
                                                <CheckCircle2 className={`w-4 h-4 ${colors.text} shrink-0`} />
                                                <span className="text-white/80">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </button>

                        {/* Connector arrow */}
                        {i < layers.length - 1 && (
                            <div className="flex justify-center py-2 absolute -bottom-8 left-1/2 -translate-x-1/2 z-10 w-full pointer-events-none">
                                <div className="flex flex-col items-center gap-0.5">
                                    <div className={`w-[2px] h-6 transition-colors duration-300 ${isActive ? 'bg-gradient-to-b from-brand-500 to-transparent' : 'bg-white/[0.04]'}`} />
                                    <ArrowDown className={`w-4 h-4 -mt-2 transition-colors duration-300 ${isActive ? 'text-brand-500' : 'text-white/10'}`} />
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
