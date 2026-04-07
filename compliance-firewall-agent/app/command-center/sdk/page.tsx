"use client";

/**
 * SDK Integration Guide
 *
 * 1-line integration examples for Python and Node.js SDKs.
 * Shows analytics panel with blocked vs allowed request counts.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Code2, Copy, Check, Terminal, Package, BarChart3, Shield, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ---------------------------------------------------------------------------
// Code snippet data
// ---------------------------------------------------------------------------

const PYTHON_INSTALL = `pip install kaelus`;

const PYTHON_SNIPPET = `import kaelus

# 1-line integration: wrap any OpenAI call
client = kaelus.Client(
    gateway_url="https://kaelus.online/api/gateway/intercept",
    api_key="your-kaelus-api-key",
    user_id="user-123"
)

# Drop-in replacement — all prompts are scanned before reaching OpenAI
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Summarize this document"}]
)

# Blocked requests raise kaelus.ComplianceError
# result.compliance_meta contains risk_level, entities, latency
print(response.choices[0].message.content)`;

const NODE_INSTALL = `npm install @kaelus/sdk`;

const NODE_SNIPPET = `import { KaelusClient } from "@kaelus/sdk";

// 1-line integration
const kaelus = new KaelusClient({
  gatewayUrl: "https://kaelus.online/api/gateway/intercept",
  apiKey: process.env.KAELUS_API_KEY,
  userId: "user-123",
});

// Wraps any fetch-compatible LLM call
const response = await kaelus.chat.completions.create({
  model: "claude-3-5-sonnet-20241022",
  provider: "anthropic",
  messages: [{ role: "user", content: "Draft a contract" }],
});

// Throws KaelusComplianceError if blocked
console.log(response.content[0].text);
console.log(response.compliance_meta); // { risk_level, scan_ms, action }`;

const CURL_SNIPPET = `# Direct API usage — no SDK required
curl -X POST https://kaelus.online/api/gateway/intercept \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: your-kaelus-api-key" \\
  -H "x-user-id: user-123" \\
  -d '{
    "messages": [{"role": "user", "content": "Your prompt here"}],
    "_destination_url": "https://api.openai.com/v1/chat/completions"
  }'

# Response
{
  "allowed": true,
  "action": "ALLOWED",
  "risk_level": "NONE",
  "processing_time_ms": 12,
  "request_id": "req_abc123"
}`;

// ---------------------------------------------------------------------------
// Demo analytics data
// ---------------------------------------------------------------------------

function generateAnalyticsData() {
  const hours = Array.from({ length: 24 }, (_, i) => {
    const h = i;
    const label = h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
    const total = Math.floor(Math.random() * 400) + 50;
    const blocked = Math.floor(total * (0.05 + Math.random() * 0.15));
    return { time: label, allowed: total - blocked, blocked };
  });
  return hours;
}

const ANALYTICS = generateAnalyticsData();
const totalAllowed = ANALYTICS.reduce((s, d) => s + d.allowed, 0);
const totalBlocked = ANALYTICS.reduce((s, d) => s + d.blocked, 0);
const blockRate = Math.round((totalBlocked / (totalAllowed + totalBlocked)) * 100);

// ---------------------------------------------------------------------------
// Code block component
// ---------------------------------------------------------------------------

function CodeBlock({ code, language, label }: { code: string; language: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl bg-[#07070b] border border-white/[0.08] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-white/30" />
          <span className="text-xs text-white/40 font-mono">{label}</span>
        </div>
        <button onClick={copy} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/[0.06]">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-white/70 overflow-x-auto leading-relaxed whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SDKPage() {
  const [tab, setTab] = useState<"python" | "node" | "curl">("python");

  const tabs = [
    { id: "python" as const, label: "Python", icon: Code2 },
    { id: "node" as const, label: "Node.js", icon: Package },
    { id: "curl" as const, label: "cURL", icon: Terminal },
  ];

  return (
    <div className="min-h-screen bg-[#07070b] p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">SDK Integration</h1>
            <p className="text-sm text-white/40">Add Kaelus compliance scanning in one line</p>
          </div>
        </div>
        <div className="mt-3 p-3.5 rounded-xl bg-brand-500/10 border border-brand-400/20">
          <p className="text-sm text-brand-200">
            <span className="font-semibold">Gateway URL:</span>{" "}
            <code className="font-mono text-brand-300">https://kaelus.online/api/gateway/intercept</code>
          </p>
        </div>
      </div>

      {/* Analytics panel */}
      <div className="mb-8 p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-brand-400" />
          <span className="text-sm font-medium text-white">Request Analytics (Last 24h)</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            {
              label: "Allowed",
              value: totalAllowed.toLocaleString(),
              icon: Shield,
              color: "text-emerald-400",
              trend: "+12%",
              up: true,
            },
            {
              label: "Blocked",
              value: totalBlocked.toLocaleString(),
              icon: Zap,
              color: "text-red-400",
              trend: "-4%",
              up: false,
            },
            {
              label: "Block Rate",
              value: `${blockRate}%`,
              icon: BarChart3,
              color: "text-amber-400",
              trend: "stable",
              up: null,
            },
          ].map(({ label, value, icon: Icon, color, trend, up }) => (
            <div key={label} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <div className={`flex items-center gap-1 text-xs ${up === true ? "text-emerald-400" : up === false ? "text-red-400" : "text-white/30"}`}>
                  {up === true ? <TrendingUp className="w-3 h-3" /> : up === false ? <TrendingDown className="w-3 h-3" /> : null}
                  {trend}
                </div>
              </div>
              <p className="text-xl font-semibold text-white">{value}</p>
              <p className="text-xs text-white/40 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ANALYTICS} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="allowedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="blockedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: 12 }}
                labelStyle={{ color: "rgba(255,255,255,0.6)" }}
              />
              <Area type="monotone" dataKey="allowed" stroke="#10b981" strokeWidth={1.5} fill="url(#allowedGrad)" name="Allowed" />
              <Area type="monotone" dataKey="blocked" stroke="#ef4444" strokeWidth={1.5} fill="url(#blockedGrad)" name="Blocked" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Integration snippets */}
      <div>
        <div className="flex items-center gap-1 mb-4 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === id ? "bg-brand-500 text-white" : "text-white/50 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {tab === "python" && (
            <>
              <CodeBlock code={PYTHON_INSTALL} language="bash" label="Install" />
              <CodeBlock code={PYTHON_SNIPPET} language="python" label="integration.py" />
            </>
          )}
          {tab === "node" && (
            <>
              <CodeBlock code={NODE_INSTALL} language="bash" label="Install" />
              <CodeBlock code={NODE_SNIPPET} language="typescript" label="integration.ts" />
            </>
          )}
          {tab === "curl" && (
            <CodeBlock code={CURL_SNIPPET} language="bash" label="Direct API (no SDK)" />
          )}
        </div>

        <div className="mt-5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <p className="text-xs text-white/40 leading-relaxed">
            All requests are scanned in real-time before reaching the LLM provider.
            Blocked requests return HTTP 403 with a violation summary.
            Latency overhead is typically 8-50ms depending on content length.
            Set <code className="text-brand-300 bg-brand-500/10 px-1 rounded">KAELUS_API_KEY</code> in your environment.
          </p>
        </div>
      </div>
    </div>
  );
}
