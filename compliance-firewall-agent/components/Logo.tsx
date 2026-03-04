import { Shield, Zap } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
    return (
        <div className={`relative flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500/20 to-emerald-500/20 border border-brand-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.25)] ${className}`}>
            <Shield className="w-4.5 h-4.5 text-brand-400" fill="rgba(99,102,241,0.15)" strokeWidth={2} />
            <Zap className="w-2 h-2 text-emerald-400 absolute" style={{ fill: "currentColor" }} />
        </div>
    );
}
