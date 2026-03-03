"use client";

import { Logo } from "@/components/Logo";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
  Shield,
  Zap,
  Lock,
  Eye,
  FileCheck,
  ArrowRight,
  Menu,
  X,
  Fingerprint,
  ShieldCheck,
  Globe,
  Activity,
  ChevronRight,
  ChevronDown,
  Server,
  Network,
  Brain,
  CheckCircle2,
  Layers,
  Clock,
  Terminal,
  Search,
  Database,
  Code2,
  LineChart,
  BookOpen,
  Workflow,
  GitBranch,
  ArrowDown,
  AlertTriangle,
  XCircle,
  Cpu,
  Radio,
  Radar,
  BarChart3,
  Key,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";

/* ===== INTERSECTION OBSERVER HOOK ===== */
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ===== LIVE PIPELINE SIMULATOR ===== */
function PipelineSimulator() {
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
    <div className="glass-card-glow p-6 md:p-8">
      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
          <span className="text-sm font-medium text-white/70">{isRunning ? "Live Simulation" : "Paused"}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-all"
          >
            {isRunning ? <Pause className="w-4 h-4 text-white/60" /> : <Play className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={() => { setLogs([]); setStage(0); }}
            className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-all"
          >
            <RotateCcw className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="flex items-center justify-between mb-8 relative">
        {/* Connection line */}
        <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-white/[0.06]" />
        <div
          className="absolute left-0 top-1/2 h-[2px] bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-500"
          style={{ width: `${Math.min(stage / 4 * 100, 100)}%` }}
        />

        {stageLabels.map((label, i) => {
          const icons = [Server, Search, Brain, GitBranch, FileCheck];
          const Icon = icons[i];
          const isActive = stage >= i + 1;
          const isCurrent = Math.floor(stage) === i;
          return (
            <div key={label} className="relative z-10 flex flex-col items-center gap-2">
              <div
                className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center border transition-all duration-500 ${
                  isCurrent
                    ? "bg-brand-500/20 border-brand-500/50 shadow-glow scale-110"
                    : isActive
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-white/[0.03] border-white/[0.08]"
                }`}
              >
                <Icon className={`w-5 h-5 md:w-6 md:h-6 transition-colors duration-300 ${
                  isCurrent ? "text-brand-400" : isActive ? "text-emerald-400" : "text-white/30"
                }`} />
              </div>
              <span className={`text-xs font-medium transition-colors ${
                isCurrent ? "text-brand-300" : isActive ? "text-emerald-400/70" : "text-white/30"
              }`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Scan Progress Bar */}
      <div className="mb-6">
        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 via-purple-500 to-emerald-500 transition-all duration-700"
            style={{ width: `${Math.min(scanProgress, 100)}%` }}
          />
        </div>
      </div>

      {/* Live Log Feed */}
      <div className="code-block">
        <div className="code-header">
          <div className="code-dot bg-[#ff5f57]" />
          <div className="code-dot bg-[#febc2e]" />
          <div className="code-dot bg-[#28c840]" />
          <span className="ml-2 text-xs text-white/30 font-mono">kaelus-pipeline.log</span>
        </div>
        <div className="p-4 space-y-1.5 min-h-[200px] max-h-[240px] overflow-hidden">
          {logs.length === 0 ? (
            <div className="text-white/20 text-xs font-mono">Waiting for requests...</div>
          ) : (
            logs.map((log, i) => (
              <div
                key={`${log.time}-${i}`}
                className="flex items-start gap-2 text-xs font-mono animate-fade-in"
                style={{ animationDelay: `${i * 50}ms`, opacity: Math.max(0.3, 1 - i * 0.12) }}
              >
                <span className="text-white/20 shrink-0">{log.time}</span>
                <span className={
                  log.type === "success" ? "text-emerald-400" :
                  log.type === "danger" ? "text-rose-400" :
                  log.type === "warn" ? "text-amber-400" :
                  "text-white/50"
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

/* ===== ARCHITECTURE DIAGRAM ===== */
function ArchitectureDiagram() {
  const [activeLayer, setActiveLayer] = useState<number | null>(null);

  const layers = [
    {
      name: "Client Layer",
      icon: Globe,
      color: "brand",
      items: ["Web Dashboard", "REST API", "SDK Integration", "Webhook Events"],
      description: "Your applications connect through our API gateway. Drop-in replacement for OpenAI, Anthropic, Google endpoints.",
    },
    {
      name: "Firewall Engine",
      icon: Shield,
      color: "emerald",
      items: ["Pattern Scanner (16 types)", "PII Detector", "Threat Classifier", "Rate Limiter"],
      description: "Every request passes through our multi-stage detection pipeline. Sub-50ms latency with zero false negatives on known patterns.",
    },
    {
      name: "AI Orchestrator",
      icon: Brain,
      color: "purple",
      items: ["ReAct Agent Loop", "Model Router (13 AI Models)", "Tool Executor (8 tools)", "Context Manager"],
      description: "Agentic AI that thinks, decides, and acts. Routes to the best model for each task with full tool access.",
    },
    {
      name: "Security Vault",
      icon: Lock,
      color: "amber",
      items: ["AES-256 Quarantine", "SHA-256 Hash Chain", "Immutable Audit Logs", "Compliance Reports"],
      description: "Blocked content is encrypted at rest. Tamper-proof audit trail with cryptographic verification at every step.",
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    brand: { bg: "bg-brand-500/10", border: "border-brand-500/30", text: "text-brand-400", glow: "shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]" },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", glow: "shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]" },
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", glow: "shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]" },
    amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", glow: "shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]" },
  };

  return (
    <div className="space-y-4">
      {layers.map((layer, i) => {
        const Icon = layer.icon;
        const colors = colorMap[layer.color];
        const isActive = activeLayer === i;
        return (
          <div key={layer.name}>
            <button
              onClick={() => setActiveLayer(isActive ? null : i)}
              className={`w-full glass-card p-5 md:p-6 text-left transition-all duration-300 ${
                isActive ? `${colors.border} ${colors.glow}` : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-white/20">LAYER {i + 1}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">{layer.name}</h3>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-white/30 transition-transform duration-300 ${isActive ? "rotate-180" : ""}`} />
              </div>

              <div
                className="overflow-hidden transition-all duration-500"
                style={{ maxHeight: isActive ? "300px" : "0", opacity: isActive ? 1 : 0, marginTop: isActive ? "16px" : "0" }}
              >
                <p className="text-sm text-white/50 mb-4">{layer.description}</p>
                <div className="grid grid-cols-2 gap-2">
                  {layer.items.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${colors.text} shrink-0`} />
                      <span className="text-white/60">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </button>

            {/* Connector arrow */}
            {i < layers.length - 1 && (
              <div className="flex justify-center py-1">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-[2px] h-3 bg-white/[0.08]" />
                  <ArrowDown className="w-3 h-3 text-white/15" />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ===== REACT AGENT LOOP VISUALIZATION ===== */
function ReActLoop() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { name: "Observe", icon: Eye, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", desc: "Agent receives request and gathers context from environment" },
    { name: "Think", icon: Brain, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30", desc: "Reasons about the best approach using chain-of-thought" },
    { name: "Act", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", desc: "Executes tools, runs scans, queries models in parallel" },
    { name: "Iterate", icon: RefreshCw, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", desc: "Evaluates result — loop until task is complete" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isActive = activeStep === i;
        return (
          <div
            key={step.name}
            className={`glass-card p-5 text-center transition-all duration-500 cursor-pointer ${
              isActive ? "border-white/15 scale-[1.03]" : ""
            }`}
            onClick={() => setActiveStep(i)}
          >
            <div className={`w-14 h-14 mx-auto rounded-xl ${step.bg} border flex items-center justify-center mb-3 transition-all duration-300 ${
              isActive ? "scale-110 shadow-lg" : ""
            }`}>
              <Icon className={`w-7 h-7 ${step.color} transition-all ${isActive ? "animate-pulse" : ""}`} />
            </div>
            <div className="text-sm font-semibold text-white mb-1">{step.name}</div>
            <p className="text-xs text-white/40 leading-relaxed">{step.desc}</p>
            {isActive && (
              <div className="mt-3 mx-auto w-8 h-0.5 rounded-full bg-gradient-to-r from-brand-400 to-purple-400" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ===== INTEGRATION CODE BLOCK ===== */
function IntegrationCode() {
  const [activeTab, setActiveTab] = useState<"python" | "typescript" | "curl">("python");

  const code: Record<string, string> = {
    python: `import requests

# Just change the base URL — everything else stays the same
response = requests.post(
    "https://kaelus.ai/api/v1/scan",
    headers={
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "Summarize Q4 earnings report",
        "model": "gpt-4o",
        "scan_level": "strict",    # strict | moderate | minimal
        "quarantine": True         # auto-encrypt flagged content
    }
)

result = response.json()
# { "status": "pass", "latency_ms": 23, "threats": [] }`,
    typescript: `const response = await fetch("https://kaelus.ai/api/v1/scan", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    prompt: "Summarize Q4 earnings report",
    model: "gpt-4o",
    scan_level: "strict",      // strict | moderate | minimal
    quarantine: true,          // auto-encrypt flagged content
  }),
});

const result = await response.json();
// { status: "pass", latency_ms: 23, threats: [] }`,
    curl: `curl -X POST https://kaelus.ai/api/v1/scan \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Summarize Q4 earnings report",
    "model": "gpt-4o",
    "scan_level": "strict",
    "quarantine": true
  }'

# Response:
# { "status": "pass", "latency_ms": 23, "threats": [] }`,
  };

  return (
    <div className="code-block overflow-hidden">
      <div className="code-header justify-between">
        <div className="flex items-center gap-2">
          <div className="code-dot bg-[#ff5f57]" />
          <div className="code-dot bg-[#febc2e]" />
          <div className="code-dot bg-[#28c840]" />
          <span className="ml-2 text-xs text-white/30 font-mono">integration.{activeTab === "curl" ? "sh" : activeTab === "python" ? "py" : "ts"}</span>
        </div>
        <div className="flex items-center gap-1">
          {(["python", "typescript", "curl"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                activeTab === tab
                  ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                  : "text-white/30 hover:text-white/50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <pre className="p-5 text-[13px] leading-relaxed overflow-x-auto">
        <code className="text-white/70">{code[activeTab]}</code>
      </pre>
    </div>
  );
}

/* ===== DETECTION PATTERNS GRID ===== */
function DetectionGrid() {
  const patterns = [
    { icon: Key, name: "API Keys & Secrets", examples: "sk-proj-***, AKIA***, ghp_***", severity: "critical" },
    { icon: Fingerprint, name: "SSN / National IDs", examples: "123-45-6789, XXX-XX-XXXX", severity: "critical" },
    { icon: Lock, name: "Credit Card Numbers", examples: "4111-****-****-1111, Luhn check", severity: "critical" },
    { icon: Eye, name: "Medical Records (PHI)", examples: "Patient names, diagnoses, DOB", severity: "high" },
    { icon: Database, name: "M&A / Financial Data", examples: "Revenue figures, acquisition plans", severity: "high" },
    { icon: Globe, name: "Email Addresses", examples: "user@company.com patterns", severity: "medium" },
    { icon: Server, name: "Internal IPs & URLs", examples: "192.168.x.x, *.internal.corp", severity: "medium" },
    { icon: Terminal, name: "Code & Credentials", examples: "passwords, tokens, env vars", severity: "critical" },
  ];

  const severityColors: Record<string, string> = {
    critical: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    high: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    medium: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {patterns.map((p) => {
        const Icon = p.icon;
        return (
          <div key={p.name} className="glass-card p-5 group hover:border-white/10 transition-all">
            <div className="flex items-start justify-between mb-3">
              <Icon className="w-5 h-5 text-white/40 group-hover:text-brand-400 transition-colors" />
              <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${severityColors[p.severity]}`}>
                {p.severity}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">{p.name}</h4>
            <p className="text-xs text-white/30 font-mono">{p.examples}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ===== MAIN PAGE ===== */
export default function HowItWorksPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  

  const timelineSteps = [
    {
      num: "01",
      title: "Connect Your AI Pipeline",
      description: "Replace your AI provider base URL with Kaelus. One line change — every API call now flows through our firewall. Supports OpenAI, Anthropic, Google, Meta, and 9 more providers.",
      icon: Network,
      color: "brand",
      detail: "base_url = \"https://kaelus.ai/v1\"",
    },
    {
      num: "02",
      title: "Real-Time Pattern Scanning",
      description: "Every prompt is scanned against 16 detection patterns in under 50ms. SSNs, credit cards, API keys, medical records, M&A data — caught before they reach the AI provider.",
      icon: Search,
      color: "emerald",
      detail: "16 patterns • <50ms • zero false negatives",
    },
    {
      num: "03",
      title: "Intelligent Classification",
      description: "Our AI agent classifies threats using a ReAct reasoning loop. It observes, thinks, acts, and iterates — choosing the optimal response for each unique request.",
      icon: Brain,
      color: "purple",
      detail: "ReAct loop • 13 AI models • 8 tools",
    },
    {
      num: "04",
      title: "Block, Quarantine, or Release",
      description: "Clean requests pass through instantly. Dangerous ones are blocked. Borderline cases are encrypted with AES-256 and queued for human review in the quarantine vault.",
      icon: ShieldCheck,
      color: "amber",
      detail: "AES-256 encryption • human-in-the-loop",
    },
    {
      num: "05",
      title: "Immutable Audit & Reporting",
      description: "Every action is logged with SHA-256 hash chains. Generate CFO-ready compliance reports with one click. Full traceability for SOC 2, GDPR, HIPAA, EU AI Act.",
      icon: FileCheck,
      color: "rose",
      detail: "SHA-256 chain • 1-click reports",
    },
  ];

  const colorMap: Record<string, { iconBg: string; iconColor: string; numColor: string; dotColor: string; lineColor: string }> = {
    brand: {
      iconBg: "bg-brand-500/10 border-brand-500/30",
      iconColor: "text-brand-400",
      numColor: "text-brand-400",
      dotColor: "bg-brand-500",
      lineColor: "from-brand-500/50",
    },
    emerald: {
      iconBg: "bg-emerald-500/10 border-emerald-500/30",
      iconColor: "text-emerald-400",
      numColor: "text-emerald-400",
      dotColor: "bg-emerald-500",
      lineColor: "from-emerald-500/50",
    },
    purple: {
      iconBg: "bg-purple-500/10 border-purple-500/30",
      iconColor: "text-purple-400",
      numColor: "text-purple-400",
      dotColor: "bg-purple-500",
      lineColor: "from-purple-500/50",
    },
    amber: {
      iconBg: "bg-amber-500/10 border-amber-500/30",
      iconColor: "text-amber-400",
      numColor: "text-amber-400",
      dotColor: "bg-amber-500",
      lineColor: "from-amber-500/50",
    },
    rose: {
      iconBg: "bg-rose-500/10 border-rose-500/30",
      iconColor: "text-rose-400",
      numColor: "text-rose-400",
      dotColor: "bg-rose-500",
      lineColor: "from-rose-500/50",
    },
  };

  return (
    <div className="min-h-screen bg-surface text-white overflow-x-hidden">
      {/* Floating Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* ===== NAVIGATION ===== */}
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="bg-dot-grid absolute inset-0" />
        <div className="bg-hero-glow absolute inset-0" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] mb-8">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-white/50">5-Step Security Pipeline</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-display font-bold tracking-tight mb-6">
              How{" "}
              <span className="text-gradient-brand">Kaelus</span>{" "}
              Protects Every Request
            </h1>
            <p className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto mb-10 leading-relaxed">
              From interception to audit — every AI request passes through 5 security stages
              in under 50 milliseconds. Here&apos;s exactly how it works.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/auth" className="btn-primary">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/features" className="btn-ghost">
                Explore Features <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </AnimatedSection>

          {/* Stats Bar */}
          <AnimatedSection delay={200} className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "<50ms", label: "Scan Latency", icon: Zap },
              { value: "16", label: "Detection Patterns", icon: Radar },
              { value: "13", label: "AI Models", icon: Brain },
              { value: "99.9%", label: "Uptime SLA", icon: Activity },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="glass-card p-4 text-center">
                  <Icon className="w-5 h-5 text-brand-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white tabular-nums">{stat.value}</div>
                  <div className="text-xs text-white/35 mt-0.5">{stat.label}</div>
                </div>
              );
            })}
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== LIVE PIPELINE SIMULATOR ===== */}
      <section className="py-20 md:py-28 relative">
        <div className="bg-aurora absolute inset-0" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-12">
            <span className="text-xs font-medium tracking-widest uppercase text-brand-400 mb-4 block">Live Demo</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Watch the Pipeline <span className="text-gradient-brand">In Action</span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              See real-time request interception, pattern scanning, and threat classification
              as prompts flow through the Kaelus firewall.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={150}>
            <PipelineSimulator />
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== 5-STEP TIMELINE ===== */}
      <section className="py-20 md:py-28 relative">
        <div className="bg-dot-grid absolute inset-0" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-16">
            <span className="text-xs font-medium tracking-widest uppercase text-emerald-400 mb-4 block">The Pipeline</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              5 Stages of{" "}
              <span className="text-gradient-brand">Protection</span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              Every request passes through each stage sequentially. Total time: under 50 milliseconds.
            </p>
          </AnimatedSection>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 md:left-8 top-0 bottom-0 w-[2px] bg-gradient-to-b from-brand-500/30 via-purple-500/20 to-transparent" />

            <div className="space-y-8">
              {timelineSteps.map((step, i) => {
                const Icon = step.icon;
                const colors = colorMap[step.color];
                return (
                  <AnimatedSection key={step.num} delay={i * 100}>
                    <div className="flex gap-6 md:gap-8">
                      {/* Timeline dot */}
                      <div className="relative shrink-0">
                        <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl ${colors.iconBg} border flex items-center justify-center relative z-10`}>
                          <Icon className={`w-6 h-6 md:w-7 md:h-7 ${colors.iconColor}`} />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="glass-card p-5 md:p-6 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`text-xs font-mono font-bold ${colors.numColor}`}>STEP {step.num}</span>
                          <div className="h-[1px] flex-1 bg-white/[0.06]" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                        <p className="text-sm text-white/45 leading-relaxed mb-3">{step.description}</p>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                          <code className="text-xs font-mono text-white/50">{step.detail}</code>
                        </div>
                      </div>
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== ARCHITECTURE DEEP DIVE ===== */}
      <section className="py-20 md:py-28 relative">
        <div className="bg-aurora absolute inset-0" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-12">
            <span className="text-xs font-medium tracking-widest uppercase text-purple-400 mb-4 block">Architecture</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              4-Layer{" "}
              <span className="text-gradient-aurora">Security Stack</span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              Click each layer to explore the components that power Kaelus.
              From client to vault — defense in depth at every level.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={150}>
            <ArchitectureDiagram />
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== ReAct AGENT SYSTEM ===== */}
      <section className="py-20 md:py-28 relative">
        <div className="bg-dot-grid absolute inset-0" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-12">
            <span className="text-xs font-medium tracking-widest uppercase text-amber-400 mb-4 block">AI Engine</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Agentic <span className="text-gradient-brand">ReAct</span> Loop
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              Not just pattern matching — Kaelus uses a reasoning AI agent that observes,
              thinks, acts, and iterates until every threat is neutralized.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={150}>
            <ReActLoop />
          </AnimatedSection>

          {/* AI Models Grid */}
          <AnimatedSection delay={300} className="mt-16">
            <h3 className="text-center text-xl font-semibold text-white mb-8">
              Powered by <span className="text-gradient-brand">13 AI Models</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[
                { name: "GPT-4o", provider: "OpenAI" },
                { name: "Claude 3.5", provider: "Anthropic" },
                { name: "Gemini Flash", provider: "Google" },
                { name: "Llama 3.3 70B", provider: "Meta" },
                { name: "DeepSeek V3", provider: "DeepSeek" },
                { name: "Qwen 2.5 72B", provider: "Alibaba" },
                { name: "Mistral Small", provider: "Mistral" },
                { name: "Gemma 3 27B", provider: "Google" },
                { name: "Nemotron 70B", provider: "NVIDIA" },
                { name: "Phi-4", provider: "Microsoft" },
                { name: "Claude Haiku", provider: "Anthropic" },
                { name: "GPT-4o Mini", provider: "OpenAI" },
                { name: "Gemini 2.5 Pro", provider: "Google" },
              ].map((m) => (
                <div
                  key={m.name}
                  className="glass-card p-3 text-center hover:border-brand-500/20 transition-colors"
                >
                  <div className="text-sm font-medium text-white">{m.name}</div>
                  <div className="text-[10px] text-white/30 mt-0.5">{m.provider}</div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== DETECTION PATTERNS ===== */}
      <section className="py-20 md:py-28 relative">
        <div className="bg-aurora absolute inset-0" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-12">
            <span className="text-xs font-medium tracking-widest uppercase text-rose-400 mb-4 block">Detection Engine</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              16 Pattern Types,{" "}
              <span className="text-gradient-fire">Zero Blind Spots</span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              Every known sensitive data pattern is scanned in parallel.
              Regex + ML hybrid detection for zero false negatives.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={150}>
            <DetectionGrid />
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== INTEGRATION ===== */}
      <section className="py-20 md:py-28 relative">
        <div className="bg-dot-grid absolute inset-0" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-12">
            <span className="text-xs font-medium tracking-widest uppercase text-brand-400 mb-4 block">Integration</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              One Line to{" "}
              <span className="text-gradient-brand">Secure Everything</span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              Change your base URL and you&apos;re protected. Works with every AI SDK —
              Python, TypeScript, curl, or any HTTP client.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={150}>
            <IntegrationCode />
          </AnimatedSection>

          {/* Supported SDKs */}
          <AnimatedSection delay={300} className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "OpenAI SDK", lang: "Python / TS" },
              { name: "Anthropic SDK", lang: "Python / TS" },
              { name: "LangChain", lang: "Python" },
              { name: "REST API", lang: "Any Language" },
            ].map((sdk) => (
              <div key={sdk.name} className="glass-card p-4 text-center">
                <div className="text-sm font-medium text-white">{sdk.name}</div>
                <div className="text-xs text-white/30 mt-1">{sdk.lang}</div>
              </div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== COMPLIANCE STANDARDS ===== */}
      <section className="py-20 md:py-28 relative">
        <div className="bg-aurora absolute inset-0" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-12">
            <span className="text-xs font-medium tracking-widest uppercase text-emerald-400 mb-4 block">Compliance</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Built for{" "}
              <span className="text-gradient-brand">Enterprise Compliance</span>
            </h2>
          </AnimatedSection>
          <AnimatedSection delay={150} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: "SOC 2 Type II", desc: "Security, availability, and confidentiality controls verified by independent auditors.", icon: ShieldCheck, color: "brand" },
              { name: "GDPR", desc: "Full data protection compliance. Right to erasure, data portability, consent management.", icon: Globe, color: "emerald" },
              { name: "HIPAA", desc: "Protected health information handled with encryption at rest and in transit. BAA available.", icon: Lock, color: "purple" },
              { name: "EU AI Act", desc: "High-risk AI system compliance. Transparency, human oversight, and risk management.", icon: Layers, color: "amber" },
            ].map((standard) => {
              const Icon = standard.icon;
              const bgColors: Record<string, string> = {
                brand: "bg-brand-500/10 border-brand-500/20",
                emerald: "bg-emerald-500/10 border-emerald-500/20",
                purple: "bg-purple-500/10 border-purple-500/20",
                amber: "bg-amber-500/10 border-amber-500/20",
              };
              const textColors: Record<string, string> = {
                brand: "text-brand-400",
                emerald: "text-emerald-400",
                purple: "text-purple-400",
                amber: "text-amber-400",
              };
              return (
                <div key={standard.name} className="glass-card p-6 flex gap-4">
                  <div className={`w-12 h-12 rounded-xl ${bgColors[standard.color]} border flex items-center justify-center shrink-0`}>
                    <Icon className={`w-6 h-6 ${textColors[standard.color]}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{standard.name}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">{standard.desc}</p>
                  </div>
                </div>
              );
            })}
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== CTA ===== */}
      <section className="py-20 md:py-28 relative">
        <div className="bg-dot-grid absolute inset-0" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            <div className="glass-card-glow p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.05] via-transparent to-purple-500/[0.05]" />
              <div className="relative z-10">
                <Logo />
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                  Ready to Secure Your{" "}
                  <span className="text-gradient-brand">AI Pipeline</span>?
                </h2>
                <p className="text-white/40 max-w-xl mx-auto mb-8">
                  Start with our free tier. No credit card required.
                  Upgrade to Pro when you&apos;re ready for unlimited scans.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link href="/auth" className="btn-primary text-base !py-3 !px-8">
                    Get Started Free <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/pricing" className="btn-ghost text-base !py-3 !px-8">
                    View Pricing <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="flex items-center justify-center gap-6 mt-6 text-xs text-white/30">
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />Free tier forever</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />No credit card</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />Cancel anytime</span>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/[0.06] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Logo className="w-7 h-7" />
                <span className="text-lg font-bold tracking-tight text-white">
                    Kaelus<span className="text-brand-400">.ai</span>
                </span>
              </Link>
              <p className="text-xs text-white/30 leading-relaxed">
                The AI compliance firewall. Protect every LLM request with real-time scanning, encrypted quarantine, and agentic intelligence.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Product</h4>
              <div className="space-y-2">
                {["Features", "How It Works", "Pricing", "Dashboard"].map((item) => (
                  <Link key={item} href={`/${item.toLowerCase().replace(/ /g, "-")}`} className="block text-sm text-white/30 hover:text-white/60 transition-colors">
                    {item}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Compliance</h4>
              <div className="space-y-2">
                {["SOC 2 Type II", "GDPR", "HIPAA", "EU AI Act"].map((item) => (
                  <span key={item} className="block text-sm text-white/30">{item}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Company</h4>
              <div className="space-y-2">
                {["Documentation", "API Reference", "GitHub", "Contact"].map((item) => (
                  <span key={item} className="block text-sm text-white/30 hover:text-white/60 cursor-pointer transition-colors">{item}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/20">&copy; 2026 Kaelus.ai — All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-white/20 hover:text-white/40 cursor-pointer transition-colors">Privacy Policy</span>
              <span className="text-xs text-white/20 hover:text-white/40 cursor-pointer transition-colors">Terms of Service</span>
              <span className="text-xs text-white/20 hover:text-white/40 cursor-pointer transition-colors">Security</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
