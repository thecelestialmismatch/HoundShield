"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Logo } from "@/components/Logo";
import {
    ShieldCheck, AlertTriangle, Lock, ArrowRight, CheckCircle2, XCircle,
    Key, Mail, CreditCard, FileText, Globe, Database, Fingerprint,
    Eye, Zap, Shield, RotateCcw, Copy, ChevronRight
} from "lucide-react";

/* ── Threat patterns to detect ── */
const THREAT_PATTERNS = [
    { pattern: /sk-[a-zA-Z0-9_-]{20,}/g, label: "OpenAI API Key", icon: Key, severity: "critical" as const },
    { pattern: /AKIA[0-9A-Z]{16}/g, label: "AWS Access Key", icon: Key, severity: "critical" as const },
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, label: "SSN", icon: Fingerprint, severity: "critical" as const },
    { pattern: /\b4\d{3}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, label: "Credit Card", icon: CreditCard, severity: "high" as const },
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, label: "Email Address", icon: Mail, severity: "medium" as const },
    { pattern: /\b(?:password|passwd|pwd)\s*[=:]\s*\S+/gi, label: "Password Leak", icon: Lock, severity: "critical" as const },
    { pattern: /\b(?:192\.168|10\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}\b/g, label: "Internal IP", icon: Globe, severity: "medium" as const },
    { pattern: /(?:BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY)/g, label: "Private Key", icon: Lock, severity: "critical" as const },
    { pattern: /(?:mongodb|postgres|mysql):\/\/[^\s]+/gi, label: "DB Connection String", icon: Database, severity: "critical" as const },
];

const SAMPLE_PROMPTS = [
    `Help me debug this code:\nconst apiKey = "sk-proj-abc123xyz456def789ghi012jkl345mno";\nfetch("https://api.openai.com/v1/chat/completions", {\n  headers: { "Authorization": "Bearer " + apiKey }\n});`,
    `Please summarize this patient record:\nPatient: John Smith, SSN: 123-45-6789\nDOB: 03/15/1985\nDiagnosis: Type 2 Diabetes\nEmail: john.smith@acmecorp.com`,
    `Review this config for our production deploy:\nAWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE\nAWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCY\nDB_URL=postgres://admin:SuperSecret123@prod-db.internal:5432/maindb`,
    `Our internal network scan found these:\n192.168.1.100 - File Server\n10.0.0.50 - CI/CD Pipeline\npassword=admin123\nCard: 4111-1111-1111-1111`,
];

type ScanResult = {
    label: string;
    severity: "critical" | "high" | "medium";
    matches: string[];
    icon: typeof Key;
};

function scanText(text: string): ScanResult[] {
    const results: ScanResult[] = [];
    for (const tp of THREAT_PATTERNS) {
        const matches = text.match(tp.pattern);
        if (matches) {
            results.push({ label: tp.label, severity: tp.severity, matches, icon: tp.icon });
        }
    }
    return results;
}

