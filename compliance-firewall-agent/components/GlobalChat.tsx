"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send } from "lucide-react";
import { Logo } from "@/components/Logo";

const QUICK_ACTIONS = [
  "How does CMMC Level 2 work?",
  "What can you detect?",
  "How do I install Hound Shield?",
];

const HOUNDSHIELD_SYSTEM =
  "You are Brain AI, the intelligent compliance assistant embedded in Hound Shield. " +
  "You are a senior expert in CMMC Level 2, NIST 800-171 Rev 2, SPRS scoring, HIPAA PHI, SOC 2 Type II, CUI detection, and AI security. " +
  "Keep answers under 200 words. Use bullet points for lists. Be warm, precise, and focused on compliance value. " +
  "PRODUCT FACTS: " +
  "Hound Shield is a single proxy URL (gateway.houndshield.com/v1) that intercepts every AI prompt before it reaches ChatGPT/Copilot/Claude/Gemini — scanning for 16 risk categories in under 10ms. " +
  "SOC 2, HIPAA, and CMMC Level 2 enforced simultaneously. 800+ models via OpenRouter. " +
  "INSTALLATION: Change baseURL to gateway.houndshield.com/v1 — works with any OpenAI-compatible SDK. 15 minutes. No agents. No network changes. " +
  "PRICING: Starter FREE (1K scans/mo), Pro $199/mo (50K scans, SOC2+HIPAA), Growth $499/mo (CMMC+SIEM+PDF reports), Enterprise $999/mo (blockchain+SSO), Agency $2499/mo (multi-tenant). " +
  "CMMC FACTS: 110 NIST 800-171 controls, SPRS score -203 to +110, November 2026 enforcement, C3PAO costs $30K-$150K. " +
  "DETECTION: CUI (FOUO, CAGE codes, contract numbers), PHI (all 18 HIPAA identifiers), PII, API keys, source code, financial data, IP, ITAR/EAR. " +
  "INTEGRATIONS: Slack, Microsoft Teams, Splunk HEC, Azure Sentinel (Hound ShieldCompliance_CL), Base L2 blockchain audit trail, MCP server (early access). " +
  "STACK: Next.js 15, React 19, Supabase, Stripe, Tailwind. Self-host via Docker. " +
  "If asked about defense contractors: emphasize November 2026 CMMC enforcement and that 80000+ contractors need this. " +
  "If asked about AI agent frameworks (Goose, AgentScope, Claude Code, Cursor): explain Hound Shield works as a gateway for those too. " +
  "If asked about model costs/optimization: recommend model routing (Haiku for simple tasks, Sonnet for daily work, Opus for complex decisions). " +
  "Contact: info@houndshield.com. Docs: houndshield.com/docs.";

const GREETING =
  "Hi! I'm Brain AI — powered by Hound Shield. I can help with CMMC Level 2 compliance, CUI detection, SPRS scoring, and anything about AI security for defense contractors. Ask me anything!";

type Message = { role: "user" | "bot"; text: string };

function TypingDots() {
  return (
    <div className="flex gap-1 px-3.5 py-2.5 self-start bg-white/[0.04] rounded-2xl rounded-bl-sm">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
        />
      ))}
    </div>
  );
}

