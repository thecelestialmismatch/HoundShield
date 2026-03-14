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

const API_SECTIONS = [
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
  python: `import requests

API_URL = "https://your-kaelus.vercel.app"
API_KEY = "your-api-key"

# Scan text for sensitive data
response = requests.post(
    f"{API_URL}/api/scan",
    json={"text": "Check this for PII: john@acme.com"},
)
result = response.json()
print(f"Risk: {result['risk_level']}")
print(f"Entities: {result['entities_found']}")

# Intercept LLM request
response = requests.post(
    f"{API_URL}/api/gateway/intercept",
    headers={
        "x-api-key": API_KEY,
        "x-user-id": "developer@acme.co",
    },
    json={
        "messages": [{"role": "user", "content": "..."}],
        "destination": "openai",
    },
)`,
  javascript: `const KAELUS_URL = "https://your-kaelus.vercel.app";
const API_KEY = "your-api-key";

// Scan text for sensitive data
const scanResult = await fetch(\`\${KAELUS_URL}/api/scan\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: "Check this for PII: john@acme.com"
  }),
}).then(r => r.json());

console.log(\`Risk: \${scanResult.risk_level}\`);
console.log(\`Entities: \${scanResult.entities_found}\`);

// Intercept LLM request
const result = await fetch(\`\${KAELUS_URL}/api/gateway/intercept\`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
    "x-user-id": "developer@acme.co",
  },
  body: JSON.stringify({
    messages: [{ role: "user", content: "..." }],
    destination: "openai",
  }),
}).then(r => r.json());`,
  curl: `# Scan text for sensitive data
curl -X POST https://your-kaelus.vercel.app/api/scan \\
  -H "Content-Type: application/json" \\
  -d '{"text": "My SSN is 123-45-6789"}'

# Intercept LLM request
curl -X POST https://your-kaelus.vercel.app/api/gateway/intercept \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: your-api-key" \\
  -H "x-user-id: developer@acme.co" \\
  -d '{
    "messages": [{"role": "user", "content": "..."}],
    "destination": "openai"
  }'

# Get compliance events
curl https://your-kaelus.vercel.app/api/compliance/events?limit=10

# Health check
curl https://your-kaelus.vercel.app/api/health`,
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
      className="flex items-center gap-1 text-[10px] text-slate-900/30 hover:text-slate-900/60 transition-colors"
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
        <span className="text-[10px] font-mono text-slate-900/25 uppercase">{language}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 overflow-x-auto text-[12px] leading-relaxed font-mono text-slate-900/60 bg-surface-100/30">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-success-muted text-success",
  POST: "bg-brand-500/10 text-brand-400",
  "GET / POST": "bg-warning-muted text-warning",
};

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("gateway");
  const [sdkLang, setSdkLang] = useState<"python" | "javascript" | "curl">("javascript");

  const section = API_SECTIONS.find((s) => s.id === activeSection);

  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="sticky top-0 z-50 h-16 bg-surface/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
              <Logo />
            </div>
            <TextLogo />
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-900/20" />
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-brand-400" />
            <span className="text-sm font-medium text-slate-900/70">API Documentation</span>
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
          <p className="text-[10px] font-medium text-slate-900/25 uppercase tracking-wider mb-3 px-2">Endpoints</p>
          <div className="space-y-0.5">
            {API_SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all ${
                  activeSection === s.id
                    ? "bg-brand-500/10 text-brand-300 font-medium"
                    : "text-slate-900/40 hover:text-slate-900/70 hover:bg-white/[0.03]"
                }`}
              >
                <span className={`inline-block w-9 text-[9px] font-mono mr-1.5 ${activeSection === s.id ? "text-brand-400" : "text-slate-900/20"}`}>
                  {s.method.split(" ")[0]}
                </span>
                {s.title}
              </button>
            ))}
          </div>

          <p className="text-[10px] font-medium text-slate-900/25 uppercase tracking-wider mt-6 mb-3 px-2">SDK Examples</p>
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
                    : "text-slate-900/40 hover:text-slate-900/70 hover:bg-white/[0.03]"
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
          {activeSection === "sdk" ? (
            <div className="max-w-3xl space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">SDK Examples</h1>
                <p className="text-sm text-slate-900/40">
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
                        : "text-slate-900/40 hover:text-slate-900/60 border border-transparent"
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
                  <code className="text-sm font-mono text-slate-900/70">{section.path}</code>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{section.title}</h1>
                <p className="text-sm text-slate-900/40">{section.description}</p>
              </div>

              {/* Auth */}
              <div>
                <h3 className="text-xs font-medium text-slate-900/50 mb-2 flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> Authentication
                </h3>
                <p className="text-sm text-slate-900/60">{section.auth}</p>
              </div>

              {/* Headers */}
              {section.headers && (
                <div>
                  <h3 className="text-xs font-medium text-slate-900/50 mb-2">Headers</h3>
                  <CodeBlock code={section.headers} language="headers" />
                </div>
              )}

              {/* Query Params */}
              {(() => {
                const qp = (section as { queryParams?: string }).queryParams;
                return qp ? (
                  <div>
                    <h3 className="text-xs font-medium text-slate-900/50 mb-2">Query Parameters</h3>
                    <CodeBlock code={qp} language="params" />
                  </div>
                ) : null;
              })()}

              {/* Request Body */}
              {section.body && (
                <div>
                  <h3 className="text-xs font-medium text-slate-900/50 mb-2">Request Body</h3>
                  <CodeBlock code={section.body} language="json" />
                </div>
              )}

              {/* Response */}
              {section.response200 && (
                <div>
                  <h3 className="text-xs font-medium text-slate-900/50 mb-2 flex items-center gap-1.5">
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
                    <h3 className="text-xs font-medium text-slate-900/50 mb-2 flex items-center gap-1.5">
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
