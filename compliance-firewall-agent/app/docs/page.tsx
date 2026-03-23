"use client";

import { Logo } from "@/components/Logo";
import { TextLogo } from "@/components/TextLogo";
import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Copy,
  Check,
  ChevronRight,
  ArrowLeft,
  Zap,
  Lock,
  Code,
  Globe,
  Terminal,
  FileText,
  AlertTriangle,
  Eye,
  BookOpen,
} from "lucide-react";

const GATEWAY_BASE = "https://kaelus.online/api/gateway/intercept";

const QUICKSTART_STEPS = [
  {
    step: "1",
    title: "Get your API key",
    body: "Sign up and copy your API key from the dashboard → Settings → API Keys.",
  },
  {
    step: "2",
    title: "Point your AI SDK at Kaelus",
    body: "Replace the baseURL in any OpenAI-compatible client. Zero behavior change for your team.",
  },
  {
    step: "3",
    title: "Every query is now CMMC-monitored",
    body: "CUI, CAGE codes, contract numbers, and clearance data are flagged before leaving your perimeter.",
  },
];

const DETECTED_PATTERNS = [
  { category: "CUI Markings", examples: ["CUI//SP-CTI", "CONTROLLED UNCLASSIFIED INFORMATION", "CUI BASIC"], risk: "CRITICAL" },
  { category: "CAGE Codes", examples: ["CAGE: 1ABC2", "cage code 5XY89"], risk: "CRITICAL" },
  { category: "DoD Contract Numbers", examples: ["W911NF-23-C-0001", "FA8650-22-D-1234", "N68335-21-C-0123"], risk: "CRITICAL" },
  { category: "Security Clearances", examples: ["TS/SCI", "secret clearance", "SF-86", "eQIP"], risk: "CRITICAL" },
  { category: "Classification Markings", examples: ["TOP SECRET", "NOFORN", "FOUO", "FOR OFFICIAL USE ONLY"], risk: "CRITICAL" },
  { category: "DD Forms", examples: ["DD-250", "DD-254", "DD Form 1155"], risk: "HIGH" },
  { category: "ITAR/EAR", examples: ["ITAR controlled", "export administration regulation", "USML"], risk: "CRITICAL" },
  { category: "Mil-Spec References", examples: ["MIL-STD-810", "MIL-DTL-12345"], risk: "HIGH" },
  { category: "SSNs / PII", examples: ["123-45-6789", "date of birth: 01/15/1985"], risk: "CRITICAL" },
  { category: "API Keys / Credentials", examples: ["api_key=sk-...", "-----BEGIN RSA PRIVATE KEY-----"], risk: "CRITICAL" },
];

const RISK_COLORS: Record<string, string> = {
  CRITICAL: "text-red-400",
  HIGH: "text-amber-400",
  MEDIUM: "text-yellow-400",
};

