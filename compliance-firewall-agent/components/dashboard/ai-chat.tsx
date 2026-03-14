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
  AlertTriangle,
  ChevronDown,
  Settings2,
  ShieldAlert,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  compliance?: {
    risk_level: string;
    entities_found: number;
    classifications: string[];
  };
  blocked?: boolean;
  blockReason?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  systemPrompt?: string;
  model: string;
}

// ---------------------------------------------------------------------------
// Model config
// ---------------------------------------------------------------------------

const MODELS = [
  { id: "gemini-flash", name: "Gemini Flash", tag: "Free · Fast", icon: "⚡" },
  { id: "llama-70b", name: "Llama 3.3 70B", tag: "Free · Smart", icon: "🦙" },
  { id: "deepseek-v3", name: "DeepSeek V3", tag: "Free · Coder", icon: "🔮" },
  { id: "qwen-72b", name: "Qwen 72B", tag: "Free · Powerful", icon: "🧠" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", tag: "$0.15/M", icon: "🟢" },
  { id: "claude-sonnet", name: "Claude Sonnet", tag: "$3/M", icon: "🟣" },
];

// ---------------------------------------------------------------------------
// Markdown rendering helpers
// ---------------------------------------------------------------------------

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-3 rounded-lg overflow-hidden border border-slate-200">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
        <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase">{language}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 hover:text-slate-600 transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[12px] leading-relaxed font-mono text-slate-700 bg-slate-50/50">
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
    return (
      <span key={i}>
        {part.split("\n").map((line, j) => {
          const boldParts = line.split(/(\*\*[^*]+\*\*)/g);
          return (
            <span key={`${i}-${j}`}>
              {boldParts.map((bp, k) => {
                if (bp.startsWith("**") && bp.endsWith("**")) {
                  return <strong key={k} className="text-slate-900 font-semibold">{bp.slice(2, -2)}</strong>;
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

// ---------------------------------------------------------------------------
// Suggestions
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  { icon: Code, text: "Write a Python FastAPI server with auth" },
  { icon: Shield, text: "Scan this text for PII: John Doe SSN 123-45-6789" },
  { icon: Terminal, text: "Explain the Kaelus gateway architecture" },
  { icon: Zap, text: "Write a React hook for real-time WebSocket data" },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AIChat({
  initialSystemPrompt,
  initialModel,
  agentName,
}: {
  initialSystemPrompt?: string;
  initialModel?: string;
  agentName?: string;
} = {}) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState(initialModel || "gemini-flash");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const currentSession = sessions.find((s) => s.id === activeSession);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages]);

  // Auto-create session for agent
  useEffect(() => {
    if (initialSystemPrompt && sessions.length === 0) {
      createSession(agentName || "Agent Chat");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-resize textarea
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 150) + "px";
  };

  const createSession = useCallback(
    (firstMessage?: string) => {
      const id = `session-${Date.now()}`;
      const newSession: ChatSession = {
        id,
        title: firstMessage
          ? firstMessage.length > 40
            ? firstMessage.slice(0, 40) + "..."
            : firstMessage
          : "New Chat",
        messages: [],
        createdAt: new Date(),
        systemPrompt: initialSystemPrompt,
        model: selectedModel,
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSession(id);
      return id;
    },
    [selectedModel, initialSystemPrompt]
  );

  // ----- Stream AI response -----
  const streamResponse = useCallback(
    async (sessionId: string, messages: Array<{ role: string; content: string }>) => {
      setIsStreaming(true);
      const assistantMsgId = `msg-${Date.now()}-ai`;

      // Add empty assistant message for streaming
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === sessionId) {
            return {
              ...s,
              messages: [
                ...s.messages,
                {
                  id: assistantMsgId,
                  role: "assistant" as const,
                  content: "",
                  timestamp: new Date(),
                },
              ],
            };
          }
          return s;
        })
      );

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const session = sessions.find((s) => s.id === sessionId) ||
          { systemPrompt: initialSystemPrompt, model: selectedModel };

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages,
            model: (session as ChatSession).model || selectedModel,
            system: (session as ChatSession).systemPrompt || initialSystemPrompt,
            temperature: 0.7,
          }),
          signal: controller.signal,
        });

        // Handle compliance block
        if (res.status === 451) {
          const data = await res.json();
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id === sessionId) {
                const msgs = [...s.messages];
                const idx = msgs.findIndex((m) => m.id === assistantMsgId);
                if (idx >= 0) {
                  msgs[idx] = {
                    ...msgs[idx],
                    content: data.message,
                    blocked: true,
                    compliance: data.scan,
                  };
                }
                return { ...s, messages: msgs };
              }
              return s;
            })
          );
          setIsStreaming(false);
          return;
        }

        // Handle API key missing
        if (res.status === 503) {
          const data = await res.json();
          if (data.error === "no_api_key") {
            setApiKeyMissing(true);
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id === sessionId) {
                  const msgs = [...s.messages];
                  const idx = msgs.findIndex((m) => m.id === assistantMsgId);
                  if (idx >= 0) {
                    msgs[idx] = {
                      ...msgs[idx],
                      content:
                        "⚙️ **Setup Required**\n\nTo use AI Chat, add your OpenRouter API key:\n\n1. Go to [openrouter.ai/keys](https://openrouter.ai/keys) and create a free key\n2. Add `OPENROUTER_API_KEY=your-key-here` to your `.env.local` file\n3. Restart the dev server\n\nFree models (Gemini Flash, Llama 70B, DeepSeek) require no payment.",
                    };
                  }
                  return { ...s, messages: msgs };
                }
                return s;
              })
            );
            setIsStreaming(false);
            return;
          }
        }

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }

        // ----- Read SSE stream -----
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            const data = trimmed.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);

              // Handle compliance metadata
              if (parsed.compliance) {
                setSessions((prev) =>
                  prev.map((s) => {
                    if (s.id === sessionId) {
                      const msgs = [...s.messages];
                      const idx = msgs.findIndex((m) => m.id === assistantMsgId);
                      if (idx >= 0) {
                        msgs[idx] = { ...msgs[idx], compliance: parsed.compliance };
                      }
                      return { ...s, messages: msgs };
                    }
                    return s;
                  })
                );
                continue;
              }

              // Handle content token
              if (parsed.content) {
                fullContent += parsed.content;
                const capturedContent = fullContent;

                setSessions((prev) =>
                  prev.map((s) => {
                    if (s.id === sessionId) {
                      const msgs = [...s.messages];
                      const idx = msgs.findIndex((m) => m.id === assistantMsgId);
                      if (idx >= 0) {
                        msgs[idx] = { ...msgs[idx], content: capturedContent };
                      }
                      return { ...s, messages: msgs };
                    }
                    return s;
                  })
                );
              }
            } catch {
              // Skip malformed
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("[chat] Stream error:", err);

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === sessionId) {
              const msgs = [...s.messages];
              const idx = msgs.findIndex((m) => m.id === assistantMsgId);
              if (idx >= 0) {
                msgs[idx] = {
                  ...msgs[idx],
                  content:
                    msgs[idx].content ||
                    "❌ Failed to get a response. Please check your API key and try again.",
                };
              }
              return { ...s, messages: msgs };
            }
            return s;
          })
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [sessions, selectedModel, initialSystemPrompt]
  );

  // ----- Send message -----
  const sendMessage = useCallback(
    async (text?: string) => {
      const message = text || input.trim();
      if (!message || isStreaming) return;
      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";

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

      // Update title if first message
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === sessionId) {
            return {
              ...s,
              title:
                s.messages.length === 0
                  ? message.length > 40
                    ? message.slice(0, 40) + "..."
                    : message
                  : s.title,
              messages: [...s.messages, userMsg],
            };
          }
          return s;
        })
      );

      // Build messages for API
      const updatedSession = sessions.find((s) => s.id === sessionId);
      const apiMessages = [
        ...(updatedSession?.messages || []).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: "user", content: message },
      ];

      await streamResponse(sessionId!, apiMessages);
    },
    [input, isStreaming, activeSession, createSession, sessions, streamResponse]
  );

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSession === id) setActiveSession(null);
  };

  const modelInfo = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  return (
    <div className="flex h-[calc(100vh-12rem)] max-h-[750px]">
      {/* Sessions sidebar */}
      <div className="hidden md:flex w-56 flex-col border-r border-slate-200 bg-surface-50/50">
        <div className="p-3">
          <button
            onClick={() => setActiveSession(null)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 text-xs text-slate-500 hover:text-slate-800 hover:border-white/15 transition-all"
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
                  ? "bg-blue-50 text-blue-500"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 hover:text-slate-600"
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
            <p className="text-[10px] text-slate-700 dark:text-slate-300 text-center py-8">No conversations yet</p>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeSession || !currentSession ? (
          /* Welcome screen */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5 border border-blue-200">
                <Sparkles className="w-7 h-7 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                {agentName ? agentName : "Kaelus AI"}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                {initialSystemPrompt
                  ? "Agent ready. Start a conversation below."
                  : "Powered by real AI models. Code, analyze, scan for compliance, and more."}
              </p>

              {/* Model badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] text-slate-600 dark:text-slate-400 mb-6">
                <span>{modelInfo.icon}</span>
                <span>{modelInfo.name}</span>
                <span className="text-slate-500">·</span>
                <span className="text-blue-600">{modelInfo.tag}</span>
              </div>

              {apiKeyMissing && (
                <div className="mb-6 p-3 rounded-lg bg-warning/5 border border-warning/20 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                    <span className="text-xs font-medium text-warning">Setup Required</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Add <code className="text-slate-600 bg-white/5 px-1 rounded">OPENROUTER_API_KEY</code> to{" "}
                    <code className="text-slate-600 bg-white/5 px-1 rounded">.env.local</code> and restart.
                    Get a free key at{" "}
                    <a href="https://openrouter.ai/keys" target="_blank" className="text-blue-600 underline">
                      openrouter.ai/keys
                    </a>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.text)}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 text-left text-xs text-slate-500 hover:text-slate-800 hover:border-white/15 hover:bg-white transition-all"
                  >
                    <s.icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
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
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-200">
                    <Bot className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                )}
                <div className="max-w-[80%] min-w-0">
                  {/* Compliance badge */}
                  {msg.compliance && (
                    <div
                      className={`flex items-center gap-1.5 text-[10px] mb-1 ${
                        msg.blocked ? "text-danger" : "text-warning"
                      }`}
                    >
                      <ShieldAlert className="w-3 h-3" />
                      {msg.blocked ? "Blocked" : "Scanned"} · {msg.compliance.risk_level} ·{" "}
                      {msg.compliance.entities_found} entities
                    </div>
                  )}
                  <div
                    className={
                      msg.role === "user"
                        ? "bg-brand-500/15 border border-blue-200 rounded-2xl rounded-br-md px-4 py-2.5 text-sm text-slate-900"
                        : `text-sm text-slate-700 leading-relaxed ${msg.blocked ? "text-danger/80" : ""}`
                    }
                  >
                    {msg.role === "assistant" ? renderContent(msg.content) : msg.content}
                    {msg.role === "assistant" && msg.content === "" && isStreaming && (
                      <span className="inline-block w-2 h-4 bg-brand-400 animate-pulse ml-0.5" />
                    )}
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                )}
              </div>
            ))}
            {isStreaming &&
              currentSession.messages.length > 0 &&
              currentSession.messages[currentSession.messages.length - 1].role === "user" && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0 border border-blue-200">
                    <Bot className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400/60 animate-pulse" />
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-brand-400/60 animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-brand-400/60 animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                </div>
              )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input area */}
        <div className="p-3 border-t border-slate-200">
          {/* Model selector row */}
          <div className="flex items-center gap-2 mb-2">
            <div className="relative">
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-500 hover:text-slate-700 hover:border-white/15 transition-all"
              >
                <Settings2 className="w-3 h-3" />
                <span>{modelInfo.icon} {modelInfo.name}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showModelPicker && (
                <div className="absolute bottom-full left-0 mb-1 w-56 bg-surface-50 border border-slate-200 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                  <div className="p-1.5">
                    {MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedModel(m.id);
                          setShowModelPicker(false);
                          // Update current session model if exists
                          if (activeSession) {
                            setSessions((prev) =>
                              prev.map((s) =>
                                s.id === activeSession ? { ...s, model: m.id } : s
                              )
                            );
                          }
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                          selectedModel === m.id
                            ? "bg-blue-50 text-blue-500"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                        }`}
                      >
                        <span className="text-sm">{m.icon}</span>
                        <div className="flex-1">
                          <span className="text-xs font-medium block">{m.name}</span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400">{m.tag}</span>
                        </div>
                        {selectedModel === m.id && <Check className="w-3 h-3 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isStreaming && (
              <button
                onClick={stopStreaming}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-danger/10 border border-danger/20 text-[11px] text-danger hover:bg-danger/20 transition-all"
              >
                Stop
              </button>
            )}
          </div>

          {/* Input */}
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={
                initialSystemPrompt
                  ? `Chat with ${agentName || "agent"}...`
                  : "Ask anything... Code, scan, analyze..."
              }
              disabled={isStreaming}
              rows={1}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none transition-all disabled:opacity-50 resize-none max-h-[150px]"
            />
            <button
              onClick={() => sendMessage()}
              disabled={isStreaming || !input.trim()}
              className="w-10 h-10 rounded-xl bg-brand-500 hover:bg-blue-600 flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-brand-500 flex-shrink-0"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-700 dark:text-slate-300 mt-1.5">
            Powered by OpenRouter · All messages scanned by Kaelus Compliance Engine
          </p>
        </div>
      </div>
    </div>
  );
}
