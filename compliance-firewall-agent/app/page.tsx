"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Shield,
  Zap,
  Lock,
  Eye,
  FileCheck,
  ArrowRight,
  ChevronRight,
  Activity,
  Check,
  Star,
  Building2,
  Menu,
  X,
  MessageCircle,
  Send,
  Bot,
  Sparkles,
  Globe,
  ShieldCheck,
  BarChart3,
  AlertTriangle,
  Terminal,
} from "lucide-react";

/* ===== DATA ===== */
const features = [
  {
    icon: Zap,
    title: "Real-Time Interception",
    description:
      "Every LLM request passes through Kaelus before reaching the provider. Sub-50ms scanning with 16 detection patterns across 4 risk categories.",
    stat: "<50ms",
    statLabel: "Latency",
  },
  {
    icon: Lock,
    title: "Encrypted Quarantine",
    description:
      "Flagged prompts are encrypted with AES-256 and queued for human review. No sensitive data is ever stored in plaintext.",
    stat: "AES-256",
    statLabel: "Encryption",
  },
  {
    icon: Eye,
    title: "Immutable Audit Trail",
    description:
      "Every event is logged with a cryptographic hash chain. Tamper with one record and the entire chain breaks.",
    stat: "SHA-256",
    statLabel: "Hash Chain",
  },
  {
    icon: FileCheck,
    title: "Compliance Reports",
    description:
      "Generate CFO-ready audit reports with one click. Integrity proofs, violation summaries, and EU AI Act compliance status included.",
    stat: "1-Click",
    statLabel: "Reports",
  },
];

const steps = [
  {
    num: "01",
    title: "Route Requests",
    description:
      "Point your AI API calls through the Kaelus gateway instead of directly to OpenAI, Anthropic, or Google.",
    gradient: "from-brand-500/20 to-brand-600/20",
  },
  {
    num: "02",
    title: "Scan & Classify",
    description:
      "16 pattern types detect SSNs, credit cards, API keys, M&A data, and more. Classification completes in under 50ms.",
    gradient: "from-purple-500/20 to-purple-600/20",
  },
  {
    num: "03",
    title: "Block or Release",
    description:
      "Dangerous requests are blocked instantly. Borderline cases go to an encrypted quarantine queue for human review.",
    gradient: "from-pink-500/20 to-pink-600/20",
  },
];

const metrics = [
  { value: "99.9%", label: "Detection Accuracy", icon: ShieldCheck },
  { value: "<50ms", label: "Scan Latency", icon: Zap },
  { value: "16", label: "Detection Patterns", icon: BarChart3 },
  { value: "AES-256", label: "Quarantine Encryption", icon: Lock },
];

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "For small teams exploring AI compliance.",
    features: [
      "Up to 1,000 scans/month",
      "4 detection categories",
      "Basic dashboard",
      "Email alerts",
      "Community support",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mo",
    description: "For growing teams with serious compliance needs.",
    features: [
      "Unlimited scans",
      "16 detection patterns",
      "Encrypted quarantine vault",
      "CFO-ready audit reports",
      "Slack & webhook integrations",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations requiring full control.",
    features: [
      "Everything in Pro",
      "Self-hosted deployment",
      "Custom detection rules",
      "SSO & RBAC",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const testimonials = [
  {
    quote:
      "Kaelus caught 47 instances of SSNs being sent to ChatGPT in our first week. We had no idea the exposure was that bad.",
    author: "Sarah Chen",
    role: "CISO",
    company: "FinTech Corp",
  },
  {
    quote:
      "The audit trail alone is worth it. When regulators came knocking, we had cryptographically verified logs ready in minutes.",
    author: "Marcus Rivera",
    role: "Head of Compliance",
    company: "MedData Systems",
  },
  {
    quote:
      "Deployed in 15 minutes, blocked a credential leak on day one. The ROI is infinite when you prevent a single breach.",
    author: "Priya Sharma",
    role: "VP Engineering",
    company: "CloudScale AI",
  },
];

const logos = ["FinTech Corp", "MedData", "CloudScale", "NexGen AI", "DataVault"];

/* ===== ANIMATED COUNTER ===== */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [visible, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ===== LIVE SCAN DEMO ===== */
const DEMO_LINES = [
  { text: '> Scanning prompt for sensitive data...', color: 'text-white/40', delay: 0 },
  { text: '  [PII] SSN detected: ***-**-4832', color: 'text-danger', delay: 800 },
  { text: '  [FINANCIAL] Credit card: ****-7291', color: 'text-danger', delay: 1400 },
  { text: '  [IP] API key: sk-****...****', color: 'text-warning', delay: 2000 },
  { text: '> Risk Level: CRITICAL (0.97)', color: 'text-danger font-semibold', delay: 2600 },
  { text: '> Action: BLOCKED in 12ms', color: 'text-success font-semibold', delay: 3200 },
  { text: '> Quarantine: AES-256 encrypted', color: 'text-brand-400', delay: 3800 },
  { text: '> Audit chain: SHA-256 anchored', color: 'text-brand-400', delay: 4200 },
];

function LiveScanDemo() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    setVisibleLines(0);
    const timers: NodeJS.Timeout[] = [];
    DEMO_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), line.delay));
    });
    const resetTimer = setTimeout(() => {
      setCycle((c) => c + 1);
    }, 6000);
    return () => { timers.forEach(clearTimeout); clearTimeout(resetTimer); };
  }, [cycle]);

  return (
    <div className="code-block">
      <div className="code-header">
        <div className="code-dot bg-danger" />
        <div className="code-dot bg-warning" />
        <div className="code-dot bg-success" />
        <span className="text-white/30 text-xs ml-2">kaelus-scanner.ts</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-success text-[10px]">LIVE</span>
        </div>
      </div>
      <div className="p-4 min-h-[220px]">
        {DEMO_LINES.slice(0, visibleLines).map((line, i) => (
          <div
            key={`${cycle}-${i}`}
            className={`${line.color} animate-fade-in`}
            style={{ animationDelay: '0ms' }}
          >
            {line.text}
          </div>
        ))}
        {visibleLines < DEMO_LINES.length && (
          <span className="inline-block w-2 h-4 bg-brand-400 animate-pulse" />
        )}
      </div>
    </div>
  );
}