export function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [hasGreeted, setHasGreeted] = useState(false);
  const msgsRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleOpen = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening && !hasGreeted) {
      setHasGreeted(true);
      setMessages([{ role: "bot", text: GREETING }]);
    }
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = { role: "user", text };
    const allMessages = [...messages, userMsg];

    setMessages(allMessages);
    setShowQuickActions(false);
    setInput("");
    setIsTyping(true);

    // Build API history — skip the opening greeting bot message
    const history = allMessages
      .slice(messages.length === 1 && messages[0].role === "bot" ? 1 : 0)
      .map((m) => ({
        role: m.role === "bot" ? "assistant" : "user",
        content: m.text,
      }));

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          messages: history,
          system: HOUNDSHIELD_SYSTEM,
          model: "gemini-flash",
          temperature: 0.7,
          scanInput: false,
        }),
      });

      // Compliance block (451 = content blocked)
      if (res.status === 451) {
        const data = await res.json().catch(() => ({}));
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text:
              (data as { message?: string }).message ||
              "Your message was flagged by the compliance engine.",
          },
        ]);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message ?? `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let botText = "";
      let appended = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data) as Record<string, unknown>;
            // Skip compliance metadata chunks
            if (parsed.compliance) continue;
            const chunk = parsed.content;
            if (typeof chunk !== "string" || !chunk) continue;

            botText += chunk;

            if (!appended) {
              appended = true;
              setIsTyping(false);
              setMessages((prev) => [...prev, { role: "bot", text: botText }]);
            } else {
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: "bot", text: botText };
                return next;
              });
            }
          } catch {
            // Skip malformed SSE chunks
          }
        }
      }

      // Guard: stream ended but no content was ever received
      if (!appended) {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: "I didn't get a response. Try asking about CMMC Level 2, SPRS scoring, CUI detection, or how to install Hound Shield — I can answer those instantly!",
          },
        ]);
      }

      setIsTyping(false);
    } catch (err: unknown) {
      setIsTyping(false);
      if (err instanceof Error && err.name === "AbortError") return;

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Something went wrong connecting to Brain AI. Try asking about CMMC, SPRS, CUI, or installation — those work offline!",
        },
      ]);
    }
  }, [messages, isTyping]);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-7 right-7 z-[200] w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #6366f1, #818cf8)",
          boxShadow: "0 4px 24px rgba(99,102,241,0.45), 0 0 0 0 rgba(99,102,241,0.3)",
          animation: isOpen ? "none" : "chatPulse 3s ease infinite",
        }}
        aria-label="Chat with Brain AI"
        title="Brain AI — Compliance Assistant"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Logo className="w-7 h-7" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-7 z-[200] w-[340px] rounded-2xl overflow-hidden flex flex-col animate-chat-in"
          style={{
            background: "#0e0e18",
            border: "1px solid rgba(99,102,241,0.25)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06] bg-white/[0.03]">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))",
                  border: "1px solid rgba(99,102,241,0.3)",
                }}
              >
                <Logo className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Brain AI</div>
                <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online · Hound Shield
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/40 hover:text-white transition-colors p-1"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={msgsRef}
            className="flex flex-col gap-2.5 px-3.5 py-3.5 max-h-[300px] overflow-y-auto"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "self-end bg-indigo-500 text-white rounded-br-sm"
                    : "self-start bg-white/[0.05] text-white/85 border border-white/[0.07] rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isTyping && <TypingDots />}
          </div>

          {/* Quick Actions */}
          {showQuickActions && messages.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3 py-2 border-t border-white/[0.04]">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  onClick={() => sendMessage(action)}
                  className="text-[11px] px-2.5 py-1.5 rounded-full cursor-pointer transition-all text-indigo-300 hover:bg-indigo-500/25"
                  style={{
                    background: "rgba(99,102,241,0.1)",
                    border: "1px solid rgba(99,102,241,0.25)",
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex gap-2 px-3 py-2.5 border-t border-white/[0.05] bg-white/[0.02]"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Brain AI anything..."
              className="flex-1 bg-black/40 border border-white/[0.08] rounded-[10px] px-3 py-2.5 text-[13px] text-white placeholder:text-white/20 outline-none focus:border-indigo-500/40 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="px-3.5 py-2.5 rounded-[10px] bg-indigo-500 hover:bg-indigo-400 text-white transition-colors disabled:opacity-40 disabled:hover:bg-indigo-500 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      <style jsx global>{`
        @keyframes chatPulse {
          0%, 100% {
            box-shadow: 0 4px 24px rgba(99,102,241,0.45), 0 0 0 0 rgba(99,102,241,0.3);
          }
          50% {
            box-shadow: 0 4px 24px rgba(99,102,241,0.45), 0 0 0 12px rgba(99,102,241,0);
          }
        }
        @keyframes chatIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: none; }
        }
        .animate-chat-in { animation: chatIn 0.25s ease; }
      `}</style>
    </>
  );
}
