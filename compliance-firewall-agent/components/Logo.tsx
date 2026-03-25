import { Shield, Zap } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
    return (
        <div className={`relative flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#4338ca] flex items-center justify-center shadow-[0_4px_14px_rgba(99,102,241,0.45)] ${className}`}>
            <Shield className="w-4.5 h-4.5 text-brand-400" fill="rgba(245,200,66,0.25)" strokeWidth={2} />
            <Zap className="w-2 h-2 text-emerald-400 absolute" style={{ fill: "currentColor" }} />
        </div>
    );
}
