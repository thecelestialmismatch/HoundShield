"use client";

import { Logo } from "@/components/Logo";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { LocalizedPrice } from "@/components/LocalizedPrice";
import { Navbar } from "@/components/Navbar";
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
  Menu,
  X,
  MessageCircle,
  Send,
  Bot,
  Sparkles,
  Globe,
  ShieldCheck,
  Brain,
  Cpu,
  Network,
  Layers,
  Users,
  Clock,
  CheckCircle2,
  Fingerprint,
  Radar,
  GitBranch,
  Search,
  BarChart3,
} from "lucide-react";

/* ===== ANIMATED COUNTER ===== */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          let start = 0;
          const duration = 2000;
          const startTime = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref} className="tabular-nums">{count.toLocaleString()}{suffix}</span>;
}

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

/* ===== ANIMATED SECTION ===== */
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

/* ===== LIVE SCAN DEMO ===== */
function LiveScanDemo() {
  const [lines, setLines] = useState<Array<{ text: string; type: string; time: string }>>([]);

  useEffect(() => {
    const samples = [
      { text: '[SCAN] "Summarize Q4 earnings..." → PASS (12ms)', type: "success" },
      { text: '[BLOCK] SSN detected: 123-45-**** → QUARANTINED', type: "danger" },
      { text: '[SCAN] "Best practices for GDPR..." → PASS (8ms)', type: "success" },
      { text: '[BLOCK] API key sk-proj-*** → ENCRYPTED', type: "danger" },
      { text: '[SCAN] "Compare React vs Vue..." → PASS (11ms)', type: "success" },
      { text: '[FLAG] Patient PHI detected → REVIEW QUEUE', type: "warn" },
      { text: '[SCAN] "Draft marketing email..." → PASS (9ms)', type: "success" },
      { text: '[BLOCK] Credit card 4111-****-1111 → BLOCKED', type: "danger" },
    ];
    let i = 0;
    const interval = setInterval(() => {
      const sample = samples[i % samples.length];
      const time = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLines((prev) => [{ ...sample, time }, ...prev].slice(0, 5));
      i++;
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="code-block">
      <div className="code-header">
        <div className="code-dot bg-[#ff5f57]" />
        <div className="code-dot bg-[#febc2e]" />
        <div className="code-dot bg-[#28c840]" />
        <span className="ml-2 text-xs text-white/30 font-mono">kaelus-firewall.log</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400/70 font-mono">LIVE</span>
        </div>
      </div>
      <div className="p-4 space-y-1 min-h-[140px]">
        {lines.map((line, i) => (
          <div
            key={`${line.time}-${i}`}
            className="flex items-start gap-2 text-xs font-mono animate-fade-in"
            style={{ opacity: Math.max(0.3, 1 - i * 0.15) }}
          >
            <span className="text-white/20 shrink-0">{line.time}</span>
            <span className={
              line.type === "success" ? "text-emerald-400" :
                line.type === "danger" ? "text-rose-400" :
                  "text-amber-400"
            }>
              {line.text}
            </span>
          </div>
        ))}
        {lines.length === 0 && (
          <span className="text-white/20 text-xs font-mono">Initializing scanner...</span>
        )}
      </div>
    </div>
  );
}

/* ===== CHAT WIDGET ===== */
function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm Kaelus AI. Ask me anything about compliance, security, or our platform." },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickReplies = [
    { text: "What can Kaelus detect?", response: "Kaelus detects 16 sensitive data patterns including SSNs, credit cards, API keys, medical records, M&A data, emails, and more — all in under 50ms." },
    { text: "How does the ReAct loop work?", response: "The ReAct loop follows 4 steps: Observe (gather context), Think (reason about approach), Act (execute tools), Iterate (evaluate and repeat). It uses 13 AI models and 8 built-in tools." },
    { text: "Is there a free tier?", response: "Yes! Our Starter plan is free forever — 1,000 scans/month, 4 detection categories, basic dashboard, and email alerts. No credit card required." },
  ];

  const handleSend = useCallback((text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setIsTyping(true);
    const match = quickReplies.find((q) => q.text === text);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: match?.response || "That's a great question! For detailed information, check out our Features page or reach out to our team." },
      ]);
      setIsTyping(false);
    }, 1200);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chat-widget-trigger"
        aria-label="Chat with Kaelus AI"
      >
        {isOpen ? <X className="w-5 h-5 text-white" /> : <MessageCircle className="w-5 h-5 text-white" />}
      </button>

      {isOpen && (
        <div className="chat-window">
          <div className="p-4 border-b border-white/[0.08] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Kaelus AI</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Online
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 chat-messages" style={{ maxHeight: "320px" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${msg.role === "user"
                  ? "bg-brand-500/20 text-white border border-brand-500/20"
                  : "bg-white/[0.05] text-white/70 border border-white/[0.06]"
                  }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/[0.05] border border-white/[0.06] px-4 py-3 rounded-xl">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {quickReplies.map((qr) => (
                <button
                  key={qr.text}
                  onClick={() => handleSend(qr.text)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-brand-500/20 text-brand-300 hover:bg-brand-500/10 transition-colors"
                >
                  {qr.text}
                </button>
              ))}
            </div>
          )}

          <div className="p-3 border-t border-white/[0.08]">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/30"
              />
              <button
                type="submit"
                className="p-2 rounded-lg bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* ===== MAIN PAGE ===== */
