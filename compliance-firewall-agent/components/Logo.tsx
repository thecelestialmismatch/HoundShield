import { Shield, Zap } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
    return (
        <div className={`relative flex-shrink-0 w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center ${className}`}>
            <Shield className="w-4 h-4 text-brand-400" />
            <Zap className="w-2 h-2 text-emerald-400 absolute" style={{ fill: "currentColor" }} />
        </div>
    );
}