const API_SECTIONS = [
  {
    id: "quickstart",
    title: "Quickstart",
    description: "Set up the Kaelus CMMC gateway in under 60 seconds",
    method: "GUIDE",
    path: "",
    auth: "",
    headers: "",
    body: "",
    response200: "",
  },
  {
    id: "detected",
    title: "What Gets Detected",
    description: "CMMC-specific patterns and risk levels",
    method: "REF",
    path: "",
    auth: "",
    headers: "",
    body: "",
    response200: "",
  },
  {
    id: "gateway",
    title: "Gateway Intercept",
    description: "Intercept and scan LLM requests before they reach providers",
    method: "POST",
    path: "/api/gateway/intercept",
    auth: "x-api-key header",
    headers: `x-api-key: your-api-key
x-user-id: user@company.com
Content-Type: application/json`,
    body: `{
  "messages": [
    {
      "role": "user",
      "content": "Summarize our Q4 revenue of $45M..."
    }
  ],
  "destination": "openai"
}`,
    response200: `{
  "status": "allowed",
  "request_id": "req_abc123",
  "risk_level": "NONE",
  "confidence": 0.02,
  "processing_time_ms": 8
}`,
    response403: `{
  "status": "blocked",
  "request_id": "req_abc124",
  "risk_level": "CRITICAL",
  "classifications": ["FINANCIAL", "PII"],
  "entities_found": 3,
  "message": "Request blocked: sensitive data detected"
}`,
  },
  {
    id: "scan",
    title: "Scan Text",
    description: "Scan text for sensitive data without logging or quarantine",
    method: "POST",
    path: "/api/scan",
    auth: "None (public endpoint for testing)",
    headers: "Content-Type: application/json",
    body: `{
  "text": "My SSN is 123-45-6789 and my credit card is 4532-1234-5678-9012"
}`,
    response200: `{
  "risk_level": "CRITICAL",
  "confidence": 0.97,
  "classifications": ["PII"],
  "entities_found": 2,
  "entities": [
    {
      "type": "SSN",
      "value_redacted": "***-**-6789",
      "confidence": 0.98
    },
    {
      "type": "CREDIT_CARD",
      "value_redacted": "****-****-****-9012",
      "confidence": 0.96
    }
  ],
  "should_block": true,
  "should_quarantine": false,
  "processing_time_ms": 3
}`,
  },
  {
    id: "events",
    title: "Compliance Events",
    description: "Fetch compliance event history with filters",
    method: "GET",
    path: "/api/compliance/events",
    auth: "None (demo mode)",
    headers: "",
    body: "",
    queryParams: `?limit=50
&offset=0
&action=BLOCKED     # BLOCKED | QUARANTINED | ALLOWED
&risk_level=CRITICAL # CRITICAL | HIGH | MEDIUM | LOW | NONE`,
    response200: `{
  "events": [
    {
      "id": "evt_001",
      "created_at": "2026-02-25T10:30:00Z",
      "user_id": "eng-team@acme.co",
      "risk_level": "CRITICAL",
      "classifications": ["PII", "FINANCIAL"],
      "action_taken": "BLOCKED",
      "confidence_score": 0.97,
      "destination_provider": "OpenAI",
      "processing_time_ms": 12
    }
  ]
}`,
  },
  {
    id: "quarantine",
    title: "Quarantine Review",
    description: "Get items pending human review and submit decisions",
    method: "GET / POST",
    path: "/api/quarantine/review",
    auth: "x-api-key header",
    headers: "x-api-key: your-api-key",
    body: `// POST - Submit review decision
{
  "item_id": "q_001",
  "decision": "APPROVED",  // APPROVED | REJECTED
  "reviewer_id": "admin@company.com",
  "notes": "False positive - test data"
}`,
    response200: `// GET response
{
  "items": [
    {
      "id": "q_001",
      "created_at": "2026-02-25T10:30:00Z",
      "review_status": "PENDING",
      "priority": 5,
      "detected_entities": [
        {
          "type": "SSN",
          "value_redacted": "***-**-4832",
          "confidence": 0.98
        }
      ]
    }
  ]
}`,
  },
  {
    id: "reports",
    title: "Generate Reports",
    description: "Generate CFO-ready compliance audit reports",
    method: "GET",
    path: "/api/reports/generate",
    auth: "x-api-key header",
    headers: "x-api-key: your-api-key",
    body: "",
    queryParams: `?from=2026-02-01
&to=2026-02-25`,
    response200: `{
  "report": {
    "generated_at": "2026-02-25T12:00:00Z",
    "period": { "from": "2026-02-01", "to": "2026-02-25" },
    "summary": {
      "total_events": 1247,
      "blocked": 89,
      "quarantined": 156,
      "allowed": 1002,
      "violation_rate": "7.1%"
    },
    "by_risk_level": {
      "CRITICAL": 23,
      "HIGH": 66,
      "MEDIUM": 156,
      "LOW": 312,
      "NONE": 690
    },
    "eu_ai_act_compliance": "COMPLIANT",
    "merkle_root": "a1b2c3..."
  }
}`,
  },
  {
    id: "health",
    title: "Health Check",
    description: "Check system status and service health",
    method: "GET",
    path: "/api/health",
    auth: "None",
    headers: "",
    body: "",
    response200: `{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 86400,
  "services": {
    "database": "connected",
    "classifier": "operational",
    "quarantine": "operational",
    "audit_chain": "operational"
  }
}`,
  },
];

