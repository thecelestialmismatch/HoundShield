"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Bot, Send } from "lucide-react";

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Hi! I'm Kaelus AI. I'm a compliance firewall that stops your team from accidentally leaking secrets to AI tools. Ask me anything!" },
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const quickReplies = [
        { text: "What can you detect?", response: "I detect 16 sensitive patterns like SSNs, credit cards, API keys, medical records, and M&A data — all in under 50 milliseconds!" },
        { text: "How does the ReAct loop work?", response: "I don't just use regex. I use an autonomous ReAct loop: I Observe the context, Think about the rules, Act using 8 tools, and Iterate. I use up to 13 different AI models to make sure I get it right." },
        { text: "How do I install this?", response: "It's literally 1 line of code! Just change your OpenAI or Anthropic API base URL to ours. We proxy everything transparently." },
    ];

    const handleSend = useCallback((text: string) => {
        if (!text.trim()) return;
        setMessages((prev) => [...prev, { role: "user", content: text }]);
        setInput("");
        setIsTyping(true);
        const match = quickReplies.find((q) => q.text === text);
        setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: match?.response || "That's a great question! I'm a demo bot right now, but our full platform has a massive knowledge base and autonomous reasoning to answer anything." },
            ]);
            setIsTyping(false);
        }, 1200);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="chat-widget-trigger shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:scale-110 transition-transform"
                aria-label="Chat with Kaelus AI"
            >
                {isOpen ? <X className="w-5 h-5 text-white" /> : <MessageCircle className="w-5 h-5 text-white" />}
            </button>

            {isOpen && (
                <div className="chat-window border border-brand-500/20 shadow-2xl shadow-brand-500/10">
                    <div className="p-4 border-b border-white/[0.08] flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 border border-brand-500/30 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-brand-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">Kaelus AI</p>
                            <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Online and Scanning
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 chat-messages" style={{ maxHeight: "320px" }}>
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${msg.role === "user"
                                    ? "bg-brand-500 border border-brand-400 text-white"
                                    : "bg-surface-50 border border-white/[0.06] text-white/80"
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-surface-50 border border-white/[0.06] px-4 py-3 rounded-xl">
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {messages.length <= 2 && (
                        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                            {quickReplies.map((qr) => (
                                <button
                                    key={qr.text}
                                    onClick={() => handleSend(qr.text)}
                                    className="text-[11px] px-2.5 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 hover:bg-brand-500/30 transition-colors"
                                >
                                    {qr.text}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="p-3 border-t border-white/[0.08] bg-surface/50">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                            className="flex items-center gap-2"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about compliance..."
                                className="flex-1 bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="p-2 rounded-lg bg-brand-500 text-white hover:bg-brand-400 disabled:opacity-50 transition-colors disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
