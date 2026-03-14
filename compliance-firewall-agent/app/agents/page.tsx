"use client";

import { Logo } from "@/components/Logo";
import { TextLogo } from "@/components/TextLogo";
import { useState, useEffect, useRef } from "react";
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
  Cpu,
  Radio,
  Radar,
  BarChart3,
  RefreshCw,
  Play,
  Pause,
  Users,
  Bot,
  Sparkles,
  Fingerprint,
  Scale,
  Briefcase,
  Microscope,
  Gavel,
  HeartPulse,
  TrendingUp,
  FileSearch,
  Wrench,
  Settings,
  MessageSquare,
  AlertTriangle,
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

/* ===== LIVE AGENT EXECUTION SIMULATOR ===== */
function AgentSimulator() {
  const [step, setStep] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [thought, setThought] = useState("");

  const execution = [
    { phase: "OBSERVE", thought: "Received request: 'Analyze Q3 financials for compliance risks'. Gathering context from knowledge base...", tool: null, color: "text-blue-400" },
    { phase: "THINK", thought: "This involves financial data analysis. I need to: (1) scan for PII, (2) check regulatory compliance, (3) identify risk patterns.", tool: null, color: "text-purple-400" },
    { phase: "ACT", thought: "Running compliance scan on input data...", tool: "Compliance Scan", color: "text-amber-400" },
    { phase: "OBSERVE", thought: "Scan complete: 0 PII violations found. Document contains revenue figures and M&A projections.", tool: null, color: "text-blue-400" },
    { phase: "THINK", thought: "Revenue data is sensitive but allowed under company policy. M&A projections need quarantine-level review. Routing to classification.", tool: null, color: "text-purple-400" },
    { phase: "ACT", thought: "Classifying sensitivity levels and generating compliance report...", tool: "Data Query", color: "text-amber-400" },
    { phase: "ACT", thought: "Generating visual compliance summary...", tool: "Chart Gen", color: "text-amber-400" },
    { phase: "RESULT", thought: "Analysis complete. 2 items flagged for review. Compliance report generated with risk assessment.", tool: null, color: "text-emerald-400" },
  ];

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setStep((prev) => {
        const next = (prev + 1) % execution.length;
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    setThought("");
    const text = execution[step].thought;
    let i = 0;
    const typeInterval = setInterval(() => {
      if (i < text.length) {
        setThought(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typeInterval);
      }
    }, 15);
    return () => clearInterval(typeInterval);
  }, [step]);

  const current = execution[step];
  const phaseColors: Record<string, string> = {
    OBSERVE: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    THINK: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    ACT: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    RESULT: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  };

  return (
    <div className="glass-card-glow p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-brand-400" />
          <span className="text-sm font-semibold text-slate-900">Agent Execution — ReAct Loop</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-all"
          >
            {isRunning ? <Pause className="w-3.5 h-3.5 text-slate-900/60" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* ReAct Steps Indicator */}
      <div className="flex items-center gap-2 mb-6">
        {["OBSERVE", "THINK", "ACT", "RESULT"].map((phase) => (
          <div
            key={phase}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all duration-300 ${
              current.phase === phase ? phaseColors[phase] : "bg-white/[0.02] text-slate-900/20 border-white/[0.06]"
            }`}
          >
            {phase}
          </div>
        ))}
      </div>

      {/* Current Thought */}
      <div className="code-block">
        <div className="code-header">
          <div className="code-dot bg-[#ff5f57]" />
          <div className="code-dot bg-[#febc2e]" />
          <div className="code-dot bg-[#28c840]" />
          <span className="ml-2 text-xs text-slate-900/30 font-mono">agent-reasoning.log</span>
        </div>
        <div className="p-5 min-h-[120px]">
          <div className="flex items-start gap-3">
            <span className={`text-xs font-mono font-bold shrink-0 mt-0.5 ${current.color}`}>
              [{current.phase}]
            </span>
            <p className="text-sm text-slate-900/60 font-mono leading-relaxed">
              {thought}
              <span className="inline-block w-0.5 h-4 bg-brand-400 ml-0.5 animate-pulse" />
            </p>
          </div>
          {current.tool && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-mono text-amber-400">Tool: {current.tool}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 via-amber-500 to-emerald-500 transition-all duration-500"
          style={{ width: `${((step + 1) / execution.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

/* ===== MAIN PAGE ===== */
export default function AgentsPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  

  const tools = [
    { icon: Search, name: "Web Search", desc: "Real-time web intelligence for threat analysis and compliance research", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { icon: Code2, name: "Code Execution", desc: "Sandboxed code runner for data processing, validation, and automated scripts", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { icon: Shield, name: "Compliance Scan", desc: "Instant PII and sensitive data detection across 16 pattern types", color: "text-brand-400", bg: "bg-brand-500/10 border-brand-500/20" },
    { icon: Database, name: "Data Query", desc: "Structured data analysis with SQL-like queries on compliance events", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    { icon: Eye, name: "File Analysis", desc: "Deep document parsing for contracts, policies, and regulatory filings", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    { icon: LineChart, name: "Chart Generation", desc: "Visual data reporting with auto-generated compliance dashboards", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
    { icon: BookOpen, name: "Knowledge Base", desc: "RAG-powered retrieval from your organization's compliance documentation", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
    { icon: Globe, name: "Web Browsing", desc: "Autonomous web navigation for regulatory monitoring and updates", color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20" },
  ];

  const models = [
    { name: "GPT-4o", provider: "OpenAI", type: "Premium", badge: "Most Capable" },
    { name: "Claude 3.5 Sonnet", provider: "Anthropic", type: "Premium", badge: "Best Reasoning" },
    { name: "Gemini 2.5 Pro", provider: "Google", type: "Premium", badge: "Multimodal" },
    { name: "GPT-4o Mini", provider: "OpenAI", type: "Premium", badge: "Fast" },
    { name: "Claude 3.5 Haiku", provider: "Anthropic", type: "Premium", badge: "Balanced" },
    { name: "Gemini Flash", provider: "Google", type: "Free", badge: "Speed King" },
    { name: "Llama 3.3 70B", provider: "Meta", type: "Free", badge: "Open Source" },
    { name: "DeepSeek V3", provider: "DeepSeek", type: "Free", badge: "Code Expert" },
    { name: "Qwen 2.5 72B", provider: "Alibaba", type: "Free", badge: "Multilingual" },
    { name: "Mistral Small", provider: "Mistral", type: "Free", badge: "Efficient" },
    { name: "Gemma 3 27B", provider: "Google", type: "Free", badge: "Compact" },
    { name: "Nemotron 70B", provider: "NVIDIA", type: "Free", badge: "Instruct" },
    { name: "Phi-4 Reasoning+", provider: "Microsoft", type: "Free", badge: "Reasoning" },
  ];

  const templates = [
    {
      name: "SOC Analyst",
      icon: ShieldCheck,
      color: "brand",
      desc: "Security operations analysis with real-time threat detection and incident response automation.",
      capabilities: ["Threat classification", "Incident triage", "Alert correlation", "IOC detection"],
      model: "Claude 3.5 Sonnet",
      tools: ["Compliance Scan", "Web Search", "Data Query"],
    },
    {
      name: "Legal Reviewer",
      icon: Gavel,
      color: "purple",
      desc: "Contract analysis and regulatory compliance review with automated clause extraction.",
      capabilities: ["Contract parsing", "Risk identification", "Clause comparison", "Regulatory mapping"],
      model: "GPT-4o",
      tools: ["File Analysis", "Knowledge Base", "Data Query"],
    },
    {
      name: "Financial Auditor",
      icon: TrendingUp,
      color: "emerald",
      desc: "Financial data compliance with SOX requirements, anomaly detection, and audit reporting.",
      capabilities: ["Anomaly detection", "SOX compliance", "Audit trails", "Report generation"],
      model: "GPT-4o",
      tools: ["Data Query", "Chart Gen", "Compliance Scan"],
    },
    {
      name: "DevSecOps Agent",
      icon: Terminal,
      color: "amber",
      desc: "Automated security scanning for CI/CD pipelines with vulnerability assessment and remediation.",
      capabilities: ["Code scanning", "Dependency audit", "Secret detection", "SBOM analysis"],
      model: "DeepSeek V3",
      tools: ["Code Execution", "Compliance Scan", "Web Search"],
    },
    {
      name: "Privacy Officer",
      icon: Fingerprint,
      color: "rose",
      desc: "GDPR/CCPA compliance monitoring, data mapping, and privacy impact assessments.",
      capabilities: ["Data mapping", "DPIA automation", "Consent tracking", "Breach assessment"],
      model: "Claude 3.5 Sonnet",
      tools: ["File Analysis", "Knowledge Base", "Compliance Scan"],
    },
    {
      name: "Healthcare Compliance",
      icon: HeartPulse,
      color: "cyan",
      desc: "HIPAA compliance monitoring, PHI detection, and healthcare data security assessment.",
      capabilities: ["PHI detection", "HIPAA audits", "Access monitoring", "Encryption verification"],
      model: "Claude 3.5 Haiku",
      tools: ["Compliance Scan", "Data Query", "Knowledge Base"],
    },
    {
      name: "Risk Analyst",
      icon: AlertTriangle,
      color: "orange",
      desc: "Enterprise risk assessment with scoring models, trend analysis, and mitigation planning.",
      capabilities: ["Risk scoring", "Trend analysis", "Mitigation plans", "Executive briefings"],
      model: "GPT-4o",
      tools: ["Data Query", "Chart Gen", "Web Search"],
    },
    {
      name: "Content Moderator",
      icon: FileSearch,
      color: "teal",
      desc: "AI-powered content review for toxicity, bias, and policy violations across all media types.",
      capabilities: ["Toxicity detection", "Bias analysis", "Policy enforcement", "Content classification"],
      model: "Gemini Flash",
      tools: ["Compliance Scan", "File Analysis", "Web Browsing"],
    },
    {
      name: "Regulatory Monitor",
      icon: Scale,
      color: "indigo",
      desc: "Real-time regulatory change monitoring across global jurisdictions with impact analysis.",
      capabilities: ["Change detection", "Impact assessment", "Jurisdiction tracking", "Compliance gaps"],
      model: "GPT-4o",
      tools: ["Web Search", "Web Browsing", "Knowledge Base"],
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
    brand: { bg: "bg-brand-500/5", border: "border-brand-500/30", text: "text-brand-400", iconBg: "bg-brand-500/10 border-brand-500/20" },
    purple: { bg: "bg-purple-500/5", border: "border-purple-500/30", text: "text-purple-400", iconBg: "bg-purple-500/10 border-purple-500/20" },
    emerald: { bg: "bg-emerald-500/5", border: "border-emerald-500/30", text: "text-emerald-400", iconBg: "bg-emerald-500/10 border-emerald-500/20" },
    amber: { bg: "bg-amber-500/5", border: "border-amber-500/30", text: "text-amber-400", iconBg: "bg-amber-500/10 border-amber-500/20" },
    rose: { bg: "bg-rose-500/5", border: "border-rose-500/30", text: "text-rose-400", iconBg: "bg-rose-500/10 border-rose-500/20" },
    cyan: { bg: "bg-cyan-500/5", border: "border-cyan-500/30", text: "text-cyan-400", iconBg: "bg-cyan-500/10 border-cyan-500/20" },
    orange: { bg: "bg-orange-500/5", border: "border-orange-500/30", text: "text-orange-400", iconBg: "bg-orange-500/10 border-orange-500/20" },
    teal: { bg: "bg-teal-500/5", border: "border-teal-500/30", text: "text-teal-400", iconBg: "bg-teal-500/10 border-teal-500/20" },
    indigo: { bg: "bg-indigo-500/5", border: "border-indigo-500/30", text: "text-indigo-400", iconBg: "bg-indigo-500/10 border-indigo-500/20" },
  };

  return (
    <div className="min-h-screen bg-surface text-slate-900 overflow-x-hidden">
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
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs text-slate-900/50">Agentic AI System</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-display font-bold tracking-tight mb-6">
              AI Agents That{" "}
              <span className="text-gradient-aurora">Think, Act & Protect</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-900/40 max-w-2xl mx-auto mb-10 leading-relaxed">
              Not just pattern matching. Kaelus agents use a ReAct reasoning loop with 8 tools
              and 13 AI models to autonomously handle compliance at scale.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/auth" className="btn-primary">
                Deploy Your First Agent <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/how-it-works" className="btn-ghost">
                See How It Works <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </AnimatedSection>

          {/* Agent stats */}
          <AnimatedSection delay={200} className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "18", label: "Agent Templates", icon: Bot },
              { value: "8", label: "Built-in Tools", icon: Wrench },
              { value: "13", label: "AI Models", icon: Cpu },
              { value: "∞", label: "Custom Agents", icon: Settings },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="glass-card p-4 text-center">
                  <Icon className="w-5 h-5 text-brand-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-900 tabular-nums">{stat.value}</div>
                  <div className="text-xs text-slate-900/35 mt-0.5">{stat.label}</div>
                </div>
              );
            })}
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== LIVE AGENT EXECUTION ===== */}
      <section className="py-20 md:py-28 relative">
        <div className="bg-aurora absolute inset-0" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-12">
            <span className="text-xs font-medium tracking-widest uppercase text-purple-400 mb-4 block">Live Demo</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Watch an Agent <span className="text-gradient-brand">Think in Real Time</span>
            </h2>
            <p className="text-slate-900/40 max-w-2xl mx-auto">
              The ReAct loop in action — observe how the agent reasons through a compliance task,
              selects tools, and arrives at a decision.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={150}>
            <AgentSimulator />
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== ReAct LOOP EXPLAINED ===== */}
      <section className="py-20 md:py-28 relative">
        <div className="bg-dot-grid absolute inset-0" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-16">
            <span className="text-xs font-medium tracking-widest uppercase text-brand-400 mb-4 block">Core Architecture</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              The <span className="text-gradient-brand">ReAct</span> Reasoning Loop
            </h2>
            <p className="text-slate-900/40 max-w-2xl mx-auto">
              Every agent follows a structured reasoning pattern: Observe the environment,
              Think about the best approach, Act using tools, and Iterate until the task is complete.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Observe", icon: Eye, color: "blue", desc: "Receives the request and gathers context. Reads previous conversation, tool outputs, and environmental state.", num: "01" },
              { name: "Think", icon: Brain, color: "purple", desc: "Chain-of-thought reasoning about the best approach. Considers multiple strategies and selects the optimal path.", num: "02" },
              { name: "Act", icon: Zap, color: "amber", desc: "Executes selected tools in parallel. Runs compliance scans, queries data, generates reports, searches the web.", num: "03" },
              { name: "Iterate", icon: RefreshCw, color: "emerald", desc: "Evaluates the result. If the task isn't complete, loops back to Observe with new context. Continues until done.", num: "04" },
            ].map((step, i) => {
              const Icon = step.icon;
              const colors: Record<string, { bg: string; text: string; border: string }> = {
                blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
                purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
                amber: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
                emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
              };
              const c = colors[step.color];
              return (
                <AnimatedSection key={step.name} delay={i * 100}>
                  <div className="glass-card p-6 h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${c.text}`} />
                      </div>
                      <span className={`text-xs font-mono font-bold ${c.text}`}>STEP {step.num}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.name}</h3>
                    <p className="text-sm text-slate-900/40 leading-relaxed">{step.desc}</p>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>

          {/* Loop Arrow Indicator */}
          <AnimatedSection delay={400} className="mt-8 flex justify-center">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass-card">
              <RefreshCw className="w-4 h-4 text-brand-400 animate-spin-slow" />
              <span className="text-sm text-slate-900/50">Loops until task complete — average 2.3 iterations</span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== 8 TOOLS ===== */}
      <section className="py-20 md:py-28 relative">
        <div className="bg-aurora absolute inset-0" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-12">
            <span className="text-xs font-medium tracking-widest uppercase text-amber-400 mb-4 block">Toolbox</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              8 Built-in <span className="text-gradient-brand">Agent Tools</span>
            </h2>
            <p className="text-slate-900/40 max-w-2xl mx-auto">
              Every agent has access to these tools. Mix and match to create specialized
              workflows for any compliance or security use case.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tools.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <AnimatedSection key={tool.name} delay={i * 75}>
                  <div className="glass-card p-5 h-full group hover:border-white/10 transition-all">
                    <div className={`w-11 h-11 rounded-xl ${tool.bg} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${tool.color}`} />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1.5">{tool.name}</h3>
                    <p className="text-xs text-slate-900/35 leading-relaxed">{tool.desc}</p>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== 13 AI MODELS ===== */}
      <section className="py-20 md:py-28 relative">
        <div className="bg-dot-grid absolute inset-0" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-12">
            <span className="text-xs font-medium tracking-widest uppercase text-emerald-400 mb-4 block">Model Router</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              <span className="text-gradient-brand">13 AI Models</span> — 8 Free
            </h2>
            <p className="text-slate-900/40 max-w-2xl mx-auto">
              Agents automatically route to the best model for each task.
              8 free models for everyday use, 5 premium for maximum capability.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model, i) => (
              <AnimatedSection key={model.name} delay={i * 50}>
                <div className="glass-card p-4 flex items-center justify-between group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      model.type === "Premium" ? "bg-amber-500/10 border border-amber-500/20" : "bg-emerald-500/10 border border-emerald-500/20"
                    }`}>
                      <Cpu className={`w-4 h-4 ${model.type === "Premium" ? "text-amber-400" : "text-emerald-400"}`} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{model.name}</div>
                      <div className="text-[10px] text-slate-900/30">{model.provider}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      model.type === "Premium"
                        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    }`}>
                      {model.type === "Premium" ? "PRO" : "FREE"}
                    </span>
                    <span className="text-[10px] text-slate-900/20 hidden sm:inline">{model.badge}</span>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== AGENT TEMPLATES ===== */}
      <section className="py-20 md:py-28 relative">
        <div className="bg-aurora absolute inset-0" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-12">
            <span className="text-xs font-medium tracking-widest uppercase text-rose-400 mb-4 block">Templates</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              18 Pre-Built <span className="text-gradient-brand">Agent Templates</span>
            </h2>
            <p className="text-slate-900/40 max-w-2xl mx-auto">
              Deploy specialized compliance agents in seconds. Each template comes with
              a fine-tuned persona, tool configuration, and domain expertise.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template, i) => {
              const Icon = template.icon;
              const colors = colorMap[template.color] || colorMap.brand;
              const isActive = activeTemplate === i;
              return (
                <AnimatedSection key={template.name} delay={i * 75}>
                  <button
                    onClick={() => setActiveTemplate(isActive ? null : i)}
                    className={`w-full text-left glass-card p-5 transition-all duration-300 ${
                      isActive ? `${colors.border} border` : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-11 h-11 rounded-xl ${colors.iconBg} border flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-900/20 transition-transform duration-300 ${isActive ? "rotate-180" : ""}`} />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mb-1">{template.name}</h3>
                    <p className="text-xs text-slate-900/40 leading-relaxed mb-3">{template.desc}</p>

                    <div
                      className="overflow-hidden transition-all duration-500"
                      style={{ maxHeight: isActive ? "200px" : "0", opacity: isActive ? 1 : 0 }}
                    >
                      <div className="pt-3 border-t border-white/[0.06] space-y-3">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-slate-900/30">Capabilities</span>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {template.capabilities.map((cap) => (
                              <span key={cap} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-900/40">
                                {cap}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-900/30">Model: <span className={colors.text}>{template.model}</span></span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {template.tools.map((t) => (
                            <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                </AnimatedSection>
              );
            })}
          </div>

          <AnimatedSection delay={700} className="mt-8 text-center">
            <p className="text-sm text-slate-900/30">
              + 9 more templates available in the Dashboard, plus unlimited custom agent creation
            </p>
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== AGENT BUILDER PREVIEW ===== */}
      <section className="py-20 md:py-28 relative">
        <div className="bg-dot-grid absolute inset-0" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-12">
            <span className="text-xs font-medium tracking-widest uppercase text-brand-400 mb-4 block">Build Your Own</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Visual <span className="text-gradient-brand">Agent Builder</span>
            </h2>
            <p className="text-slate-900/40 max-w-2xl mx-auto">
              Create custom agents in the Dashboard with our visual builder.
              Define personas, select tools, configure models, and deploy in seconds.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={150}>
            <div className="glass-card-glow p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Step 1 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-brand-400">1</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">Define Persona</span>
                  </div>
                  <div className="glass-card p-4 space-y-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-slate-900/30 block mb-1">Agent Name</label>
                      <div className="text-sm text-slate-900/70 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08]">Compliance Reviewer</div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-slate-900/30 block mb-1">System Prompt</label>
                      <div className="text-xs text-slate-900/40 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] leading-relaxed">
                        You are an expert compliance analyst. Review all content for regulatory violations...
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-purple-400">2</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">Select Tools</span>
                  </div>
                  <div className="glass-card p-4 space-y-2">
                    {["Compliance Scan", "Data Query", "File Analysis", "Knowledge Base"].map((tool, i) => (
                      <div key={tool} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs text-slate-900/60">{tool}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <div className="w-3.5 h-3.5 rounded border border-white/10" />
                      <span className="text-xs text-slate-900/25">Web Search</span>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-400">3</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">Deploy</span>
                  </div>
                  <div className="glass-card p-4 space-y-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-slate-900/30 block mb-1">Model</label>
                      <div className="text-sm text-slate-900/70 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08]">Claude 3.5 Sonnet</div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-slate-900/30 block mb-1">Status</label>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs text-emerald-400 font-medium">Ready to Deploy</span>
                      </div>
                    </div>
                    <button className="btn-primary w-full text-sm !py-2.5">
                      Deploy Agent <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== CTA ===== */}
      <section className="py-20 md:py-28 relative">
        <div className="bg-aurora absolute inset-0" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            <div className="glass-card-glow p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.05] via-transparent to-brand-500/[0.05]" />
              <div className="relative z-10">
                <Brain className="w-12 h-12 text-brand-400 mx-auto mb-6" />
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                  Deploy Your AI <span className="text-gradient-brand">Agent Army</span>
                </h2>
                <p className="text-slate-900/40 max-w-xl mx-auto mb-8">
                  Start with our free tier — 18 templates, 8 tools, and 8 free AI models.
                  Scale to unlimited custom agents on Pro.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link href="/auth" className="btn-primary text-base !py-3 !px-8">
                    Get Started Free <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/dashboard" className="btn-ghost text-base !py-3 !px-8">
                    Open Dashboard <ChevronRight className="w-4 h-4" />
                  </Link>
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
                <TextLogo />
              </Link>
              <p className="text-xs text-slate-900/30 leading-relaxed">
                Agentic AI compliance firewall with 18 agent templates, 8 tools, and 13 AI models.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900/50 uppercase tracking-wider mb-3">Product</h4>
              <div className="space-y-2">
                {[
                  { label: "Features", href: "/features" },
                  { label: "How It Works", href: "/how-it-works" },
                  { label: "AI Agents", href: "/agents" },
                  { label: "Pricing", href: "/pricing" },
                  { label: "Dashboard", href: "/dashboard" },
                ].map((item) => (
                  <Link key={item.label} href={item.href} className="block text-sm text-slate-900/30 hover:text-slate-900/60 transition-colors">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900/50 uppercase tracking-wider mb-3">Compliance</h4>
              <div className="space-y-2">
                {["SOC 2 Type II", "GDPR", "HIPAA", "EU AI Act"].map((item) => (
                  <span key={item} className="block text-sm text-slate-900/30">{item}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900/50 uppercase tracking-wider mb-3">Company</h4>
              <div className="space-y-2">
                {["Documentation", "API Reference", "GitHub", "Contact"].map((item) => (
                  <span key={item} className="block text-sm text-slate-900/30 hover:text-slate-900/60 cursor-pointer transition-colors">{item}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-900/20">&copy; 2026 Kaelus.ai — All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-900/20 hover:text-slate-900/40 cursor-pointer transition-colors">Privacy Policy</span>
              <span className="text-xs text-slate-900/20 hover:text-slate-900/40 cursor-pointer transition-colors">Terms of Service</span>
              <span className="text-xs text-slate-900/20 hover:text-slate-900/40 cursor-pointer transition-colors">Security</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