const SDK_EXAMPLES = {
  python: `import openai

# Drop-in replacement — just change base_url
client = openai.OpenAI(
    base_url="https://kaelus.online/api/gateway/intercept",
    api_key="your-openai-key",
    default_headers={"X-Kaelus-Org": "acme-defense"},
)

# Your existing code works unchanged
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user", "content": "Draft a proposal using contract W911NF-23-C-0001"}
    ],
)
# ↑ Kaelus intercepts this, detects the contract number,
#   blocks or quarantines before it reaches OpenAI`,
  javascript: `import OpenAI from "openai";

// Drop-in replacement — just change baseURL
const client = new OpenAI({
  baseURL: "https://kaelus.online/api/gateway/intercept",
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: { "X-Kaelus-Org": "acme-defense" },
});

// Your existing code works unchanged
const response = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "user", content: "Summarize our CAGE code 1ABC2 contract" }
  ],
});
// ↑ Kaelus intercepts this, detects the CAGE code,
//   blocks or quarantines before it reaches OpenAI`,
  curl: `# Using the gateway as an OpenAI-compatible proxy
curl -X POST https://kaelus.online/api/gateway/intercept \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "X-Kaelus-Org: acme-defense" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello"}]
  }'

# Direct intercept API (non-OpenAI-compatible)
curl -X POST https://kaelus.online/api/gateway/intercept \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: your-api-key" \\
  -H "x-user-id: developer@acme.co" \\
  -d '{
    "messages": [{"role": "user", "content": "..."}],
    "destination": "openai"
  }'

# Get compliance events
curl https://kaelus.online/api/compliance/events?limit=10

# Health check
curl https://kaelus.online/api/health`,
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-white/[0.06]">
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/[0.06]">
        <span className="text-[10px] font-mono text-slate-600 uppercase">{language}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 overflow-x-auto text-[12px] leading-relaxed font-mono text-slate-400 bg-white/[0.03]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-400",
  POST: "bg-brand-500/10 text-brand-400",
  "GET / POST": "bg-amber-500/10 text-amber-400",
  GUIDE: "bg-indigo-500/10 text-indigo-400",
  REF: "bg-slate-500/10 text-slate-400",
};

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("quickstart");
  const [sdkLang, setSdkLang] = useState<"python" | "javascript" | "curl">("javascript");

  const section = API_SECTIONS.find((s) => s.id === activeSection);

  return (
    <div className="min-h-screen bg-[#07070b]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 h-16 bg-[#07070b]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
              <Logo />
            </div>
            <TextLogo variant="dark" />
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-600" />
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-brand-400" />
            <span className="text-sm font-medium text-slate-300">API Documentation</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost text-xs px-3 py-1.5">
            <ArrowLeft className="w-3 h-3" /> Dashboard
          </Link>
          <Link href="/" className="btn-primary text-xs px-4 py-1.5">
            Get API Key
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 border-r border-white/[0.06] py-6 px-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto hidden lg:block">
          <p className="text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-3 px-2">Endpoints</p>
          <div className="space-y-0.5">
            {API_SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all ${
                  activeSection === s.id
                    ? "bg-brand-500/10 text-brand-300 font-medium"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
                }`}
              >
                <span className={`inline-block w-9 text-[9px] font-mono mr-1.5 ${activeSection === s.id ? "text-brand-400" : "text-slate-600"}`}>
                  {s.method.split(" ")[0]}
                </span>
                {s.title}
              </button>
            ))}
          </div>

          <p className="text-[10px] font-medium text-slate-600 uppercase tracking-wider mt-6 mb-3 px-2">SDK Examples</p>
          <div className="space-y-0.5">
            {(["javascript", "python", "curl"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setSdkLang(lang);
                  setActiveSection("sdk");
                }}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all ${
                  activeSection === "sdk" && sdkLang === lang
                    ? "bg-brand-500/10 text-brand-300 font-medium"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
                }`}
              >
                <Code className="w-3 h-3 inline mr-1.5" />
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 py-8 px-6 lg:px-10">
          {activeSection === "quickstart" ? (
            <div className="max-w-3xl space-y-8">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-4">
                  <Zap className="w-3 h-3" /> Quickstart
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  CMMC gateway in 60 seconds
                </h1>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Kaelus is an OpenAI-compatible proxy. Every AI query from your team passes through
                  it first. CUI, CAGE codes, contract numbers, and clearance data are detected and
                  blocked before they reach any AI provider.
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                {QUICKSTART_STEPS.map((s) => (
                  <div key={s.step} className="flex gap-4 p-5 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-sm shrink-0">
                      {s.step}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm mb-1">{s.title}</p>
                      <p className="text-slate-400 text-sm leading-relaxed">{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gateway URL */}
              <div>
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">Your Gateway URL</h3>
                <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-4 py-3">
                  <Globe className="w-4 h-4 text-slate-600 shrink-0" />
                  <code className="flex-1 text-emerald-400 text-sm font-mono">{GATEWAY_BASE}</code>
                  <CopyButton text={GATEWAY_BASE} />
                </div>
              </div>

              {/* Quick code example */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-widest">Python (OpenAI SDK)</h3>
                  <div className="flex gap-1">
                    {(["javascript", "python", "curl"] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSdkLang(lang)}
                        className={`text-[10px] px-2 py-1 rounded transition-all ${sdkLang === lang ? "bg-brand-500/15 text-brand-300" : "text-slate-500 hover:text-slate-400"}`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
                <CodeBlock code={SDK_EXAMPLES[sdkLang]} language={sdkLang} />
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-sm text-indigo-300">
                <span className="font-semibold">No infrastructure change required.</span> Your employees keep using ChatGPT, Copilot, or Claude — Kaelus sits in the middle transparently.
              </div>
            </div>
          ) : activeSection === "detected" ? (
            <div className="max-w-3xl space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">What Gets Detected</h1>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Kaelus runs 30+ pattern matchers against every message. CMMC-specific patterns target
                  artifacts unique to defense contracting — CAGE codes, CUI markings, contract numbers,
                  and clearance data that generic DLP tools miss entirely.
                </p>
              </div>

              <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03]">
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase px-5 py-3">Category</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-3">Example Triggers</th>
                      <th className="text-center text-xs font-semibold text-slate-500 uppercase px-3 py-3">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DETECTED_PATTERNS.map((row, i) => (
                      <tr key={row.category} className={`border-b border-white/[0.06] ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                        <td className="px-5 py-3 text-white font-medium whitespace-nowrap">{row.category}</td>
                        <td className="px-3 py-3 text-slate-400 text-xs font-mono">
                          {row.examples.join(", ")}
                        </td>
                        <td className={`px-3 py-3 text-center text-xs font-bold ${RISK_COLORS[row.risk] ?? "text-slate-400"}`}>
                          {row.risk}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300">
                <span className="font-semibold">Conservative by design.</span> False negatives are worse than false positives for a compliance tool. Quarantined items go to human review — false positives are released, never silently passed.
              </div>
            </div>
          ) : activeSection === "sdk" ? (
            <div className="max-w-3xl space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">SDK Examples</h1>
                <p className="text-sm text-slate-500">
                  Integrate Kaelus into your application with these code examples.
                </p>
              </div>

              <div className="flex gap-2">
                {(["javascript", "python", "curl"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSdkLang(lang)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                      sdkLang === lang
                        ? "bg-brand-500/15 text-brand-300 border border-brand-500/30"
                        : "text-slate-500 hover:text-slate-400 border border-transparent"
                    }`}
                  >
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </button>
                ))}
              </div>

              <CodeBlock code={SDK_EXAMPLES[sdkLang]} language={sdkLang} />
            </div>
          ) : section ? (
            <div className="max-w-3xl space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded ${METHOD_COLORS[section.method] || ""}`}>
                    {section.method}
                  </span>
                  <code className="text-sm font-mono text-slate-300">{section.path}</code>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">{section.title}</h1>
                <p className="text-sm text-slate-500">{section.description}</p>
              </div>

              {/* Auth */}
              <div>
                <h3 className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> Authentication
                </h3>
                <p className="text-sm text-slate-400">{section.auth}</p>
              </div>

              {/* Headers */}
              {section.headers && (
                <div>
                  <h3 className="text-xs font-medium text-slate-400 mb-2">Headers</h3>
                  <CodeBlock code={section.headers} language="headers" />
                </div>
              )}

              {/* Query Params */}
              {(() => {
                const qp = (section as { queryParams?: string }).queryParams;
                return qp ? (
                  <div>
                    <h3 className="text-xs font-medium text-slate-400 mb-2">Query Parameters</h3>
                    <CodeBlock code={qp} language="params" />
                  </div>
                ) : null;
              })()}

              {/* Request Body */}
              {section.body && (
                <div>
                  <h3 className="text-xs font-medium text-slate-400 mb-2">Request Body</h3>
                  <CodeBlock code={section.body} language="json" />
                </div>
              )}

              {/* Response */}
              {section.response200 && (
                <div>
                  <h3 className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-success" /> Success Response (200)
                  </h3>
                  <CodeBlock code={section.response200} language="json" />
                </div>
              )}

              {/* Error Response */}
              {(() => {
                const r403 = (section as { response403?: string }).response403;
                return r403 ? (
                  <div>
                    <h3 className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-danger" /> Blocked Response (403)
                    </h3>
                    <CodeBlock code={r403} language="json" />
                  </div>
                ) : null;
              })()}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