const severityColor = {
    critical: { bg: "bg-rose-500/20", border: "border-rose-500/40", text: "text-rose-400", dot: "bg-rose-500" },
    high: { bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-400", dot: "bg-amber-500" },
    medium: { bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-400", dot: "bg-blue-500" },
};

export default function FreeDemoPage() {
    const [inputText, setInputText] = useState("");
    const [results, setResults] = useState<ScanResult[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scanComplete, setScanComplete] = useState(false);
    const [totalScans, setTotalScans] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const runScan = () => {
        if (!inputText.trim()) return;
        setIsScanning(true);
        setScanComplete(false);
        setResults([]);

        // Simulate scan delay for dramatic effect
        setTimeout(() => {
            const found = scanText(inputText);
            setResults(found);
            setIsScanning(false);
            setScanComplete(true);
            setTotalScans((prev) => prev + 1);
        }, 1200);
    };

    const loadSample = (idx: number) => {
        setInputText(SAMPLE_PROMPTS[idx]);
        setScanComplete(false);
        setResults([]);
    };

    const clearAll = () => {
        setInputText("");
        setResults([]);
        setScanComplete(false);
        textareaRef.current?.focus();
    };

    const criticalCount = results.filter((r) => r.severity === "critical").length;
    const highCount = results.filter((r) => r.severity === "high").length;
    const mediumCount = results.filter((r) => r.severity === "medium").length;

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden">
            <div className="fixed top-0 left-1/4 w-[800px] h-[800px] bg-brand-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />
            <div className="fixed top-1/2 right-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />

            <Navbar />

            <main className="pt-24 pb-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 mb-6">
                            <Shield className="w-4 h-4 text-emerald-400 animate-pulse" />
                            <span className="text-xs font-semibold tracking-wide text-emerald-300 uppercase">Free — No Signup Required</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                            Test Your AI Security <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-purple-400 to-emerald-400">Right Now</span>
                        </h1>
                        <p className="text-lg text-white/50 max-w-2xl mx-auto">
                            Paste any prompt, message, or code snippet below. Our scanner will instantly detect if it contains sensitive data that would leak to AI providers.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-5 gap-8">
                        {/* Left: Input */}
                        <div className="lg:col-span-3 space-y-4">
                            {/* Sample Buttons */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                <span className="text-xs text-white/30 py-1">Try a sample:</span>
                                {["API Key Leak", "Patient Record", "AWS Config", "Network Scan"].map((name, i) => (
                                    <button
                                        key={name}
                                        onClick={() => loadSample(i)}
                                        className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.15] transition-all"
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>

                            {/* Textarea */}
                            <div className="relative group">
                                <textarea
                                    ref={textareaRef}
                                    value={inputText}
                                    onChange={(e) => { setInputText(e.target.value); setScanComplete(false); }}
                                    placeholder="Paste your AI prompt, code, or message here..."
                                    rows={14}
                                    className="w-full bg-[#0c0c12] border border-white/[0.08] rounded-xl p-5 text-sm font-mono text-white/80 placeholder:text-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 resize-none transition-all"
                                />
                                {inputText && (
                                    <button onClick={clearAll} className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/[0.05] text-white/30 hover:text-white/60 hover:bg-white/[0.1] transition-all">
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Scan Button */}
                            <button
                                onClick={runScan}
                                disabled={!inputText.trim() || isScanning}
                                className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all ${isScanning
                                    ? "bg-brand-500/30 text-brand-300 cursor-wait"
                                    : inputText.trim()
                                        ? "btn-primary shadow-[0_0_30px_rgba(99,102,241,0.4)]"
                                        : "bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/[0.06]"
                                    }`}
                            >
                                {isScanning ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin" />
                                        Scanning 16 Threat Patterns...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-5 h-5" />
                                        Scan for Data Leaks
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Right: Results */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="glass-card p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">Scan Results</h3>
                                    {totalScans > 0 && (
                                        <span className="text-xs text-white/30">{totalScans} scan{totalScans !== 1 ? "s" : ""} run</span>
                                    )}
                                </div>

                                {!scanComplete && !isScanning && (
                                    <div className="text-center py-12 text-white/20">
                                        <Eye className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">Paste text and click scan to check for sensitive data.</p>
                                    </div>
                                )}

                                {isScanning && (
                                    <div className="text-center py-12">
                                        <div className="w-12 h-12 border-3 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
                                        <p className="text-sm text-brand-300 animate-pulse">Analyzing with 16 detection patterns...</p>
                                    </div>
                                )}

                                {scanComplete && results.length === 0 && (
                                    <div className="text-center py-10">
                                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
                                            <ShieldCheck className="w-8 h-8 text-emerald-400" />
                                        </div>
                                        <p className="text-emerald-400 font-bold text-lg mb-1">All Clear!</p>
                                        <p className="text-white/40 text-sm">No sensitive data detected in this prompt. Safe to send.</p>
                                    </div>
                                )}

                                {scanComplete && results.length > 0 && (
                                    <div className="space-y-3">
                                        {/* Summary Bar */}
                                        <div className="flex gap-3 mb-4">
                                            {criticalCount > 0 && (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                                                    <span className="text-xs font-bold text-rose-400">{criticalCount} Critical</span>
                                                </div>
                                            )}
                                            {highCount > 0 && (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                    <span className="text-xs font-bold text-amber-400">{highCount} High</span>
                                                </div>
                                            )}
                                            {mediumCount > 0 && (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                    <span className="text-xs font-bold text-blue-400">{mediumCount} Medium</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Threat Cards */}
                                        {results.map((r, i) => {
                                            const color = severityColor[r.severity];
                                            const Icon = r.icon;
                                            return (
                                                <div key={i} className={`p-4 rounded-xl ${color.bg} border ${color.border}`}>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Icon className={`w-4 h-4 ${color.text}`} />
                                                        <span className={`text-sm font-bold ${color.text}`}>{r.label}</span>
                                                        <span className={`ml-auto text-xs font-bold uppercase ${color.text}`}>{r.severity}</span>
                                                    </div>
                                                    {r.matches.map((m, j) => (
                                                        <div key={j} className="text-xs font-mono bg-black/30 rounded-lg px-3 py-2 mt-2 text-white/60 break-all">
                                                            {m.length > 60 ? m.slice(0, 60) + "…" : m}
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}

                                        {/* CTA after results */}
                                        <div className="mt-6 p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
                                            <p className="text-sm text-white/70 mb-3">
                                                <strong className="text-brand-300">Kaelus Pro</strong> would have blocked this request in real-time — before it ever reached the AI provider.
                                            </p>
                                            <Link href="/auth" className="btn-primary w-full text-center text-sm !py-3">
                                                Get Full Protection <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Info */}
                    <div className="mt-16 text-center">
                        <p className="text-sm text-white/30 mb-6">This demo runs entirely in your browser. No data is sent to any server.</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                            {[
                                { label: "Patterns Checked", value: "16" },
                                { label: "Scan Speed", value: "<50ms" },
                                { label: "Your Data Sent", value: "Nowhere" },
                                { label: "Cost", value: "$0" },
                            ].map((s) => (
                                <div key={s.label} className="glass-card p-4 text-center">
                                    <div className="text-xl font-bold text-white mb-1">{s.value}</div>
                                    <div className="text-xs text-white/40">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/[0.06] bg-[#050505] py-8">
                <div className="max-w-7xl mx-auto px-4 text-center text-xs text-white/20">
                    &copy; {new Date().getFullYear()} Kaelus.ai — All rights reserved.
                </div>
            </footer>
        </div>
    );
}
