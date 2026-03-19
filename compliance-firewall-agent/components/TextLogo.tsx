import React from "react";

export function TextLogo({ className = "", variant = "light" }: { className?: string; variant?: "light" | "dark" }) {
    const dotDomainColor = variant === "dark" ? "text-white/80" : "text-slate-900/90";
    return (
        <span className={`text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-emerald-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all duration-300 ${className}`}>
            Kaelus<span className={`${dotDomainColor} font-bold`}>.online</span>
        </span>
    );
}
