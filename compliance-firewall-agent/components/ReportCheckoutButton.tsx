"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

/**
 * Initiates Stripe checkout for the one-time $499 CMMC AI Risk Assessment
 * Report (tier: "report"). Handles the three real responses: a checkout URL
 * (redirect), 401 (send to login, then back here), and 503 (not yet
 * configured — route to contact so the lead isn't lost).
 */
export function ReportCheckoutButton({
  className,
  label = "Get your $499 report",
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "report" }),
      });

      if (res.status === 401) {
        router.push("/login?redirect=/assessment");
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url as string;
        return;
      }

      // 503 (not configured) or other — keep the lead, send to contact.
      if (res.status === 503) {
        router.push("/contact?topic=assessment-report");
        return;
      }
      setError(data.error || "Could not start checkout. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={loading}
        className={
          className ??
          "inline-flex items-center gap-2 rounded-xl bg-[var(--hs-ink)] px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        }
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Starting checkout…
          </>
        ) : (
          <>
            {label} <ArrowRight className="h-4 w-4" aria-hidden />
          </>
        )}
      </button>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
