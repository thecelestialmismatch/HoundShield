"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { ScrollProgressBar } from "@/components/scroll-effects/ScrollProgressBarClient";
import { CheckCircle2, AlertTriangle, Loader2, RefreshCw } from "lucide-react";

type HealthResponse = {
  status: string;
  version: string;
  uptime_seconds: number;
  timestamp: string;
  services: Record<string, string>;
  environment: string;
};

const OPERATIONAL = new Set(["operational", "connected", "healthy"]);

// Human labels for the raw service keys returned by /api/health.
const LABELS: Record<string, string> = {
  database: "Database",
  ai_router: "AI Router",
  payments: "Payments",
  classifier: "CUI Classifier",
  quarantine: "Quarantine",
  audit_chain: "Audit Chain",
};

function StatusDot({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
  ) : (
    <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden />
  );
}

export default function StatusPage() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as HealthResponse);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  const allOk =
    data != null &&
    data.status === "healthy" &&
    Object.values(data.services).every((s) => OPERATIONAL.has(s));

  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <ScrollProgressBar />
      <NavV3 />
      <main className="max-w-2xl mx-auto px-6 pt-32 pb-24">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[var(--hs-ink)]">System Status</h1>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--hs-border)] px-3 py-1.5 text-xs font-medium text-[var(--hs-ink-secondary)] hover:bg-[var(--hs-surface-1)]"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Refresh
          </button>
        </div>

        {/* Overall banner */}
        <div
          className="rounded-2xl border p-6 mb-8"
          style={{
            borderColor: error
              ? "rgba(245,158,11,0.4)"
              : "var(--hs-border)",
          }}
        >
          {loading && !data ? (
            <p className="flex items-center gap-2 text-[var(--hs-ink-secondary)]">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Checking services…
            </p>
          ) : error ? (
            <p className="flex items-center gap-2 text-amber-600 font-medium">
              <AlertTriangle className="h-5 w-5" aria-hidden /> Status endpoint unreachable.
            </p>
          ) : (
            <p className="flex items-center gap-2 text-lg font-semibold text-[var(--hs-ink)]">
              <StatusDot ok={allOk} />
              {allOk ? "All systems operational" : "Some services need attention"}
            </p>
          )}
        </div>

        {/* Per-service rows */}
        {data && (
          <ul className="divide-y divide-[var(--hs-border-subtle)] rounded-2xl border border-[var(--hs-border)] bg-white">
            {Object.entries(data.services).map(([key, value]) => (
              <li key={key} className="flex items-center justify-between px-5 py-4">
                <span className="text-sm font-medium text-[var(--hs-ink)]">
                  {LABELS[key] ?? key}
                </span>
                <span className="flex items-center gap-2 text-sm text-[var(--hs-ink-secondary)]">
                  {value.replace(/_/g, " ")}
                  <StatusDot ok={OPERATIONAL.has(value)} />
                </span>
              </li>
            ))}
          </ul>
        )}

        {data && (
          <p className="mt-6 text-xs text-[var(--hs-ink-tertiary)]">
            Version {data.version} · uptime {Math.floor(data.uptime_seconds / 60)} min · last checked{" "}
            {new Date(data.timestamp).toLocaleTimeString()} · auto-refreshes every 30s.
          </p>
        )}

        <p className="mt-8 text-sm text-[var(--hs-ink-secondary)]">
          For incident history or to report an outage, contact{" "}
          <a href="mailto:support@houndshield.com" className="text-brand-700 hover:text-brand-700">support@houndshield.com</a>{" "}
          or see our <Link href="/security" className="text-brand-700 hover:text-brand-700">Security &amp; Trust</Link> page.
        </p>
      </main>
      <FooterV3 />
    </div>
  );
}
