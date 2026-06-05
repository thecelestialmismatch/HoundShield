import { Logo } from "@/components/Logo";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <Logo className="w-12 h-12 rounded-xl" />
        <div className="h-1 w-24 rounded-full bg-brand-500/20 overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-brand-500/50 animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