/* ===== CHAT WIDGET ===== */
const CHAT_RESPONSES: Record<string, string> = {
  default: "I'm Kaelus AI Assistant. I can help you understand how our compliance firewall protects your data. Try asking about our features, pricing, or how to get started!",
  pricing: "We offer 3 plans:\n- Starter: Free (1,000 scans/mo)\n- Pro: $49/mo (unlimited scans)\n- Enterprise: Custom pricing\n\nAll plans include real-time scanning and audit trails. Start free today!",
  features: "Key features include:\n- Real-time LLM request interception\n- 16 detection patterns (PII, financial, strategic, IP)\n- AES-256 encrypted quarantine\n- SHA-256 audit trails\n- One-click compliance reports\n- <50ms scan latency",
  demo: "You can try our live dashboard right now! Click 'Dashboard' in the navigation to see real-time compliance monitoring with demo data. No sign-up required.",
  security: "Kaelus uses military-grade security:\n- AES-256-CBC encryption for quarantined data\n- SHA-256 hash chains for tamper-proof audit trails\n- Merkle root verification for report integrity\n- All data encrypted at rest and in transit",
  started: "Getting started is easy:\n1. Sign up (free, no credit card)\n2. Point your AI API calls through our gateway\n3. Start monitoring in real-time\n\nDeployment takes less than 15 minutes!",
};

