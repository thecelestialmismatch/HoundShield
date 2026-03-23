"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { Logo } from "@/components/Logo";

/* ── Smart responses for quick actions and free-text ── */
const CHAT_RESPONSES: Record<string, string> = {
  "What can you detect?":
    "I detect 16 sensitive patterns like SSNs, credit cards, API keys, medical records, CUI, and M&A data — all in under 50 milliseconds! Every request your team sends to any AI provider gets scanned.",
  "How does the ReAct loop work?":
    "I don't just use regex. I use an autonomous ReAct loop: Observe the context, Think about the rules, Act using 8 specialized tools, and Iterate until I'm certain. I use up to 13 different AI models to make sure I get it right — 0.01% false positive rate.",
  "How do I install this?":
    "It's literally 1 line of code! Just change your OpenAI or Anthropic API base URL to `gateway.kaelus.online/v1`. We proxy everything transparently. No new dependencies, no infrastructure changes. Under 15 minutes to deploy.",
};

const QUICK_ACTIONS = [
  "What can you detect?",
  "How does the ReAct loop work?",
  "How do I install this?",
];

const DEFAULT_REPLY =
  "That's a great question! Our full platform has a massive knowledge base and autonomous reasoning to answer anything about AI compliance, CMMC, and data security. Sign up free to explore!";

type Message = { role: "user" | "bot"; text: string };

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

export function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [hasGreeted, setHasGreeted] = useState(false);
  const msgsRef = useRef<HTMLDivElement>(null);

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
          text: "Hi! I'm Kaelus AI — a compliance firewall that stops your team from accidentally leaking secrets to AI tools. Ask me anything!",
        },
      ]);
    }
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { role: "user", text }]);
    setShowQuickActions(false);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      const reply = CHAT_RESPONSES[text] || DEFAULT_REPLY;
      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
    }, 1200);
  };

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
        title="Chat with Kaelus AI"
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
                <div className="text-sm font-bold text-white">Kaelus AI</div>
                <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online and Scanning
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
              placeholder="Ask about compliance..."
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
