"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Shield,
  FileText,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group rounded-xl bg-[#0d0d14] border border-white/[0.08] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          {language}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-brand-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="px-4 py-4 text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

const STEPS = [
  {
    number: "01",
    title: "Run the installer",
    time: "2 min",
    icon: Terminal,
    description:
      "One curl command pulls the Docker image, starts the proxy, and confirms it's running. Requires Docker Desktop.",
    code: `curl -sSL https://houndshield.com/install | bash`,
    note: "Or non-interactive: HOUNDSHIELD_LICENSE_KEY=<key> UPSTREAM_API_KEY=<key> bash install.sh -y",
  },
  {
    number: "02",
    title: "Change one environment variable",
    time: "30 sec",
    icon: Zap,
    description:
      "Replace your AI provider's base URL with the proxy. Every SDK that speaks OpenAI-compatible APIs works — ChatGPT, Copilot, Claude, Gemini.",
    code: `# .env or your shell profile
OPENAI_BASE_URL=http://localhost:8080/v1
# ANTHROPIC_BASE_URL=http://localhost:8080/v1  # Claude
# GOOGLE_BASE_URL=http://localhost:8080/v1      # Gemini`,
    language: "bash",
  },
  {
    number: "03",
    title: "Test: send a CUI prompt",
    time: "30 sec",
    icon: AlertTriangle,
    description:
      "Verify the proxy is intercepting. This prompt contains a DoD contract number — it should be BLOCKED.",
    code: `curl -X POST http://localhost:8080/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role":"user","content":"W911NF-23-C-0001 status?"}]
  }'`,
    note: 'Expected response: { "error": { "code": "content_policy_violation", "message": "BLOCKED — CUI detected" } }',
  },
  {
    number: "04",
    title: "Export your C3PAO audit report",
    time: "30 sec",
    icon: FileText,
    description:
      "Download a PDF that documents every AI prompt your team sent, which CMMC controls were triggered, and your SPRS impact. Hand this to your C3PAO.",
    code: `# From the dashboard — or via API:
curl "https://houndshield.com/api/reports/generate?format=pdf&from=2026-04-01T00:00:00Z&to=2026-04-30T23:59:59Z" \\
  -H "Authorization: Bearer $HOUNDSHIELD_API_KEY" \\
  --output cmmc-audit-report.pdf`,
  },
];

const PROVIDERS: { name: string; envVar: string; note?: string }[] = [
  { name: "OpenAI / ChatGPT", envVar: "OPENAI_BASE_URL=http://localhost:8080/v1" },
  { name: "Anthropic / Claude", envVar: "ANTHROPIC_BASE_URL=http://localhost:8080/v1" },
  { name: "Google / Gemini", envVar: "GOOGLE_BASE_URL=http://localhost:8080/v1" },
  { name: "LangChain", envVar: 'openai = OpenAI(base_url="http://localhost:8080/v1")', note: "Python" },
  { name: "LlamaIndex", envVar: "llm = OpenAI(api_base='http://localhost:8080/v1')", note: "Python" },
  { name: "OpenRouter", envVar: "OPENROUTER_BASE_URL=http://localhost:8080/v1", note: "800+ models" },
];

export default function QuickstartPage() {
  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <Navbar variant="dark" />

      <div className="max-w-3xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-brand-400/30 bg-brand-400/5 mb-6">
            <Shield className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-xs font-mono font-semibold text-brand-400 uppercase tracking-wider">
              Quickstart — 15 minutes to C3PAO-ready
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Deploy Hound Shield in 15 minutes.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
            By the end of this guide your team&apos;s AI usage will be intercepted,
            classified, and generating an audit trail your C3PAO assessor can verify.
          </p>
          <div className="flex items-center gap-6 mt-6 text-sm">
            <span className="flex items-center gap-1.5 text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-brand-400" />
              No firewall rules
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-brand-400" />
              No network changes
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-brand-400" />
              Works with any AI SDK
            </span>
          </div>
        </div>

        {/* Prerequisites */}
        <div className="mb-12 p-5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-400" />
            Prerequisites
          </h2>
          <ul className="space-y-1.5 text-sm text-slate-400">
            <li>
              <span className="text-white font-medium">Docker Desktop</span> installed and running —{" "}
              <a
                href="https://docs.docker.com/get-docker/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:text-brand-300 underline underline-offset-2"
              >
                download here
              </a>
            </li>
            <li>
              <span className="text-white font-medium">Hound Shield license key</span> —{" "}
              <Link href="/signup" className="text-brand-400 hover:text-brand-300 underline underline-offset-2">
                get one free
              </Link>
            </li>
            <li>
              <span className="text-white font-medium">Your AI provider API key</span> (OpenAI, Anthropic, Google, or OpenRouter)
            </li>
          </ul>
        </div>

        {/* Steps */}
        <div className="space-y-12 mb-16">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold text-brand-400 bg-brand-400/10 px-2 py-0.5 rounded">
                    {step.number}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-brand-400/10 border border-brand-400/20 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-brand-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">{step.title}</h2>
                  <span className="ml-auto text-xs font-mono text-slate-500 bg-white/[0.05] px-2 py-0.5 rounded">
                    ~{step.time}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mb-4 leading-relaxed">{step.description}</p>
                <CodeBlock code={step.code} language={(step as { language?: string }).language ?? "bash"} />
                {step.note && (
                  <p className="mt-3 text-xs text-slate-500 font-mono leading-relaxed">
                    {step.note}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Provider compatibility */}
        <div className="mb-16">
          <h2 className="text-lg font-semibold text-white mb-4">Works with every AI provider</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PROVIDERS.map((p) => (
              <div
                key={p.name}
                className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{p.name}</span>
                  {p.note && (
                    <span className="text-[10px] font-mono text-slate-500 bg-white/[0.06] px-1.5 py-0.5 rounded">
                      {p.note}
                    </span>
                  )}
                </div>
                <code className="text-xs font-mono text-brand-400 break-all">{p.envVar}</code>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-brand-400/20 bg-brand-400/[0.04] p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">You&apos;re protected.</h2>
          <p className="text-slate-400 mb-6 max-w-sm mx-auto text-sm">
            Your C3PAO assessment PDF is one click away in the dashboard.
            Every AI prompt your team sends is now scanned, logged, and audit-ready.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/command-center"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Open Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/command-center/shield/reports"
              className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 font-medium text-sm transition-colors"
            >
              Download C3PAO PDF <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