function getChatResponse(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("price") || lower.includes("cost") || lower.includes("plan")) return CHAT_RESPONSES.pricing;
  if (lower.includes("feature") || lower.includes("what") || lower.includes("do")) return CHAT_RESPONSES.features;
  if (lower.includes("demo") || lower.includes("try") || lower.includes("test")) return CHAT_RESPONSES.demo;
  if (lower.includes("secur") || lower.includes("encrypt") || lower.includes("safe")) return CHAT_RESPONSES.security;
  if (lower.includes("start") || lower.includes("begin") || lower.includes("how") || lower.includes("setup")) return CHAT_RESPONSES.started;
  return CHAT_RESPONSES.default;
}

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "bot"; text: string }>>([
    { role: "bot", text: "Hi! I'm Kaelus AI. Ask me about our compliance firewall, pricing, or how to get started." },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "bot", text: getChatResponse(userMsg) }]);
    }, 500 + Math.random() * 500);
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="chat-widget-trigger"
        aria-label="Open chat"
      >
        {open ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </button>

      {open && (
        <div className="chat-window">
          {/* Header */}
          <div className="p-4 border-b border-white/[0.06] bg-gradient-to-r from-brand-600/20 to-purple-600/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center border border-brand-500/30">
                <Bot className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Kaelus AI</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  <span className="text-[10px] text-success">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 chat-messages" style={{ maxHeight: "340px" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-brand-500/20 text-white border border-brand-500/20"
                      : "bg-white/5 text-white/80 border border-white/[0.06]"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-white/[0.06]">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Kaelus..."
                className="flex-1 bg-white/5 border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:border-brand-500/50 focus:outline-none transition-all"
              />
              <button
                type="submit"
                className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors flex items-center justify-center flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

/* ===== MAIN PAGE ===== */
export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* ===== NAV ===== */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "backdrop-blur-xl bg-surface/90 border-b border-white/[0.06] shadow-lg shadow-black/20"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center border border-brand-500/20">
              <Shield className="w-[18px] h-[18px] text-brand-400" />
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">
              Kaelus
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-white/40 hover:text-white/70 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-white/40 hover:text-white/70 transition-colors">How It Works</a>
            <a href="#pricing" className="text-sm text-white/40 hover:text-white/70 transition-colors">Pricing</a>
            <Link href="/dashboard" className="text-sm text-white/40 hover:text-white/70 transition-colors">Dashboard</Link>
            <Link href="/auth" className="text-sm text-white/40 hover:text-white/70 transition-colors">Sign In</Link>
            <Link href="/auth" className="btn-primary text-sm">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-surface-50/95 backdrop-blur-xl border-b border-white/[0.06] px-6 py-4 space-y-3">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/60 hover:text-white py-2">Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/60 hover:text-white py-2">How It Works</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/60 hover:text-white py-2">Pricing</a>
            <Link href="/dashboard" className="block text-sm text-white/60 hover:text-white py-2">Dashboard</Link>
            <Link href="/auth" className="block text-sm text-white/60 hover:text-white py-2">Sign In</Link>
            <Link href="/auth" className="btn-primary w-full py-3 mt-2">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-dot-grid animate-grid-fade" />
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="absolute inset-0 bg-aurora" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm mb-8 animate-fade-in">
              <Activity className="w-3.5 h-3.5" />
              <span>Protecting enterprise AI pipelines in real time</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>

            <h1 className="text-5xl sm:text-display-lg mb-6 animate-fade-in-up tracking-tight font-bold leading-[1.05]">
              Stop Data Leaks
              <br />
              <span className="text-gradient-brand">Before They Happen</span>
            </h1>

            <p
              className="text-lg text-white/40 max-w-xl mb-10 animate-fade-in-up leading-relaxed"
              style={{ animationDelay: "150ms" }}
            >
              Kaelus intercepts sensitive data before it reaches ChatGPT, Claude,
              and other LLM providers. Real-time detection, encrypted quarantine,
              and immutable audit trails.
            </p>

            <div
              className="flex flex-col sm:flex-row items-start gap-4 animate-fade-in-up"
              style={{ animationDelay: "300ms" }}
            >
              <Link href="/auth" className="btn-primary px-8 py-3.5 text-base">
                Start Protecting Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/dashboard" className="btn-ghost px-8 py-3.5 text-base">
                <Terminal className="w-4 h-4" />
                Live Dashboard
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-10 flex items-center gap-6 text-xs text-white/30 animate-fade-in" style={{ animationDelay: "500ms" }}>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-success" />
                <span>SOC 2 Ready</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-brand-400" />
                <span>EU AI Act Compliant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-warning" />
                <span>GDPR Ready</span>
              </div>
            </div>
          </div>

          {/* Right - Live Demo */}
          <div className="hidden lg:block animate-fade-in-up" style={{ animationDelay: "400ms" }}>
            <LiveScanDemo />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface to-transparent" />
      </section>

      {/* ===== LOGOS / SOCIAL PROOF BAR ===== */}
      <section className="py-12 px-6 border-b border-white/[0.03]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs text-white/20 uppercase tracking-[0.2em] mb-8">
            Trusted by security-first teams
          </p>
          <div className="flex items-center justify-center gap-12 flex-wrap opacity-30">
            {logos.map((name) => (
              <div key={name} className="flex items-center gap-2 hover:opacity-100 transition-opacity duration-300">
                <Building2 className="w-4 h-4 text-white/50" />
                <span className="text-sm font-medium text-white/50">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs mb-6">
              <Sparkles className="w-3 h-3" />
              <span>Enterprise-Grade Protection</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
              Built for{" "}
              <span className="text-gradient-brand">Zero Trust</span>
            </h2>
            <p className="text-white/35 max-w-xl mx-auto">
              Everything you need to prevent sensitive data from leaking to AI
              providers. Deploys in minutes, protects forever.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="glass-card-glow p-6 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-brand-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center group-hover:bg-brand-500/20 transition-all duration-300 border border-brand-500/10 group-hover:border-brand-500/20">
                        <Icon className="w-6 h-6 text-brand-400" />
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">{feature.stat}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-wider">{feature.statLabel}</p>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-white/35 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="relative py-24 px-6 border-t border-white/[0.03]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
              Three Steps to{" "}
              <span className="text-gradient-brand">Total Protection</span>
            </h2>
            <p className="text-white/35">
              Deploy in minutes. Compliant from day one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
                )}
                <div className="text-center group">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} border border-white/[0.06] flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-brand-300 font-bold text-lg">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-white/35 leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LIVE DEMO CTA ===== */}
      <section className="py-16 px-6 border-t border-white/[0.03]">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card-glow p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-transparent to-purple-500/5" />
            <div className="scan-line" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">See It In Action</h3>
                <p className="text-white/40 text-sm">
                  Explore our live dashboard with realistic demo data. No sign-up required. See how Kaelus catches threats in real time.
                </p>
              </div>
              <Link href="/dashboard" className="btn-primary px-6 py-3 flex-shrink-0">
                <Activity className="w-4 h-4" />
                Open Live Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-24 px-6 border-t border-white/[0.03]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
              What Security Teams{" "}
              <span className="text-gradient-brand">Say</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.author} className="glass-card p-6 group hover:border-brand-500/20 transition-all duration-300">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-brand-400 fill-brand-400"
                    />
                  ))}
                </div>
                <p className="text-sm text-white/50 leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center text-sm font-semibold text-brand-300 border border-brand-500/10">
                    {t.author[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{t.author}</p>
                    <p className="text-xs text-white/30">
                      {t.role}, {t.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="relative py-24 px-6 border-t border-white/[0.03]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
              Simple{" "}
              <span className="text-gradient-brand">Pricing</span>
            </h2>
            <p className="text-white/35 max-w-lg mx-auto">
              Start free. Scale when you need to. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-[1px] transition-all duration-300 hover:scale-[1.02] ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-brand-500/50 to-purple-500/20"
                    : "bg-white/[0.06] hover:bg-white/[0.1]"
                }`}
              >
                <div className="rounded-2xl bg-surface-50 p-6 h-full flex flex-col relative overflow-hidden">
                  {plan.highlighted && (
                    <>
                      <div className="absolute top-0 right-0 w-40 h-40 bg-brand-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <span className="relative self-start badge bg-brand-500/15 text-brand-300 mb-4">
                        Most Popular
                      </span>
                    </>
                  )}
                  <h3 className="text-lg font-semibold text-white">
                    {plan.name}
                  </h3>
                  <div className="mt-3 mb-1">
                    <span className="text-4xl font-bold text-white">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-white/30 text-sm">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-sm text-white/35 mb-6">
                    {plan.description}
                  </p>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                        <span className="text-white/50">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/auth"
                    className={`text-center text-sm font-medium py-2.5 rounded-xl transition-all ${
                      plan.highlighted
                        ? "btn-primary justify-center"
                        : "btn-ghost justify-center"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRUST METRICS ===== */}
      <section className="py-24 px-6 border-t border-white/[0.03]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs text-white/25 uppercase tracking-[0.2em] mb-12">
            Built for security teams
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="group">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 text-brand-400" />
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold text-white">
                    {metric.value}
                  </p>
                  <p className="text-sm text-white/30 mt-2">{metric.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-aurora" />
        <div className="absolute inset-0 bg-dot-grid opacity-30" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/20 text-success text-xs mb-8">
            <ShieldCheck className="w-3 h-3" />
            <span>Deploy in under 15 minutes</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
            Ready to Secure Your{" "}
            <span className="text-gradient-brand">AI Pipeline</span>?
          </h2>
          <p className="text-white/35 mb-8">
            Join security teams who trust Kaelus to protect their enterprise data.
            Start free. Full compliance from day one.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth" className="btn-primary px-8 py-3.5 text-base">
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/dashboard" className="btn-ghost px-8 py-3.5 text-base">
              View Live Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/[0.06] py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-brand-500/15 flex items-center justify-center border border-brand-500/20">
                <Shield className="w-4 h-4 text-brand-400" />
              </div>
              <span className="font-semibold text-white">Kaelus</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-white/25">
              <a href="#features" className="hover:text-white/50 transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white/50 transition-colors">Pricing</a>
              <Link href="/dashboard" className="hover:text-white/50 transition-colors">Dashboard</Link>
              <Link href="/auth" className="hover:text-white/50 transition-colors">Sign In</Link>
            </div>
            <p className="text-sm text-white/15">
              &copy; 2026 Kaelus. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* ===== CHAT WIDGET ===== */}
      <ChatWidget />
    </div>
  );
}
