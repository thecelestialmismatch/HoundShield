"use client";

import { useState, useEffect } from "react";
import { Server, Search, Brain, GitBranch, FileCheck, Play, Pause, RotateCcw } from "lucide-react";

export function PipelineSimulator() {
    const [stage, setStage] = useState(0);
    const [isRunning, setIsRunning] = useState(true);
    const [logs, setLogs] = useState<Array<{ text: string; type: "info" | "warn" | "success" | "danger"; time: string }>>([]);
    const [scanProgress, setScanProgress] = useState(0);

    const sampleRequests = [
        { prompt: "Summarize Q4 earnings for internal review", result: "pass", detail: "No PII detected — 16 patterns clear" },
        { prompt: "My SSN is 123-45-6789, check my credit", result: "block", detail: "SSN detected (pattern #3) — blocked & quarantined" },
        { prompt: "Send API key sk-proj-abc123... to deploy", result: "block", detail: "API key detected (pattern #7) — encrypted quarantine" },
        { prompt: "What are best practices for GDPR compliance?", result: "pass", detail: "Clean request — routed to AI provider" },
        { prompt: "Patient John Doe, DOB 03/15/1985, diagnosis...", result: "block", detail: "PHI detected (patterns #1, #4, #12) — HIPAA violation blocked" },
        { prompt: "Compare React vs Vue for our frontend", result: "pass", detail: "No sensitive data — passed in 12ms" },
    ];

    const stageLabels = ["Intercept", "Scan", "Classify", "Route", "Log"];

    useEffect(() => {
        if (!isRunning) return;
        const interval = setInterval(() => {
            setStage((prev) => {
                const next = (prev + 1) % 6;
                if (next === 0) {
                    const req = sampleRequests[Math.floor(Math.random() * sampleRequests.length)];
                    const now = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
                    setLogs((old) => [
                        { text: `[SCAN] "${req.prompt.slice(0, 45)}..."`, type: "info" as const, time: now },
                        { text: `[${req.result === "pass" ? "PASS" : "BLOCK"}] ${req.detail}`, type: req.result === "pass" ? "success" as const : "danger" as const, time: now },
                        ...old,
                    ].slice(0, 8));
                }
                return next;
            });
            setScanProgress((p) => (p + 20) % 120);
        }, 800);
        return () => clearInterval(interval);
    }, [isRunning]);

    return (
        <div className="glass-card-glow p-6 md:p-8 border border-white/[0.08] bg-surface/50 shadow-2xl relative overflow-hidden">
            {/* Background glow depending on state */}
            <div className={`absolute -top-40 -right-40 w-96 h-96 blur-[100px] opacity-20 pointer-events-none transition-colors duration-1000 ${logs[0]?.type === "danger" ? "bg-rose-500" : logs[0]?.type === "success" ? "bg-emerald-500" : "bg-brand-500"
                }`} />

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isRunning ? "bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" : "bg-white/20"}`} />
                    <span className="text-sm font-semibold text-white tracking-wide uppercase">{isRunning ? "Live Firewall Simulator" : "Scanner Paused"}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsRunning(!isRunning)}
                        className="p-2.5 rounded-lg bg-surface hover:bg-white/[0.1] border border-white/[0.08] transition-all hover:scale-105"
                    >
                        {isRunning ? <Pause className="w-4 h-4 text-white/60" /> : <Play className="w-4 h-4 text-emerald-400" />}
                    </button>
                    <button
                        onClick={() => { setLogs([]); setStage(0); }}
                        className="p-2.5 rounded-lg bg-surface hover:bg-white/[0.1] border border-white/[0.08] transition-all hover:scale-105"
                    >
                        <RotateCcw className="w-4 h-4 text-white/60" />
                    </button>
                </div>
            </div>

            {/* Pipeline Stages */}
            <div className="flex items-center justify-between mb-8 relative z-10">
                {/* Connection line */}
                <div className="absolute left-0 right-0 top-1/2 h-1 bg-white/[0.06] rounded-full" />
                <div
                    className="absolute left-0 top-1/2 h-1 rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(stage / 4 * 100, 100)}%`, boxShadow: "0 0 10px var(--tw-gradient-to)" }}
                />

                {stageLabels.map((label, i) => {
                    const icons = [Server, Search, Brain, GitBranch, FileCheck];
                    const Icon = icons[i];
                    const isActive = stage >= i + 1;
                    const isCurrent = Math.floor(stage) === i;
                    return (
                        <div key={label} className="relative z-10 flex flex-col items-center gap-3">
                            <div
                                className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${isCurrent
                                        ? "bg-brand-500/20 border-brand-500/50 shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-110"
                                        : isActive
                                            ? "bg-emerald-500/10 border-emerald-500/30"
                                            : "bg-[#0c0c10] border-white/[0.08]"
                                    }`}
                            >
                                <Icon className={`w-5 h-5 md:w-7 md:h-7 transition-colors duration-300 ${isCurrent ? "text-brand-400" : isActive ? "text-emerald-400" : "text-white/30"
                                    }`} />
                            </div>
                            <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors ${isCurrent ? "text-brand-300" : isActive ? "text-emerald-400/80" : "text-white/30"
                                }`}>
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Scan Progress Bar */}
            <div className="mb-6 relative z-10">
                <div className="h-1.5 rounded-full bg-black/40 overflow-hidden border border-white/[0.04]">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 via-purple-500 to-emerald-500 transition-all duration-700"
                        style={{ width: `${Math.min(scanProgress, 100)}%` }}
                    />
                </div>
            </div>

            {/* Live Log Feed */}
            <div className="code-block border-white/[0.08] relative z-10 bg-black/60 shadow-inner">
                <div className="code-header border-b border-white/[0.04]">
                    <div className="code-dot bg-[#ff5f57]" />
                    <div className="code-dot bg-[#febc2e]" />
                    <div className="code-dot bg-[#28c840]" />
                    <span className="ml-2 text-xs text-white/30 font-mono font-medium">kaelus-pipeline.log</span>
                </div>
                <div className="p-5 space-y-2 min-h-[220px] max-h-[260px] overflow-hidden">
                    {logs.length === 0 ? (
                        <div className="flex h-[200px] items-center justify-center">
                            <span className="text-white/20 text-sm font-mono flex items-center gap-2">
                                <Search className="w-4 h-4 animate-spin-slow" /> Waiting for intercept...
                            </span>
                        </div>
                    ) : (
                        logs.map((log, i) => (
                            <div
                                key={`${log.time}-${i}`}
                                className="flex items-start gap-3 text-[13px] font-mono animate-fade-in"
                                style={{ animationDelay: `${i * 50}ms`, opacity: Math.max(0.3, 1 - i * 0.12) }}
                            >
                                <span className="text-white/30 shrink-0 select-none">[{log.time}]</span>
                                <span className={
                                    log.type === "success" ? "text-emerald-400 font-medium" :
                                        log.type === "danger" ? "text-rose-400 font-bold" :
                                            log.type === "warn" ? "text-amber-400 font-medium" :
                                                "text-white/60"
                                }>
                                    {log.text}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
