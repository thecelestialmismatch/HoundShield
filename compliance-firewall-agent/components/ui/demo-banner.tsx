"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, X, ArrowRight } from "lucide-react";

const DISMISS_KEY = "kaelus_demo_banner_dismissed";

interface DemoBannerProps {
  /** If true, renders the banner. If false, renders nothing. */
  show: boolean;
}

export function DemoBanner({ show }: DemoBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;
    try {
      const dismissed = sessionStorage.getItem(DISMISS_KEY);
      if (!dismissed) setVisible(true);
    } catch {
      // sessionStorage unavailable (SSR guard) — show by default
      setVisible(true);
    }
  }, [show]);

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="relative z-50 flex items-center gap-3 px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-sm"
    >
      {/* Icon */}
      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" aria-hidden="true" />

      {/* Message */}
      <p className="flex-1 min-w-0">
        <span className="font-semibold text-amber-200">Demo Mode</span>
        {" — "}
        Your data is not being saved. All dashboards show simulated data only.
      </p>

      {/* CTA */}
      <Link
        href="/command-center/settings"
        className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-medium border border-amber-500/30 transition-colors whitespace-nowrap"
      >
        Connect account
        <ArrowRight className="w-3 h-3" />
      </Link>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        aria-label="Dismiss demo mode banner"
        className="flex-shrink-0 p-1 rounded-md text-amber-400 hover:text-amber-200 hover:bg-amber-500/20 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
