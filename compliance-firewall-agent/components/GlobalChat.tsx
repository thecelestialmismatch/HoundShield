"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send } from "lucide-react";
import { Logo } from "@/components/Logo";

const QUICK_ACTIONS = [
  "What can you detect?",
  "How does CMMC Level 2 work?",
  "How do I install this?",
];

type Message = { role: "user" | "bot"; text: string; streaming?: boolean };

/* ── Typing indicator ── */
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

function getSessionId(): string {
  if (typeof window === "undefined") return `brain-${Date.now()}`;
  const key = "brain-ai-session-id";
  let id = window.sessionStorage.getItem(key);
  if (!id) {
    id = `brain-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    window.sessionStorage.setItem(key, id);
  }
  return id;
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

  // Auto-scroll to bottom
  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Show greeting when first opened
  const handleOpen = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening && !hasGreeted) {
      setHasGreeted(true);
      setMessages([
        {
          role: "bot",
          text: "Hi! I'm Brain AI — powered by Kaelus.online. I can help with CMMC Level 2 compliance, CUI detection, SPRS scoring, and anything about AI security for defense contractors. Ask me anything!",
        },
      ]);
    }
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setShowQuickActions(false);
    setInput("");
    setIsTyping(true);

    // Add empty bot message to stream into
    setMessages((prev) => [...prev, { role: "bot", text: "", streaming: true }]);

    try {
      const res = await fetch("/api/brain-ai/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId(), message: text }),
        signal: abort.signal,
      });

      if (!res.ok || !res.body) throw new Error("Brain AI unavailable");

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const evt = JSON.parse(raw);
            if (evt.type === "token" && evt.content) {
              accumulated += evt.content;
              setMessages((prev) =>
                prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, text: accumulated } : m
                )
              );
            } else if (evt.type === "done" && evt.turnResult?.output) {
              accumulated = evt.turnResult.output;
              setMessages((prev) =>
                prev.map((m, i) =>
                  i === prev.length - 1
                    ? { ...m, text: accumulated, streaming: false }
                    : m
                )
              );
            } else if (evt.type === "error") {
              throw new Error(evt.message ?? "Brain AI error");
            }
          } catch {
            // skip malformed SSE line
          }
        }
      }

      // Finalize the streaming message
      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1
            ? { ...m, text: accumulated || "I couldn't generate a response. Please try again.", streaming: false }
            : m
        )
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") return;

      // Fallback: static reply if Brain AI is unavailable (no API key configured)
      const fallback =
        text.toLowerCase().includes("cmmc")
          ? "CMMC Level 2 requires implementing 110 security practices across 14 domains. The November 2026 enforcement deadline is approaching fast. Sign up free at kaelus.online to start your assessment!"
          : text.toLowerCase().includes("detect") || text.toLowerCase().includes("scan")
          ? "Brain AI detects 16+ sensitive patterns: SSNs, credit cards, API keys, medical records, CUI markings, CAGE codes, contract numbers, clearance levels, and more — all in under 10ms."
          : "Brain AI is your CMMC compliance co-pilot. Sign up free at kaelus.online to unlock the full intelligence layer including compliance assessments, PDF reports, and real-time threat scanning.";

      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, text: fallback, streaming: false } : m
        )
      );
    } finally {
      setIsTyping(false);
      abortRef.current = null;
    }
  }, [isTyping]);

  return (
    <>
      {/* ── Trigger Button ── */}
      <button
        onClick={handleOpen}
        className="fixed bottom-7 right-7 z-[200] w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #6366f1, #818cf8)",
          boxShadow:
            "0 4px 24px rgba(99,102,241,0.45), 0 0 0 0 rgba(99,102,241,0.3)",
          animation: isOpen ? "none" : "chatPulse 3s ease infinite",
        }}
        title="Chat with Brain AI"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Logo className="w-7 h-7" />
        )}
      </button>

      {/* ── Chat Window ── */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-7 z-[200] w-[340px] rounded-2xl overflow-hidden flex flex-col animate-chat-in"
          style={{
            background: "#0e0e18",
            border: "1px solid rgba(99,102,241,0.25)",
            boxShadow:
              "0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06] bg-white/[0.03]">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center text-lg"
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
                  {isTyping ? "Thinking..." : "Online · Kaelus.online"}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/40 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={msgsRef}
            className="flex flex-col gap-2.5 px-3.5 py-3.5 max-h-[280px] overflow-y-auto"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                  msg.role === "user"
                    ? "self-end bg-indigo-500 text-white border border-indigo-500/40 rounded-br-sm"
                    : "self-start bg-white/[0.05] text-white/80 border border-white/[0.07] rounded-bl-sm"
                }`}
              >
                {msg.text || (msg.streaming ? "▋" : "")}
              </div>
            ))}
            {isTyping && messages[messages.length - 1]?.role !== "bot" && <TypingDots />}
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

      {/* Keyframe animations */}
      <style jsx global>{`
        @keyframes chatPulse {
          0%,
          100% {
            box-shadow: 0 4px 24px rgba(99, 102, 241, 0.45),
              0 0 0 0 rgba(99, 102, 241, 0.3);
          }
          50% {
            box-shadow: 0 4px 24px rgba(99, 102, 241, 0.45),
              0 0 0 12px rgba(99, 102, 241, 0);
          }
        }
        @keyframes chatIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .animate-chat-in {
          animation: chatIn 0.25s ease;
        }
      `}</style>
    </>
  );
}
