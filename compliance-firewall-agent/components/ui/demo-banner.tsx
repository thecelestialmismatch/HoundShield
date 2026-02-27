"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

/**
 * Persistent banner shown when the app is running in demo mode.
 * Makes it unmistakably clear that data is simulated,
 * preventing users from confusing demo data with real production data.
 */
export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-warning/10 border-b border-warning/20 px-4 py-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
        <p className="text-xs text-warning/90 truncate">
          <span className="font-semibold">Demo Mode</span> &mdash; Showing simulated data. Configure Supabase in <code className="text-[10px] bg-warning/10 px-1 py-0.5 rounded">.env.local</code> for production.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 text-warning/50 hover:text-warning transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
