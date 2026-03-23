"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
    ShieldCheck, AlertTriangle, Lock, ArrowRight, CheckCircle2,
    Key, Mail, CreditCard, Globe, Database, Fingerprint,
    Eye, Zap, Shield, RotateCcw, ChevronRight, Building2,
    FileText, Lightbulb, BookOpen, Brain, Radar, Activity,
    Server, Users, ChevronDown, ExternalLink, Package
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   THREAT PATTERNS — what the scanner checks for
   ═══════════════════════════════════════════════════════ */
const THREAT_PATTERNS = [
    {
        pattern: /sk-[a-zA-Z0-9_-]{20,}/g,
        label: "OpenAI API Key",
        icon: Key,
        severity: "critical" as const,
        tip: "Rotate this key immediately in your OpenAI dashboard. Never hardcode API keys in source code — use environment variables or a secrets vault (e.g., AWS Secrets Manager, HashiCorp Vault).",
        impact: "An exposed API key lets anyone make API calls billed to your account and access your fine-tuned models.",
        fix: "Store keys in env vars, use .gitignore for .env files, and enable key rotation policies."
    },
    {
        pattern: /AKIA[0-9A-Z]{16}/g,
        label: "AWS Access Key",
        icon: Key,
        severity: "critical" as const,
        tip: "Deactivate and rotate this key in IAM immediately. Use IAM Roles instead of long-lived access keys wherever possible.",
        impact: "Leaked AWS keys can be used to spin up resources, exfiltrate data from S3, or compromise your entire cloud infrastructure.",
        fix: "Use IAM roles for EC2/Lambda, enable MFA, set up AWS Config rules to detect exposed keys."
    },
    {
        pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
        label: "Social Security Number (SSN)",
        icon: Fingerprint,
        severity: "critical" as const,
        tip: "SSNs must never appear in AI prompts. Tokenize or mask them before processing. This is a HIPAA/PII violation.",
        impact: "SSN exposure leads to identity theft, regulatory fines (up to $50K per violation under HIPAA), and lawsuits.",
        fix: "Implement PII tokenization — replace SSNs with tokens like [SSN-REDACTED] before sending to any LLM."
    },
    {
        pattern: /\b4\d{3}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
        label: "Credit Card Number",
        icon: CreditCard,
        severity: "high" as const,
        tip: "Never send card numbers to external AI. Use payment tokens from Stripe/Braintree instead. This violates PCI-DSS.",
        impact: "Credit card exposure triggers PCI-DSS non-compliance fines ($5K–$100K/month) and mandatory forensic audits.",
        fix: "Use payment processor tokenization. Never store or transmit raw card numbers."
    },
    {
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        label: "Email Address",
        icon: Mail,
        severity: "medium" as const,
        tip: "Emails are PII under GDPR. Anonymize them (e.g., j***@company.com) before including in AI prompts.",
        impact: "Email exposure enables phishing attacks and violates GDPR Article 5 (data minimization principle).",
        fix: "Use email masking patterns: first letter + *** + @domain. Implement DLP rules."
    },
    {
        pattern: /\b(?:password|passwd|pwd)\s*[=:]\s*\S+/gi,
        label: "Password / Credential Leak",
        icon: Lock,
        severity: "critical" as const,
        tip: "Change this password immediately. Use a password manager and never include credentials in code or prompts.",
        impact: "Exposed passwords enable unauthorized access to systems, lateral movement, and data exfiltration.",
        fix: "Use secrets management (Vault, AWS SM), enforce password rotation, enable MFA."
    },
    {
        pattern: /\b(?:192\.168|10\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}\b/g,
        label: "Internal IP Address",
        icon: Globe,
        severity: "medium" as const,
        tip: "Internal IPs reveal your network topology. Strip them from prompts to prevent reconnaissance attacks.",
        impact: "Attackers can use internal IPs to map your network, identify targets, and plan lateral movement.",
        fix: "Replace IPs with aliases like [INTERNAL-SERVER-1]. Block private ranges from outbound traffic."
    },
    {
        pattern: /(?:BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY)/g,
        label: "Private Key",
        icon: Lock,
        severity: "critical" as const,
        tip: "This private key is compromised. Revoke it and generate a new keypair immediately.",
        impact: "Private key exposure lets attackers impersonate your servers, decrypt traffic, and forge signatures.",
        fix: "Store private keys in HSMs or KMS. Never commit key files to repos."
    },
    {
        pattern: /(?:mongodb|postgres|mysql):\/\/[^\s]+/gi,
        label: "Database Connection String",
        icon: Database,
        severity: "critical" as const,
        tip: "Rotate the DB password and restrict access. Use connection poolers and IAM auth instead of password strings.",
        impact: "Leaked DB strings give direct access to your database — attackers can dump, modify, or delete all data.",
        fix: "Use IAM database auth, rotate credentials, restrict network access with VPC security groups."
    },
];

