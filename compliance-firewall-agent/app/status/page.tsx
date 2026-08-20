"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { ScrollProgressBar } from "@/components/scroll-effects/ScrollProgressBarClient";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

type LivenessResponse = { status?: string };

/**
 * Public status is intentionally limited to application liveness.
 *
 * Deployment topology, service maps, diagnostics, versions, uptime, and
 * configuration state are operational details, not public status data. Detailed
 * diagnostics are available only through the server-side administrator route.
 */
export default function StatusPage() {
  const [alive, setAlive] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    setAlive(null);
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      const payload = (await response.json()) as LivenessResponse;
      setAlive(payload.status === "ok");
    } catch {
      setAlive(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <ScrollProgressBar />
      <NavV3 />
      <main className="max-w-2xl mx-auto px-6 pt-16 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--hs-ink)]">Service Status</h1>
            <p className="mt-2 text-sm text-[var(--hs-ink-secondary)]">Public liveness check for HoundShield.</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--hs-border)] px-3 py-1.5 text-xs font-medium text-[var(--hs-ink-secondary)] hover:bg-[var(--hs-surface-1)]"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Refresh
          </button>
        </div>

        <div className="rounded-2xl border border-[var(--hs-border)] bg-white p-6">
          {alive === null ? (
            <p className="flex items-center gap-2 text-[var(--hs-ink-secondary)]">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Checking application availability…
            </p>
          ) : alive ? (
            <p className="flex items-center gap-2 text-lg font-semibold text-[var(--hs-ink)]">
              <CheckCircle2 className="h-5 w-5 text-[var(--hs-success)]" aria-hidden /> Application is responding.
            </p>
          ) : (
            <p className="flex items-center gap-2 text-[var(--hs-warn)] font-medium">
              <AlertTriangle className="h-5 w-5" aria-hidden /> The liveness check is currently unavailable.
            </p>
          )}
        </div>

        <p className="mt-8 text-sm text-[var(--hs-ink-secondary)]">
          This page reports only whether the application can respond. It does not publish infrastructure, configuration,
          customer, or diagnostic details. To report an issue, contact{" "}
          <a href="mailto:support@houndshield.com" className="text-brand-700 hover:text-brand-700">support@houndshield.com</a>{" "}
          or review the <Link href="/security" className="text-brand-700 hover:text-brand-700">Security &amp; Trust</Link> page.
        </p>
      </main>
      <FooterV3 />
    </div>
  );
}
