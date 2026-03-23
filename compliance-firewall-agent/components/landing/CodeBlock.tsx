"use client";

import { useState, useRef } from "react";
import { useInView } from "framer-motion";

type TabKey = "ts" | "py" | "curl";

const CODE_TABS: { key: TabKey; label: string; filename: string }[] = [
  { key: "ts", label: "TYPESCRIPT", filename: "AppIntegration.ts" },
  { key: "py", label: "PYTHON", filename: "integration.py" },
  { key: "curl", label: "CURL", filename: "request.sh" },
];

const CODE_CONTENT: Record<TabKey, string> = {
  ts: `import OpenAI from 'openai';

// Before: Direct to OpenAI
// const client = new OpenAI();

// After: Route through Kaelus (1 line change)
const client = new OpenAI({
  baseURL: 'https://gateway.kaelus.online/v1',
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'X-Kaelus-Key': process.env.KAELUS_API_KEY,
    'X-Kaelus-Policy': 'strict',   // block | warn | redact
  },
});

// All your existing code works unchanged
const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: userPrompt }],
});

// ✓ Kaelus scanned for CUI, PII, credentials
// ✓ Audit log entry written with SHA-256 hash
// ✓ P99 latency added: <50ms`,

  py: `import openai

# Before: Direct to OpenAI
# client = openai.OpenAI()

# After: Route through Kaelus (1 line change)
client = openai.OpenAI(
    base_url="https://gateway.kaelus.online/v1",
    api_key=os.environ["OPENAI_API_KEY"],
    default_headers={
        "X-Kaelus-Key": os.environ["KAELUS_API_KEY"],
        "X-Kaelus-Policy": "strict",
    },
)

# All your existing code works unchanged
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": user_prompt}]
)

# ✓ Kaelus scanned for CUI, PII, credentials
# ✓ Audit log written with SHA-256 hash`,

  curl: `# Before: Direct to OpenAI
# POST https://api.openai.com/v1/chat/completions

# After: Route through Kaelus (1 line change)
curl https://gateway.kaelus.online/v1/chat/completions \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "X-Kaelus-Key: $KAELUS_API_KEY" \\
  -H "X-Kaelus-Policy: strict" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "Summarize this document..."}
    ]
  }'

# ✓ Scanned for 16 data categories
# ✓ SHA-256 audit log entry written
# ✓ Latency overhead: <50ms P99`,
};

const TOKEN_COLORS: Record<string, string> = {
  keyword: "text-indigo-400",
  string: "text-emerald-400",
  comment: "text-slate-500",
  value: "text-amber-300",
};

function ColorizedCode({ code }: { code: string }) {
  const lines = code.split("\n");
  return (
    <div>
      {lines.map((line, i) => {
        let colored = line;
        // Comments
        if (line.trim().startsWith("#") || line.trim().startsWith("//")) {
          return (
            <div key={i} className="text-slate-500">
              {line}
            </div>
          );
        }
        return (
          <div key={i} className="text-emerald-400">
            {line}
          </div>
        );
      })}
    </div>
  );
}

export function CodeBlock() {
  const [activeTab, setActiveTab] = useState<TabKey>("ts");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 md:py-32 bg-[#0a0a10]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400 mb-4">
            Zero-Config Integration
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-extrabold tracking-tight leading-[1.1] text-white mb-4">
            One Line of Code.{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
              Infinite Protection.
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-[520px] mx-auto">
            Works with any OpenAI, Anthropic, Google, or Meta SDK. No new dependencies, no infrastructure changes.
          </p>
        </div>

        <div
          className="relative rounded-[18px] overflow-hidden border border-white/[0.08] shadow-[0_0_60px_rgba(99,102,241,0.12),0_32px_60px_rgba(0,0,0,0.5)]"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.12) -1px, rgba(168,85,247,0.06) -1px, transparent 40%)" }}
        >
          <div className="absolute inset-0 rounded-[18px] border border-transparent"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.1), transparent 60%) border-box" }} />

          {/* Tabs bar */}
          <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/[0.05]">
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-xs text-white/35 font-mono ml-2">
                {CODE_TABS.find((t) => t.key === activeTab)?.filename}
              </span>
            </div>
            <div className="hidden sm:flex gap-1.5">
              {CODE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all ${
                    activeTab === tab.key
                      ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                      : "text-white/30 border-transparent hover:text-white/60 hover:bg-white/[0.05]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Code body */}
          <pre className="relative z-10 p-7 text-[13.5px] leading-[1.75] font-mono text-emerald-400 bg-[#080810] overflow-x-auto whitespace-pre min-h-[220px]">
            <ColorizedCode code={CODE_CONTENT[activeTab]} />
          </pre>
        </div>
      </div>
    </section>
  );
}
