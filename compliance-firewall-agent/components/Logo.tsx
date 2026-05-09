import { Shield, Zap } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
    return (
        <div className={`relative flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] flex items-center justify-center ${className}`}>
            <Shield className="w-4.5 h-4.5 text-white" fill="rgba(255,255,255,0.2)" strokeWidth={2} />
            <Zap className="w-2 h-2 text-cream-100 absolute" style={{ fill: "currentColor" }} />
        </div>
    );
}
