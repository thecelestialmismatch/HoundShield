"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

/**
 * Initiates Stripe checkout for the one-time $499 CMMC AI Risk Assessment
 * Report via the canonical no-auth rail (`/api/stripe/report-checkout`).
 * A $499 PO is an impulse buy — no signup gate. Handles the two real
 * responses: a checkout URL (redirect) and 503 (not yet configured →
 * route to contact so the lead isn't lost).
 */
export function ReportCheckoutButton({
  className,
  label = "Get your $499 report",
  vertical,
}: {
  className?: string;
  label?: string;
  vertical?: "defense" | "healthcare" | "legal";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/report-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vertical ? { vertical } : {}),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url as string;
        return;
      }

      // 503 (Stripe not configured) or other — keep the lead, route to contact.
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
