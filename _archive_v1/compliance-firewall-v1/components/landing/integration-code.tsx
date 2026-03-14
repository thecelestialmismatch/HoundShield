"use client";

import { useState } from "react";

export function IntegrationCode() {
    const [activeTab, setActiveTab] = useState<"python" | "typescript" | "curl">("typescript");

    const code: Record<string, string> = {
        python: `import requests

# 1. Change the Base URL to Kaelus
# 2. Add your corporate token
# No other code changes required!

response = requests.post(
    "https://kaelus.ai/api/v1/scan",
    headers={
        "Authorization": "Bearer YOUR_KAELUS_TOKEN",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "Here are the secret keys to our AWS server...",
        "model": "gpt-4o",
        "quarantine": True # Auto-encrypts flagged content
    }
)

# Output: { "status": "block", "reason": "Credentials detected" }`,
        typescript: `// 1. Point your OpenAI/Anthropic client to Kaelus
const response = await fetch("https://kaelus.ai/api/v1/scan", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_KAELUS_TOKEN",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    prompt: "Here is the unreleased financial data...",
    model: "claude-3-5-sonnet",
    quarantine: true,
  }),
});

// Output: { status: "block", reason: "Financial M&A details" }`,
        curl: `curl -X POST https://kaelus.ai/api/v1/scan \\
  -H "Authorization: Bearer YOUR_KAELUS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "What disease does patient John Doe have?",
    "model": "gpt-4o-mini",
    "quarantine": true
  }'

# Output: { "status": "block", "reason": "HIPAA violation (PHI)" }`,
    };

    return (
        <div className="code-block overflow-hidden shadow-2xl relative">
            {/* Background glow behind code block */}
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-500/20 to-purple-500/20 blur-xl z-0" />

            <div className="code-header justify-between relative z-10 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5 ml-1">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#ff5f57]/50" />
                        <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#febc2e]/50" />
                        <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#28c840]/50" />
                    </div>
                    <span className="text-xs text-white/40 font-mono font-medium ml-2">AppIntegration.{activeTab === "curl" ? "sh" : activeTab === "python" ? "py" : "ts"}</span>
                </div>
                <div className="flex items-center gap-1.5 mr-1">
                    {(["typescript", "python", "curl"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1.5 text-xs font-mono font-bold rounded-md transition-all ${activeTab === tab
                                    ? "bg-brand-500/20 text-brand-300 border border-brand-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                                    : "text-white/30 hover:text-white/60 hover:bg-white/[0.05]"
                                }`}
                        >
                            {tab.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>
            <pre className="p-6 text-[14px] leading-relaxed overflow-x-auto relative z-10 bg-[#0c0c10]">
                <code className="text-emerald-400 font-mono">{code[activeTab]}</code>
            </pre>
        </div>
    );
}
