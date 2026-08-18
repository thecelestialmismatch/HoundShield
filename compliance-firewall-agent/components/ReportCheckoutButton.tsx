"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { reportPaymentLinkUrlStatic } from "@/lib/stripe/report-payment-link";

/**
 * The buy control for the one-time $499 AI Risk Assessment Report.
 *
 * WHY THIS IS AN ANCHOR AND NOT A BUTTON
 * It used to be a `<button>` whose only purchase path ran through an onClick
 * fetch to `/api/stripe/report-checkout`. That had three failure modes, and the
 * third is the one that actually cost money:
 *
 *   1. No JavaScript, hydration not finished, or the script blocked -> the page
 *      had no purchase path at all. The buyer saw a price and a dead control.
 *   2. The fetch had to succeed before the buyer ever reached Stripe, so a
 *      transient network error became a lost sale on a $499 impulse purchase.
 *   3. A `<button>` is not a link, so nothing that reads the page rather than
 *      running it could see that the product was purchasable. Text extractors,
 *      search crawlers and — the part that matters in 2026 — the AI answer
 *      engines the AEO strategy targets all saw only the secondary "Talk to us
 *      first" anchor, and concluded HoundShield sells through a sales call.
 *      A live read of /pricing on 2026-08-18 returned exactly that: the price,
 *      then "Talk to us first", with no buy path in the extracted text.
 *
 * So the markup is now a real `<a href>` pointing at the Stripe-hosted Payment
 * Link, which works with zero JavaScript and is visible to anything that reads
 * HTML. JavaScript then PROGRESSIVELY ENHANCES it: the click handler tries the
 * dynamic checkout route first, because that rail supports promotion codes,
 * session metadata and the branded /report/thank-you page. If that rail is
 * unavailable for any reason, we do not swallow the click — we let the browser
 * follow the href, and the buyer lands on Stripe anyway.
 *
 * The invariant to preserve when editing this file: THE BUYER MUST ALWAYS REACH
 * A CHECKOUT PAGE. Never add a code path that can end in neither a redirect nor
 * a navigation.
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
  const [loading, setLoading] = useState(false);

  /** No-JS / fallback target. Deterministic, so SSR and hydration agree. */
  const href = reportPaymentLinkUrlStatic(vertical);

  const onClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Respect the browser's own affordances: modified clicks and non-primary
    // buttons must behave like any other link (new tab, download, etc.).
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    // Take over only to try the richer rail. Any failure below re-enters the
    // default navigation via `window.location.href = href`.
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/stripe/report-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vertical ? { vertical } : {}),
        signal: AbortSignal.timeout(8_000),
      });

      const data = (await res.json().catch(() => ({}))) as { url?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      // Network error, timeout, malformed response — fall through.
    }

    // Every unsuccessful path lands here. The buyer still reaches Stripe.
    window.location.href = href;
  };

  return (
    <a
      href={href}
      onClick={onClick}
      aria-busy={loading || undefined}
      data-testid="report-checkout"
      className={
        className ??
        "inline-flex items-center gap-2 rounded-xl bg-[var(--hs-ink)] px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
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
    </a>
  );
}