export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [blockedCount, setBlockedCount] = useState(2847561);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlockedCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);



  return (
    <div className="min-h-screen bg-surface text-white overflow-x-hidden">
      {/* Floating Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* ===== NAV ===== */}
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0" />
        <div className="bg-hero-glow absolute inset-0" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] mb-8">
              <div className="status-dot" />
              <span className="text-xs text-white/50">
                <span className="text-emerald-400 font-medium tabular-nums">{blockedCount.toLocaleString()}</span> threats blocked and counting
              </span>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-display-lg font-bold tracking-tight mb-6 leading-[1.05]">
              The AI Compliance<br />
              <span className="text-gradient-brand">Firewall</span> Your Team Needs
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <p className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto mb-10 leading-relaxed">
              Intercept, scan, and control every LLM request in under 50ms.
              Block sensitive data leaks before they reach AI providers.
              Powered by 13 AI models and agentic intelligence.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={300}>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
              <Link href="/auth" className="btn-primary px-8 py-3.5 text-base">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/how-it-works" className="btn-ghost px-8 py-3.5 text-base">
                See How It Works <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </AnimatedSection>

          {/* Live Scan Demo */}
          <AnimatedSection delay={400}>
            <div className="max-w-2xl mx-auto">
              <LiveScanDemo />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== LIVE STATS BAR ===== */}
      <section className="py-6 px-6 border-b border-white/[0.03] bg-surface-50/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: Zap, value: <><AnimatedCounter target={50} />ms</>, label: "Avg Scan Latency" },
            { icon: Activity, value: <AnimatedCounter target={99} suffix="%" />, label: "Uptime SLA" },
            { icon: Brain, value: <AnimatedCounter target={13} />, label: "AI Models" },
            { icon: Shield, value: <AnimatedCounter target={16} />, label: "Detection Patterns" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <Icon className="w-4 h-4 text-brand-400 mb-1" />
                <span className="text-2xl font-bold text-white">{stat.value}</span>
                <span className="text-xs text-white/30">{stat.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== HOW IT WORKS (Brief — links to /how-it-works) ===== */}
      <section className="relative py-24 px-6">
        <div className="bg-dot-grid absolute inset-0" />
        <div className="max-w-5xl mx-auto relative z-10">
          <AnimatedSection className="text-center mb-14">
            <span className="text-xs font-medium tracking-widest uppercase text-emerald-400 mb-4 block">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              5 Simple Steps, <span className="text-gradient-brand">Done in a Blink</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              We made it so easy even a kid could understand it. Picture Kaelus as a smart security guard checking backpacks before anyone leaves the school.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { num: "01", title: "You send a message", icon: Network, color: "text-brand-400" },
              { num: "02", title: "Guard checks it", icon: Search, color: "text-emerald-400" },
              { num: "03", title: "Spot bad words", icon: Brain, color: "text-purple-400" },
              { num: "04", title: "Stop or Go", icon: ShieldCheck, color: "text-amber-400" },
              { num: "05", title: "Write it down", icon: FileCheck, color: "text-rose-400" },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <AnimatedSection key={step.num} delay={i * 100}>
                  <div className="glass-card p-5 text-center h-full">
                    <span className="text-xs font-mono text-white/20 mb-2 block">{step.num}</span>
                    <Icon className={`w-7 h-7 ${step.color} mx-auto mb-2`} />
                    <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>

          <AnimatedSection delay={500} className="mt-10 text-center">
            <Link href="/how-it-works" className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors group">
              Deep dive into the pipeline
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== FEATURE HIGHLIGHTS (Brief — links to /features) ===== */}
      <section className="relative py-24 px-6">
        <div className="bg-aurora absolute inset-0" />
        <div className="max-w-6xl mx-auto relative z-10">
          <AnimatedSection className="text-center mb-14">
            <span className="text-xs font-medium tracking-widest uppercase text-brand-400 mb-4 block">Core Capabilities</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Enterprise-Grade <span className="text-gradient-brand">AI Security</span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              Everything you need to secure your AI pipeline — from real-time interception
              to cryptographic audit trails.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Zap, title: "Real-Time Interception", desc: "Sub-50ms scanning of every LLM request before it reaches the provider.", color: "amber" },
              { icon: Lock, title: "Encrypted Quarantine", desc: "AES-256 encrypted vault for flagged content with human-in-the-loop review.", color: "emerald" },
              { icon: Eye, title: "Immutable Audit Trail", desc: "SHA-256 hash chain for tamper-proof logging of every compliance event.", color: "blue" },
              { icon: Radar, title: "16 Detection Patterns", desc: "SSNs, credit cards, API keys, PHI, M&A data, and more — caught instantly.", color: "rose" },
              { icon: Brain, title: "Agentic AI Engine", desc: "ReAct reasoning loop with 8 tools and 13 AI models for intelligent decisions.", color: "purple" },
              { icon: FileCheck, title: "1-Click Reports", desc: "CFO-ready compliance reports for SOC 2, GDPR, HIPAA, and EU AI Act.", color: "brand" },
            ].map((feature, i) => {
              const Icon = feature.icon;
              const colors: Record<string, { iconBg: string; iconColor: string }> = {
                amber: { iconBg: "bg-amber-500/10 border-amber-500/20", iconColor: "text-amber-400" },
                emerald: { iconBg: "bg-emerald-500/10 border-emerald-500/20", iconColor: "text-emerald-400" },
                blue: { iconBg: "bg-blue-500/10 border-blue-500/20", iconColor: "text-blue-400" },
                rose: { iconBg: "bg-rose-500/10 border-rose-500/20", iconColor: "text-rose-400" },
                purple: { iconBg: "bg-purple-500/10 border-purple-500/20", iconColor: "text-purple-400" },
                brand: { iconBg: "bg-brand-500/10 border-brand-500/20", iconColor: "text-brand-400" },
              };
              const c = colors[feature.color];
              return (
                <AnimatedSection key={feature.title} delay={i * 80}>
                  <div className="glass-card p-6 h-full group hover:border-white/10 transition-all">
                    <div className={`w-11 h-11 rounded-xl ${c.iconBg} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${c.iconColor}`} />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">{feature.desc}</p>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>

          <AnimatedSection delay={500} className="mt-10 text-center">
            <Link href="/features" className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors group">
              Explore all features in detail
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== AI AGENTS TEASER ===== */}
      <section className="relative py-24 px-6">
        <div className="bg-aurora absolute inset-0" />
        <div className="max-w-5xl mx-auto relative z-10">
          <AnimatedSection className="text-center mb-14">
            <span className="text-xs font-medium tracking-widest uppercase text-purple-400 mb-4 block">Agentic AI</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              AI Agents That <span className="text-gradient-aurora">Think & Act</span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              Beyond pattern matching — autonomous AI agents with a ReAct reasoning loop,
              8 tools, and 13 models for intelligent compliance at scale.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "18 Templates", sub: "Pre-built agents", icon: Bot },
              { label: "8 Tools", sub: "Built-in toolbox", icon: Layers },
              { label: "13 Models", sub: "8 free + 5 premium", icon: Cpu },
              { label: "ReAct Loop", sub: "Think → Act → Iterate", icon: Brain },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <AnimatedSection key={item.label} delay={i * 100}>
                  <div className="glass-card p-5 text-center">
                    <Icon className="w-7 h-7 text-brand-400 mx-auto mb-3" />
                    <div className="text-sm font-semibold text-white mb-0.5">{item.label}</div>
                    <div className="text-xs text-white/30">{item.sub}</div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>

          <AnimatedSection delay={500} className="mt-10 text-center">
            <Link href="/agents" className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors group">
              Explore AI agents & templates
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== TRUST / SOCIAL PROOF ===== */}
      <section className="py-24 px-6 relative">
        <div className="bg-dot-grid absolute inset-0" />
        <div className="max-w-5xl mx-auto relative z-10">
          <AnimatedSection className="text-center mb-14">
            <span className="text-xs font-medium tracking-widest uppercase text-amber-400 mb-4 block">Trusted By</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Built for <span className="text-gradient-brand">Enterprise Compliance</span>
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {[
              { name: "SOC 2 Type II", desc: "Security, availability, and confidentiality controls verified by independent auditors.", icon: ShieldCheck, color: "brand" },
              { name: "GDPR", desc: "Full data protection compliance with right to erasure and consent management.", icon: Globe, color: "emerald" },
              { name: "HIPAA", desc: "Protected health information encrypted at rest and in transit. BAA available.", icon: Lock, color: "purple" },
              { name: "EU AI Act", desc: "High-risk AI system compliance with transparency and human oversight.", icon: Layers, color: "amber" },
            ].map((item, i) => {
              const Icon = item.icon;
              const colorClasses: Record<string, { iconBg: string; text: string }> = {
                brand: { iconBg: "bg-brand-500/10 border-brand-500/20", text: "text-brand-400" },
                emerald: { iconBg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400" },
                purple: { iconBg: "bg-purple-500/10 border-purple-500/20", text: "text-purple-400" },
                amber: { iconBg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400" },
              };
              const c = colorClasses[item.color];
              return (
                <AnimatedSection key={item.name} delay={i * 100}>
                  <div className="glass-card p-5 flex gap-4">
                    <div className={`w-11 h-11 rounded-xl ${c.iconBg} border flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${c.text}`} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white mb-1">{item.name}</h3>
                      <p className="text-sm text-white/40">{item.desc}</p>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { quote: "Kaelus caught an API key leak in our first scan. Saved us from a potential breach.", name: "Sarah Chen", role: "CTO, DataFlow AI", stars: 5 },
              { quote: "We deployed the SOC Analyst agent and it triaged 200+ alerts in the first week.", name: "Marcus Johnson", role: "CISO, TechVault", stars: 5 },
              { quote: "The compliance reports are CFO-ready out of the box. Saved us weeks of manual work.", name: "Elena Rodriguez", role: "VP Compliance, FinSecure", stars: 5 },
            ].map((t, i) => (
              <AnimatedSection key={t.name} delay={i * 100}>
                <div className="glass-card p-6 h-full">
                  <div className="flex items-center gap-0.5 mb-3">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                  <div>
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-xs text-white/30">{t.role}</p>
                  </div>
                </div>
                <div className="absolute -bottom-6 left-0 right-0 text-center">
                  <p className="text-[9px] text-white/30 truncate px-2">Weekly rate limits for top 5% of users. Pushing heavy users to API.</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== PRICING TEASER ===== */}
      <section className="relative py-24 px-6">
        <div className="bg-aurora absolute inset-0" />
        <div className="max-w-4xl mx-auto relative z-10">
          <AnimatedSection className="text-center mb-12">
            <span className="text-xs font-medium tracking-widest uppercase text-emerald-400 mb-4 block">Pricing</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Start Free, <span className="text-gradient-brand">Scale When Ready</span>
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: "Starter", price: "Free", desc: "1,000 scans/month", cta: "Start Free", variant: "ghost" },
              { name: "Pro", price: "$20/mo", desc: "Unlimited scans", cta: "Start Trial", variant: "primary", popular: true },
              { name: "Enterprise", price: "Custom", desc: "Self-hosted + SSO", cta: "Contact Sales", variant: "ghost" },
            ].map((plan, i) => (
              <AnimatedSection key={plan.name} delay={i * 100}>
                <div className={`glass-card p-6 text-center relative ${plan.popular ? "border-brand-500/30 scale-[1.02]" : ""
                  }`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-brand-500 rounded-full text-[10px] font-bold text-white">
                      MOST POPULAR
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
                  <div className="text-3xl font-bold text-white mb-1">{plan.price}</div>
                  <p className="text-sm text-white/40 mb-5">{plan.desc}</p>
                  <Link
                    href={plan.name === "Enterprise" ? "/pricing" : "/auth"}
                    className={plan.variant === "primary" ? "btn-primary w-full justify-center" : "btn-ghost w-full justify-center"}
                  >
                    {plan.cta}
                  </Link>
                </div>
                <div className="absolute -bottom-6 left-0 right-0 text-center">
                  <p className="text-[9px] text-white/30 truncate px-2">Weekly rate limits for top 5% of users. Pushing heavy users to API.</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection delay={400} className="mt-10 text-center">
            <Link href="/pricing" className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors group">
              View full pricing & feature comparison
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== FINAL CTA ===== */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0" />
        <div className="max-w-4xl mx-auto relative z-10">
          <AnimatedSection>
            <div className="glass-card-glow p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.05] via-transparent to-purple-500/[0.05]" />
              <div className="relative z-10">
                <Logo className="mx-auto mb-6 w-16 h-16 scale-125" />
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                  Ready to Secure Your{" "}
                  <span className="text-gradient-brand">AI Pipeline</span>?
                </h2>
                <p className="text-white/40 max-w-xl mx-auto mb-8">
                  Join teams that trust Kaelus to protect every LLM request.
                  Start free — no credit card required.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link href="/auth" className="btn-primary px-8 py-3.5 text-base">
                    Get Started Free <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/dashboard" className="btn-ghost px-8 py-3.5 text-base">
                    Open Dashboard <ChevronRight className="w-4 h-4" />
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
      <footer className="border-t border-white/[0.04] py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-3">
                <Logo className="w-7 h-7" />
                <span className="text-lg font-bold tracking-tight text-white">
                  Kaelus<span className="text-brand-400">.ai</span>
                </span>
              </Link>
              <p className="text-xs text-white/25 leading-relaxed">
                The AI compliance firewall. Real-time scanning, encrypted quarantine, and agentic intelligence.
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-4">Product</p>
              <div className="space-y-2.5">
                <Link href="/features" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Features</Link>
                <Link href="/how-it-works" className="block text-sm text-white/30 hover:text-white/60 transition-colors">How It Works</Link>
                <Link href="/agents" className="block text-sm text-white/30 hover:text-white/60 transition-colors">AI Agents</Link>
                <Link href="/pricing" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Pricing</Link>
                <Link href="/dashboard" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Dashboard</Link>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-4">Compliance</p>
              <div className="space-y-2.5">
                <span className="block text-sm text-white/30">SOC 2</span>
                <span className="block text-sm text-white/30">GDPR</span>
                <span className="block text-sm text-white/30">EU AI Act</span>
                <span className="block text-sm text-white/30">HIPAA</span>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-4">Company</p>
              <div className="space-y-2.5">
                <Link href="/docs" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Documentation</Link>
                <Link href="/auth" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Sign In</Link>
                <Link href="/auth" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Get Started</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/15">&copy; 2026 Kaelus.ai — All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs text-white/20">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Security</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}
