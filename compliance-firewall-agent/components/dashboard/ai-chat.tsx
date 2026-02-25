"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Copy,
  Check,
  Plus,
  Trash2,
  MessageSquare,
  Loader2,
  Code,
  Shield,
  Zap,
  Terminal,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
}

const DEMO_RESPONSES: Record<string, string> = {
  hello: "Hello! I'm Kaelus AI, your intelligent compliance and coding assistant. I can help you:\n\n• **Scan text** for sensitive data (PII, financial info, API keys)\n• **Generate code** in any language\n• **Analyze data** and find patterns\n• **Automate tasks** with AI agents\n\nWhat would you like to do?",
  scan: "I can scan any text for sensitive data. Here's what I detect:\n\n```\n🔍 Detection Categories:\n├── PII: SSN, Credit Cards, Email, Phone, DOB\n├── Financial: Revenue, Account Numbers, Routing\n├── Secrets: API Keys, AWS Credentials, Passwords\n└── Strategic: M&A Data, Roadmaps, Pricing\n```\n\nPaste any text and I'll analyze it for you, or try the **Live Scanner** in the Compliance tab!",
  code: "Sure! Here's a production-ready Python web scraper:\n\n```python\nimport asyncio\nimport aiohttp\nfrom bs4 import BeautifulSoup\nfrom dataclasses import dataclass\nfrom typing import List, Optional\n\n@dataclass\nclass ScrapedPage:\n    url: str\n    title: str\n    content: str\n    links: List[str]\n\nclass AsyncScraper:\n    def __init__(self, max_concurrent: int = 10):\n        self.semaphore = asyncio.Semaphore(max_concurrent)\n        self.session: Optional[aiohttp.ClientSession] = None\n\n    async def __aenter__(self):\n        self.session = aiohttp.ClientSession()\n        return self\n\n    async def __aexit__(self, *args):\n        if self.session:\n            await self.session.close()\n\n    async def scrape(self, url: str) -> ScrapedPage:\n        async with self.semaphore:\n            async with self.session.get(url) as resp:\n                html = await resp.text()\n                soup = BeautifulSoup(html, 'html.parser')\n                return ScrapedPage(\n                    url=url,\n                    title=soup.title.string if soup.title else '',\n                    content=soup.get_text()[:1000],\n                    links=[a['href'] for a in soup.find_all('a', href=True)]\n                )\n\nasync def main():\n    urls = ['https://example.com']\n    async with AsyncScraper() as scraper:\n        results = await asyncio.gather(\n            *[scraper.scrape(url) for url in urls]\n        )\n        for page in results:\n            print(f'{page.title}: {len(page.links)} links')\n\nif __name__ == '__main__':\n    asyncio.run(main())\n```\n\nThis scraper features async/await for high performance, rate limiting, and clean data extraction. Need any modifications?",
  api: "Here's the Kaelus API overview:\n\n```\n📡 Kaelus Gateway API\n\nBase URL: /api\n\n┌─ POST /api/gateway/intercept\n│  Intercept and scan LLM requests\n│  Headers: x-api-key, x-user-id\n│  Body: { messages, prompt, system }\n│\n├─ POST /api/scan\n│  Scan text for sensitive data\n│  Body: { text }\n│  Returns: risk_level, entities, confidence\n│\n├─ GET /api/compliance/events\n│  Fetch compliance event history\n│  Params: limit, offset, action, risk_level\n│\n├─ GET /api/quarantine/review\n│  Get items pending human review\n│\n├─ POST /api/quarantine/review\n│  Submit review decisions\n│  Body: { item_id, decision, reviewer_id }\n│\n├─ GET /api/reports/generate\n│  Generate compliance audit reports\n│  Params: from, to\n│\n└─ GET /api/health\n   System health check\n```\n\nAll endpoints support JSON. Check the **API Docs** page for detailed schemas!",
  agent: "Here's how Kaelus AI Agents work:\n\n```\n🤖 Agent Architecture\n\n┌─────────────────────────────────┐\n│  User Request                    │\n│  \"Analyze this data for PII\"     │\n└──────────┬──────────────────────┘\n           │\n     ┌─────▼─────┐\n     │  Kaelus   │\n     │  Gateway  │\n     └─────┬─────┘\n           │\n    ┌──────▼──────┐\n    │  Compliance │──→ Block / Quarantine\n    │  Scanner    │\n    └──────┬──────┘\n           │ Clean\n    ┌──────▼──────┐\n    │  AI Agent   │──→ GPT-5.2 / Claude\n    │  Executor   │\n    └──────┬──────┘\n           │\n    ┌──────▼──────┐\n    │  Response   │\n    │  + Audit    │\n    └─────────────┘\n```\n\nEvery request is scanned → classified → routed → audited. Zero data leaks.",
  default: "That's a great question! Let me help you with that.\n\nAs Kaelus AI, I specialize in:\n\n1. **Compliance Analysis** — I can scan any text for 16 types of sensitive data across PII, financial, secrets, and strategic categories\n2. **Code Generation** — I generate production-ready code with error handling\n3. **Security Consulting** — I can advise on data protection strategies\n4. **AI Agent Design** — I help you build and configure AI agents\n\nWould you like me to demonstrate any of these capabilities?",
};

function getAIResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) return DEMO_RESPONSES.hello;
  if (lower.includes("scan") || lower.includes("detect") || lower.includes("pii") || lower.includes("sensitive")) return DEMO_RESPONSES.scan;
  if (lower.includes("code") || lower.includes("python") || lower.includes("script") || lower.includes("scraper") || lower.includes("write")) return DEMO_RESPONSES.code;
  if (lower.includes("api") || lower.includes("endpoint") || lower.includes("gateway") || lower.includes("route")) return DEMO_RESPONSES.api;
  if (lower.includes("agent") || lower.includes("architecture") || lower.includes("how") || lower.includes("work")) return DEMO_RESPONSES.agent;
  return DEMO_RESPONSES.default;
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-white/[0.08]">
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/[0.06]">
        <span className="text-[10px] font-mono text-white/30 uppercase">{language}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[12px] leading-relaxed font-mono text-white/70 bg-surface-100/50">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderContent(content: string) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    const codeMatch = part.match(/```(\w+)?\n?([\s\S]*?)```/);
    if (codeMatch) {
      return <CodeBlock key={i} language={codeMatch[1] || "text"} code={codeMatch[2].trim()} />;
    }
    // Handle bold markdown
    return (
      <span key={i}>
        {part.split("\n").map((line, j) => {
          const boldParts = line.split(/(\*\*[^*]+\*\*)/g);
          return (
            <span key={`${i}-${j}`}>
              {boldParts.map((bp, k) => {
                if (bp.startsWith("**") && bp.endsWith("**")) {
                  return <strong key={k} className="text-white font-semibold">{bp.slice(2, -2)}</strong>;
                }
                return <span key={k}>{bp}</span>;
              })}
              {j < part.split("\n").length - 1 && <br />}
            </span>
          );
        })}
      </span>
    );
  });
}

const SUGGESTIONS = [
  { icon: Code, text: "Write a Python web scraper" },
  { icon: Shield, text: "How does compliance scanning work?" },
  { icon: Terminal, text: "Show me the API endpoints" },
  { icon: Zap, text: "Explain the agent architecture" },
];

export function AIChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentSession = sessions.find((s) => s.id === activeSession);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages]);

  const createSession = useCallback((firstMessage?: string) => {
    const id = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id,
      title: firstMessage ? (firstMessage.length > 40 ? firstMessage.slice(0, 40) + "..." : firstMessage) : "New Chat",
      messages: [],
      createdAt: new Date(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSession(id);
    return id;
  }, []);

  const sendMessage = useCallback(async (text?: string) => {
    const message = text || input.trim();
    if (!message || isTyping) return;
    setInput("");

    let sessionId = activeSession;
    if (!sessionId) {
      sessionId = createSession(message);
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            title: s.messages.length === 0 ? (message.length > 40 ? message.slice(0, 40) + "..." : message) : s.title,
            messages: [...s.messages, userMsg],
          };
        }
        return s;
      })
    );

    setIsTyping(true);

    // Simulate AI thinking time
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

    const response = getAIResponse(message);
    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now()}-ai`,
      role: "assistant",
      content: response,
      timestamp: new Date(),
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          return { ...s, messages: [...s.messages, assistantMsg] };
        }
        return s;
      })
    );
    setIsTyping(false);
  }, [input, isTyping, activeSession, createSession]);

  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSession === id) {
      setActiveSession(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] max-h-[700px]">
      {/* Sessions sidebar */}
      <div className="hidden md:flex w-56 flex-col border-r border-white/[0.06] bg-surface-50/50">
        <div className="p-3">
          <button
            onClick={() => {
              setActiveSession(null);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-white/[0.08] text-xs text-white/50 hover:text-white/80 hover:border-white/15 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSession(s.id)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] group transition-all ${
                activeSession === s.id
                  ? "bg-brand-500/10 text-brand-300"
                  : "text-white/40 hover:bg-white/[0.03] hover:text-white/60"
              }`}
            >
              <MessageSquare className="w-3 h-3 flex-shrink-0" />
              <span className="flex-1 truncate text-left">{s.title}</span>
              <Trash2
                className="w-3 h-3 opacity-0 group-hover:opacity-100 text-danger hover:text-danger-light flex-shrink-0 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(s.id);
                }}
              />
            </button>
          ))}
          {sessions.length === 0 && (
            <p className="text-[10px] text-white/20 text-center py-8">No conversations yet</p>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeSession || !currentSession ? (
          /* Welcome screen */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-5 border border-brand-500/20">
                <Sparkles className="w-7 h-7 text-brand-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Kaelus AI Assistant</h2>
              <p className="text-sm text-white/40 mb-6">
                Powered by advanced AI. I can code, analyze, scan for compliance issues, and more.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.text)}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-white/[0.06] text-left text-xs text-white/50 hover:text-white/80 hover:border-white/15 hover:bg-white/[0.02] transition-all"
                  >
                    <s.icon className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Messages */
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentSession.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0 mt-0.5 border border-brand-500/20">
                    <Bot className="w-3.5 h-3.5 text-brand-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] ${
                    msg.role === "user"
                      ? "bg-brand-500/15 border border-brand-500/20 rounded-2xl rounded-br-md px-4 py-2.5 text-sm text-white/90"
                      : "text-sm text-white/70 leading-relaxed"
                  }`}
                >
                  {msg.role === "assistant" ? renderContent(msg.content) : msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-white/50" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0 border border-brand-500/20">
                  <Bot className="w-3.5 h-3.5 text-brand-400" />
                </div>
                <div className="flex items-center gap-1.5 px-4 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-400/60 animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-400/60 animate-pulse" style={{ animationDelay: "0.2s" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-400/60 animate-pulse" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input area */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask anything... Code, scan, analyze..."
              disabled={isTyping}
              className="flex-1 bg-surface-100 border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:border-brand-500/50 focus:outline-none transition-all disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={isTyping || !input.trim()}
              className="w-10 h-10 rounded-xl bg-brand-500 hover:bg-brand-600 flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-brand-500"
            >
              {isTyping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-center text-[10px] text-white/15 mt-1.5">Demo mode — Responses are pre-configured examples</p>
        </div>
      </div>
    </div>
  );
}
