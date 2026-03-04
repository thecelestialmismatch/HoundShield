import { Shield } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
    return (
        <div className={`relative flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500/20 to-emerald-500/20 border border-brand-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.25)] ${className}`}>
            <Shield className="w-4.5 h-4.5 text-brand-400" fill="rgba(99,102,241,0.15)" strokeWidth={2} />
            <div className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400 bottom-[5px] right-[5px] shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
        </div>
    );
}