const SAMPLE_PROMPTS = [
    {
        name: "API Key Leak",
        icon: Key,
        text: `Help me debug this code:\nconst apiKey = "sk-proj-abc123xyz456def789ghi012jkl345mno";\nfetch("https://api.openai.com/v1/chat/completions", {\n  headers: { "Authorization": "Bearer " + apiKey }\n});`
    },
    {
        name: "Patient Record",
        icon: FileText,
        text: `Please summarize this patient record:\nPatient: John Smith, SSN: 123-45-6789\nDOB: 03/15/1985\nDiagnosis: Type 2 Diabetes\nEmail: john.smith@acmecorp.com`
    },
    {
        name: "AWS Config",
        icon: Server,
        text: `Review this config for our production deploy:\nAWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE\nAWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCY\nDB_URL=postgres://admin:SuperSecret123@prod-db.internal:5432/maindb`
    },
    {
        name: "Network Scan",
        icon: Radar,
        text: `Our internal network scan found these:\n192.168.1.100 - File Server\n10.0.0.50 - CI/CD Pipeline\npassword=admin123\nCard: 4111-1111-1111-1111`
    },
];

type ScanResult = {
    label: string;
    severity: "critical" | "high" | "medium";
    matches: string[];
    icon: typeof Key;
    tip: string;
    impact: string;
    fix: string;
};

function scanText(text: string): ScanResult[] {
    const results: ScanResult[] = [];
    for (const tp of THREAT_PATTERNS) {
        const matches = text.match(tp.pattern);
        if (matches) {
            results.push({ label: tp.label, severity: tp.severity, matches, icon: tp.icon, tip: tp.tip, impact: tp.impact, fix: tp.fix });
        }
    }
    return results;
}

const severityColor = {
    critical: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", dot: "bg-rose-500", badge: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
    high: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", dot: "bg-amber-500", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    medium: { bg: "bg-brand-500/10", border: "border-brand-500/30", text: "text-brand-400", dot: "bg-brand-500", badge: "bg-brand-500/20 text-brand-300 border-brand-500/30" },
};

/* ═══════════════════════════════════════════════════════
   COMPANY CONNECTOR COMPONENT
   ═══════════════════════════════════════════════════════ */
