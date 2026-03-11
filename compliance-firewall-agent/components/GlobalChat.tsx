"use client";

import { Logo } from "@/components/Logo";
import { useState } from "react";
import { X, Send } from "lucide-react";

export function GlobalChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
        { role: 'bot', text: "Hi! How can I help you learn about Kaelus.ai today?" }
    ]);
    const [input, setInput] = useState("");

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages(prev => [...prev, { role: 'user', text: input }]);
        const currentInput = input;
        setInput("");

        // Simulate thinking
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'bot', text: `I am a demo AI assistant for Kaelus. You asked about: "${currentInput}". The full platform supports powerful compliance checks!` }]);
        }, 800);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/25 transition-transform hover:scale-105 active:scale-95"
            >
                {isOpen ? <X className="w-6 h-6 text-white" /> : (
                    <Logo />
                )}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-[350px] bg-[#0c0c10] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden animate-fade-in flex flex-col">
                    <div className="bg-white/[0.03] border-b border-white/[0.05] p-4 flex items-center gap-3">
                        <Logo className="w-8 h-8" />
                        <div className="ml-1">
                            <h3 className="text-sm font-semibold text-white">Kaelus Assistant</h3>
                            <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Online
                            </p>
                        </div>
                    </div>

                    <div className="p-4 h-80 overflow-y-auto space-y-4">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white/[0.05] text-white/90 border border-white/[0.05] rounded-bl-sm'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-3 bg-white/[0.02] border-t border-white/[0.05]">
                        <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Ask about Kaelus.ai..."
                                className="w-full bg-white/[0.03] border border-white/[0.1] rounded-xl pl-4 pr-10 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                            >
                                <Send className="w-3.5 h-3.5" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
