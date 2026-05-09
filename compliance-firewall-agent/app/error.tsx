"use client";

import { Logo } from "@/components/Logo";
import { RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <Logo className="w-16 h-16 rounded-2xl mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-slate-400 mb-2 text-sm">
          An unexpected error occurred. Your data is safe — the compliance
          firewall continues to protect your pipeline.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-500 font-mono mb-6">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="btn-primary inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