function CompanyConnector({ onConnect }: { onConnect: (name: string) => void }) {
    const [companyName, setCompanyName] = useState("");
    const [companyDomain, setCompanyDomain] = useState("");
    const [connected, setConnected] = useState(false);

    const handleConnect = () => {
        if (!companyName.trim()) return;
        setConnected(true);
        onConnect(companyName);
    };

    if (connected) {
        return (
            <div className="glass-card p-5 border-emerald-500/20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">{companyName}</p>
                        <p className="text-xs text-emerald-400">Connected — Scanning as {companyName}</p>
                    </div>
                    <button onClick={() => { setConnected(false); setCompanyName(""); setCompanyDomain(""); }} className="ml-auto text-xs text-slate-400 hover:text-slate-300 transition-colors">
                        Disconnect
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-4">
                <Building2 className="w-5 h-5 text-brand-400" />
                <h3 className="text-sm font-bold text-slate-300">Connect Your Company</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 font-semibold">OPTIONAL</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Tag your scan results with your company name. No data leaves your browser.</p>
            <div className="grid grid-cols-2 gap-3">
                <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Company Name"
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500/40"
                />
                <input
                    value={companyDomain}
                    onChange={(e) => setCompanyDomain(e.target.value)}
                    placeholder="Domain (optional)"
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500/40"
                />
            </div>
            <button onClick={handleConnect} disabled={!companyName.trim()} className={`mt-3 w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${companyName.trim() ? "bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30" : "bg-white/5 text-slate-400 border border-white/10 cursor-not-allowed"}`}>
                <Building2 className="w-4 h-4" /> Connect
            </button>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   EXPANDED RESULT CARD WITH FIX DETAILS
   ═══════════════════════════════════════════════════════ */
function ThreatCard({ result, companyName }: { result: ScanResult; companyName: string }) {
    const [expanded, setExpanded] = useState(false);
    const color = severityColor[result.severity];
    const Icon = result.icon;

    return (
        <div className={`rounded-xl ${color.bg} border ${color.border} overflow-hidden`}>
            <button onClick={() => setExpanded(!expanded)} className="w-full p-4 text-left">
                <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${color.text}`} />
                    <span className={`text-sm font-bold ${color.text}`}>{result.label}</span>
                    <span className={`ml-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${color.badge}`}>{result.severity}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </div>
                {result.matches.map((m, j) => (
                    <div key={j} className="text-xs font-mono bg-black/30 rounded-lg px-3 py-2 mt-3 text-slate-500 break-all">
                        {m.length > 80 ? m.slice(0, 80) + "…" : m}
                    </div>
                ))}
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                    {/* Impact */}
                    <div className="flex gap-3">
                        <AlertTriangle className={`w-4 h-4 ${color.text} mt-0.5 shrink-0`} />
                        <div>
                            <p className="text-xs font-bold text-slate-300 mb-1">Impact</p>
                            <p className="text-xs text-slate-500 leading-relaxed">{result.impact}</p>
                        </div>
                    </div>
                    {/* Quick Fix */}
                    <div className="flex gap-3">
                        <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-slate-300 mb-1">Quick Fix</p>
                            <p className="text-xs text-slate-500 leading-relaxed">{result.tip}</p>
                        </div>
                    </div>
                    {/* Recommended Action */}
                    <div className="flex gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-slate-300 mb-1">Permanent Fix</p>
                            <p className="text-xs text-slate-500 leading-relaxed">{result.fix}</p>
                        </div>
                    </div>
                    {/* Kaelus Pro upgrade prompt */}
                    <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-3 mt-2">
                        <p className="text-[11px] text-brand-300 leading-relaxed">
                            <strong>With Kaelus Pro:</strong> This {result.severity === "critical" ? "would have been auto-blocked" : "would have been flagged for review"} in real-time — before{companyName ? ` ${companyName}'s` : " your"} data reached any AI provider. Includes automated remediation suggestions in your Slack/Teams.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */
export default function FreeDemoPage() {
    const [inputText, setInputText] = useState("");
    const [results, setResults] = useState<ScanResult[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scanComplete, setScanComplete] = useState(false);
    const [totalScans, setTotalScans] = useState(0);
    const [companyName, setCompanyName] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const runScan = () => {
        if (!inputText.trim()) return;
        setIsScanning(true);
        setScanComplete(false);
        setResults([]);
        setTimeout(() => {
            const found = scanText(inputText);
            setResults(found);
            setIsScanning(false);
            setScanComplete(true);
            setTotalScans((prev) => prev + 1);
        }, 1400);
    };

    const loadSample = (idx: number) => {
        setInputText(SAMPLE_PROMPTS[idx].text);
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
    const totalThreats = results.reduce((acc, r) => acc + r.matches.length, 0);

    return (
        <div className="min-h-screen bg-[#07070b] text-white font-sans overflow-x-hidden">
            <div className="fixed top-0 left-1/4 w-[800px] h-[800px] bg-brand-500/5 rounded-full blur-[150px] pointer-events-none -z-10" />
            <div className="fixed top-1/2 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none -z-10" />

            <Navbar variant="dark" />

            <main className="pt-24 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* ═══ HEADER ═══ */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                            Test Your AI Security <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-purple-400 to-emerald-400">Right Now</span>
                        </h1>
                        <p className="text-lg text-slate-500 max-w-3xl mx-auto leading-relaxed">
                            Paste any prompt, code, or message your team sends to AI tools like ChatGPT, Claude, or Copilot.
                            Our scanner instantly checks for <strong className="text-slate-300">9 categories</strong> of sensitive data leaks — and tells you exactly how to fix them.
                        </p>
                    </div>

                    {/* ═══ HOW TO USE (Step-by-step) ═══ */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                        {[
                            { step: "1", title: "Connect (optional)", desc: "Tag scans with your company name", icon: Building2, color: "text-brand-400" },
                            { step: "2", title: "Paste Your Prompt", desc: "Or pick from our sample scenarios", icon: FileText, color: "text-purple-400" },
                            { step: "3", title: "Scan for Threats", desc: "We check 9 threat patterns in <50ms", icon: Radar, color: "text-amber-400" },
                            { step: "4", title: "Get Fix Reports", desc: "Detailed impact + remediation tips", icon: Lightbulb, color: "text-emerald-400" },
                        ].map((s) => {
                            const Icon = s.icon;
                            return (
                                <div key={s.step} className="glass-card p-4 text-center group hover:border-brand-500/20 transition-all">
                                    <div className={`text-xs font-black ${s.color} mb-2`}>STEP {s.step}</div>
                                    <Icon className={`w-6 h-6 ${s.color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
                                    <p className="text-sm font-bold text-white mb-1">{s.title}</p>
                                    <p className="text-[11px] text-slate-400">{s.desc}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* ═══ COMPANY CONNECTOR ═══ */}
                    <div className="mb-6">
                        <CompanyConnector onConnect={setCompanyName} />
                    </div>

                    {/* ═══ MAIN SCANNER LAYOUT ═══ */}
                    <div className="grid lg:grid-cols-5 gap-6">
                        {/* Left: Input */}
                        <div className="lg:col-span-3 space-y-4">
                            {/* Sample Buttons */}
                            <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-xs text-slate-400">Try a sample:</span>
                                {SAMPLE_PROMPTS.map((sample, i) => {
                                    const SIcon = sample.icon;
                                    return (
                                        <button key={sample.name} onClick={() => loadSample(i)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.08] hover:border-white/15 transition-all flex items-center gap-1.5">
                                            <SIcon className="w-3 h-3" /> {sample.name}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Textarea */}
                            <div className="relative">
                                <textarea
                                    ref={textareaRef}
                                    value={inputText}
                                    onChange={(e) => { setInputText(e.target.value); setScanComplete(false); }}
                                    placeholder="Paste your AI prompt, code, or message here to scan for sensitive data..."
                                    rows={12}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-5 text-sm font-mono text-slate-200 placeholder:text-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 resize-none transition-all"
                                />
                                {inputText && (
                                    <button onClick={clearAll} className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-slate-300 hover:bg-white/[0.08] transition-all" title="Clear">
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Scan Button */}
                            <button
                                onClick={runScan}
                                disabled={!inputText.trim() || isScanning}
                                className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all ${isScanning ? "bg-brand-500/30 text-brand-300 cursor-wait" : inputText.trim() ? "btn-primary shadow-[0_0_30px_rgba(99,102,241,0.4)]" : "bg-white/5 text-slate-400 cursor-not-allowed border border-white/10"}`}
                            >
                                {isScanning ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin" />
                                        Scanning 9 Threat Categories...
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
                            <div className="glass-card p-5 min-h-[400px] flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                                        {companyName ? `${companyName} — Scan Results` : "Scan Results"}
                                    </h3>
                                    {totalScans > 0 && <span className="text-xs text-slate-400">{totalScans} scan{totalScans !== 1 ? "s" : ""}</span>}
                                </div>

                                {/* Empty State */}
                                {!scanComplete && !isScanning && (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-8">
                                        <Eye className="w-10 h-10 mb-3 opacity-30" />
                                        <p className="text-sm mb-1">Paste text and click Scan</p>
                                        <p className="text-[11px] text-slate-300">Results will appear here with fix recommendations</p>
                                    </div>
                                )}

                                {/* Scanning */}
                                {isScanning && (
                                    <div className="flex-1 flex flex-col items-center justify-center py-8">
                                        <div className="w-12 h-12 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mb-4" />
                                        <p className="text-sm text-brand-300 animate-pulse">Checking 9 categories...</p>
                                        <p className="text-[11px] text-slate-300 mt-1">API Keys • SSN • Credit Cards • Passwords • IPs • DB Strings</p>
                                    </div>
                                )}

                                {/* All Clear */}
                                {scanComplete && results.length === 0 && (
                                    <div className="flex-1 flex flex-col items-center justify-center py-8">
                                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mb-4">
                                            <ShieldCheck className="w-8 h-8 text-emerald-400" />
                                        </div>
                                        <p className="text-emerald-400 font-bold text-lg mb-1">All Clear!</p>
                                        <p className="text-slate-400 text-sm text-center">No sensitive data detected. This prompt is safe to send to AI.</p>
                                    </div>
                                )}

                                {/* Threats Found */}
                                {scanComplete && results.length > 0 && (
                                    <div className="space-y-3 flex-1 overflow-y-auto">
                                        {/* Summary */}
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {criticalCount > 0 && (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                                    <span className="text-[11px] font-bold text-rose-400">{criticalCount} Critical</span>
                                                </div>
                                            )}
                                            {highCount > 0 && (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                    <span className="text-[11px] font-bold text-amber-400">{highCount} High</span>
                                                </div>
                                            )}
                                            {mediumCount > 0 && (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/20">
                                                    <div className="w-2 h-2 rounded-full bg-brand-500" />
                                                    <span className="text-[11px] font-bold text-brand-400">{mediumCount} Medium</span>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-xs text-slate-400 mb-2">Click each threat to see impact, fix tips, and why you need Kaelus Pro ↓</p>

                                        {results.map((r, i) => (
                                            <ThreatCard key={i} result={r} companyName={companyName} />
                                        ))}

                                        {/* CTA */}
                                        <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-brand-500/15 to-purple-500/15 border border-brand-500/25">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Package className="w-4 h-4 text-brand-400" />
                                                <p className="text-sm font-bold text-white">Kaelus Pro Package</p>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                                                This free scanner shows you the problem. <strong className="text-slate-300">Kaelus Pro</strong> fixes it automatically — blocking leaks in real-time before your team&apos;s data reaches external AI providers.
                                            </p>
                                            <Link href="/auth" className="btn-primary w-full text-center text-sm !py-3 mb-2">
                                                Get Full Protection <ArrowRight className="w-4 h-4" />
                                            </Link>
                                            <Link href="/pricing" className="btn-ghost w-full text-center text-xs !py-2.5">
                                                Compare Plans <ChevronRight className="w-3 h-3" />
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ═══ AI CAPABILITIES SECTION ═══ */}
                    <div className="mt-20">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold tracking-tight mb-3">What Our AI Scans For</h2>
                            <p className="text-sm text-slate-400 max-w-2xl mx-auto">Kaelus uses 13 AI models to detect 9 categories of sensitive data. Here&apos;s every threat pattern we check — and what makes our detection smarter than regex-only tools.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                            {THREAT_PATTERNS.map((tp) => {
                                const Icon = tp.icon;
                                const color = severityColor[tp.severity];
                                return (
                                    <div key={tp.label} className="glass-card p-4 group hover:border-brand-500/20 transition-all">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Icon className={`w-5 h-5 ${color.text}`} />
                                            <span className="text-sm font-bold text-slate-300">{tp.label}</span>
                                            <span className={`ml-auto text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${color.badge}`}>{tp.severity}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 leading-relaxed">{tp.tip.slice(0, 120)}{tp.tip.length > 120 ? "…" : ""}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ═══ HOW TO TAKE THE TEST (DETAILED GUIDE) ═══ */}
                    <div className="mt-16 glass-card p-8 md:p-10">
                        <div className="flex items-center gap-3 mb-6">
                            <BookOpen className="w-6 h-6 text-brand-400" />
                            <h2 className="text-2xl font-bold">How to Take the Test — Step by Step</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-5">
                                <div>
                                    <h3 className="text-sm font-bold text-brand-300 mb-2">1. Connect Your Company (Optional)</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">Enter your company name to tag scan results. This is purely for your reference — no data leaves your browser. If you skip this, scans still work normally.</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-brand-300 mb-2">2. Paste Real Prompts</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">Copy any text your team typically sends to ChatGPT, Claude, Copilot, or other AI tools. This could be code snippets, Slack messages, emails, support tickets, or config files. The more realistic, the better.</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-brand-300 mb-2">3. Or Use Sample Scenarios</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">Not sure what to test? Click one of the 4 sample buttons (API Key Leak, Patient Record, AWS Config, Network Scan) to load a realistic scenario and see the scanner in action.</p>
                                </div>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <h3 className="text-sm font-bold text-brand-300 mb-2">4. Review the Threat Report</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">Each detected threat shows the exact match, severity level (Critical/High/Medium), impact assessment, and two levels of fix recommendations — a quick fix and a permanent solution.</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-brand-300 mb-2">5. Understand What You Need</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">This free scanner uses regex patterns. <strong className="text-slate-300">Kaelus Pro</strong> uses 13 AI models that understand <em>context</em> — it knows &quot;Apple&quot; in a recipe is not the same as &quot;Apple&quot; the company. That&apos;s why you need the full package.</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-emerald-300 mb-2">6. Get the Full Package</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">Ready to protect your company? Sign up for Kaelus Pro to get real-time blocking, Slack/Teams alerts, compliance reports (SOC 2, GDPR, HIPAA), and an immutable audit trail.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══ WHY FREE SCANNER ≠ FULL PROTECTION ═══ */}
                    <div className="mt-10 grid md:grid-cols-2 gap-6">
                        <div className="glass-card p-6">
                            <h3 className="text-sm font-bold text-slate-500 mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> This Free Demo</h3>
                            <ul className="space-y-2.5">
                                {[
                                    "9 regex-based threat patterns",
                                    "Runs in your browser (no server)",
                                    "Basic quick fix tips",
                                    "No real-time interception",
                                    "No audit logs",
                                    "No compliance reports",
                                ].map(item => (
                                    <li key={item} className="flex items-start gap-2 text-xs text-slate-400">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="glass-card-glow p-6 border-brand-500/20">
                            <h3 className="text-sm font-bold text-brand-300 mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-brand-400" /> Kaelus Pro Package</h3>
                            <ul className="space-y-2.5">
                                {[
                                    "13 AI models with context awareness",
                                    "Real-time gateway — blocks before AI sees data",
                                    "Detailed remediation with auto-fix suggestions",
                                    "Immutable SHA-256 audit trail",
                                    "1-click SOC 2, GDPR, HIPAA reports",
                                    "Slack/Teams alerts + HITL review queue",
                                ].map(item => (
                                    <li key={item} className="flex items-start gap-2 text-xs text-slate-300">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 mt-0.5 shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link href="/pricing" className="btn-primary w-full mt-5 text-center text-sm !py-3">
                                View Pricing <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* ═══ BOTTOM STATS ═══ */}
                    <div className="mt-14 text-center">
                        <p className="text-sm text-slate-400 mb-6">🔒 This demo runs 100% in your browser. No data is sent to any server.</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                            {[
                                { label: "Patterns Checked", value: "9" },
                                { label: "Scan Speed", value: "<50ms" },
                                { label: "Your Data Sent", value: "Nowhere" },
                                { label: "Cost", value: "$0" },
                            ].map((s) => (
                                <div key={s.label} className="glass-card p-4 text-center">
                                    <div className="text-xl font-bold text-white mb-1">{s.value}</div>
                                    <div className="text-xs text-slate-400">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <footer className="border-t border-white/10 bg-transparent py-8">
                <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
                    &copy; {new Date().getFullYear()} Kaelus.online — All rights reserved.
                </div>
            </footer>
        </div>
    );
}
