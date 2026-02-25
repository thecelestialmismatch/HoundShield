import { Shield } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
          <Shield className="w-6 h-6 text-brand-400" />
        </div>
        <div className="h-1 w-24 rounded-full bg-brand-500/20 overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-brand-500/50 animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
