"use client";

import { useState, useEffect } from "react";
import { Eye, Brain, Zap, RefreshCw } from "lucide-react";

export function ReActLoop() {
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % 4);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    const steps = [
        {
            name: "Observe",
            icon: Eye,
            color: "text-blue-400",
            bg: "bg-blue-500/10 border-blue-500/30",
            desc: "Agent reads the prompt context",
            eli5: "The Detective looks at the backpack."
        },
        {
            name: "Think",
            icon: Brain,
            color: "text-purple-400",
            bg: "bg-purple-500/10 border-purple-500/30",
            desc: "Agent reasons about data sensitivity",
            eli5: "He thinks, 'Wait, is that a recipe?'"
        },
        {
            name: "Act",
            icon: Zap,
            color: "text-amber-400",
            bg: "bg-amber-500/10 border-amber-500/30",
            desc: "Agent runs external database queries",
            eli5: "He checks his rulebook and makes a call."
        },
        {
            name: "Iterate",
            icon: RefreshCw,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10 border-emerald-500/30",
            desc: "Agent confirms threat neutralization",
            eli5: "He keeps checking until it's safe."
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {steps.map((step, i) => {
                const Icon = step.icon;
                const isActive = activeStep === i;
                return (
                    <div
                        key={step.name}
                        className={`glass-card p-6 text-center transition-all duration-500 cursor-pointer overflow-hidden relative ${isActive ? "border-brand-500/30 shadow-[0_0_30px_rgba(99,102,241,0.15)] bg-white/[0.04]" : "hover:border-white/10"
                            }`}
                        onClick={() => setActiveStep(i)}
                    >
                        {/* Background animated gradient pulse */}
                        {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent opacity-50 animate-pulse" />
                        )}

                        <div className={`w-16 h-16 mx-auto rounded-2xl ${step.bg} border-2 flex items-center justify-center mb-6 transition-all duration-500 relative z-10 ${isActive ? "scale-110 shadow-xl" : ""
                            }`}>
                            <Icon className={`w-8 h-8 ${step.color} transition-all duration-300 ${isActive ? "animate-pulse drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : ""}`} />
                        </div>
                        <div className={`text-sm tracking-widest uppercase font-bold text-white mb-2 transition-transform duration-300 relative z-10 ${isActive ? "scale-105" : ""}`}>
                            {step.name}
                        </div>

                        {/* ELI5 Text */}
                        <p className="text-sm font-medium text-brand-300 mb-2 relative z-10">{step.eli5}</p>

                        <p className="text-xs font-mono text-white/40 leading-relaxed mt-4 pt-4 border-t border-white/[0.04] relative z-10">{step.desc}</p>

                        {/* Progress indicator line */}
                        <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-${step.color.split('-')[1]}-500 to-${step.color.split('-')[1]}-400 transition-all duration-[2500ms] ease-linear`} style={{ width: isActive ? "100%" : "0%", opacity: isActive ? 1 : 0 }} />
                    </div>
                );
            })}
        </div>
    );
}
