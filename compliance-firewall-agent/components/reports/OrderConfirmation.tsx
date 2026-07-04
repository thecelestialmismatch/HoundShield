"use client";

import { useEffect, useState } from "react";
import { Receipt, CalendarClock, ShieldCheck, Loader2 } from "lucide-react";

/** Sanitized order shape returned by GET /api/reports/order. */
interface OrderView {
  reference: string;
  emailMasked: string;
  amountFormatted: string;
  vertical: string | null;
  verticalLabel: string | null;
  statusLabel: string;
  statusStep: number;
  isWholesale: boolean;
  createdAt: string;
  reportDueDate: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Real-order confirmation for the $499 CMMC AI Risk Assessment Report, rendered
 * at the top of `/report/thank-you`. Fetches the sanitized order by the Stripe
 * `session_id` in the success_url. If there's no session id, the lookup fails,
 * or Stripe isn't configured (demo), it renders nothing — the page keeps its
 * static 14-day timeline, so the surface never breaks.
 */
export function OrderConfirmation({ sessionId }: { sessionId?: string }) {
  const [order, setOrder] = useState<OrderView | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    sessionId ? "loading" : "idle",
  );

  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    setState("loading");

    fetch(`/api/reports/order?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data: { order?: OrderView }) => {
        if (!active) return;
        if (data?.order) {
          setOrder(data.order);
          setState("done");
        } else {
          setState("error");
        }
      })
      .catch(() => {
        if (active) setState("error");
      });

    return () => {
      active = false;
    };
  }, [sessionId]);

  // No session id, or the lookup failed → render nothing; the static timeline
  // below on the page carries the confirmation. Never show an error here.
  if (state === "idle" || state === "error") return null;

  if (state === "loading") {
    return (
      <div
        className="mb-10 flex items-center gap-3 rounded-2xl border border-[var(--hs-border)] bg-white p-6 text-sm text-[var(--hs-ink-secondary)] shadow-sm"
        aria-live="polite"
      >
        <Loader2 className="h-4 w-4 animate-spin text-[var(--hs-steel-dark)]" aria-hidden />
        Retrieving your order details…
      </div>
    );
  }

  if (!order) return null;

  const rows: { icon: typeof Receipt; label: string; value: string }[] = [
    { icon: Receipt, label: "Order reference", value: order.reference },
    { icon: ShieldCheck, label: "Amount paid", value: order.amountFormatted },
    { icon: CalendarClock, label: "Report due by", value: formatDate(order.reportDueDate) },
  ];

  return (
    <div className="mb-10 rounded-2xl border border-[var(--hs-border)] bg-white p-6 shadow-sm sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--hs-ink-secondary)]">
            Order confirmation
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--hs-ink)]">
            Sent to {order.emailMasked}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(5,150,105,0.25)] bg-[rgba(5,150,105,0.08)] px-3 py-1 text-xs font-medium text-[var(--hs-success)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--hs-success)]" aria-hidden />
          {order.statusLabel}
        </span>
      </div>

      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[var(--hs-border)] bg-[var(--hs-border)] sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="bg-white p-4">
            <dt className="mb-1 flex items-center gap-1.5 text-xs text-[var(--hs-ink-secondary)]">
              <row.icon className="h-3.5 w-3.5 text-[var(--hs-steel-dark)]" aria-hidden />
              {row.label}
            </dt>
            <dd className="font-mono text-sm font-semibold text-[var(--hs-ink)]">{row.value}</dd>
          </div>
        ))}
      </dl>

      {order.verticalLabel && (
        <p className="mt-4 text-xs text-[var(--hs-ink-secondary)]">
          Vertical: <span className="font-medium text-[var(--hs-ink)]">{order.verticalLabel}</span>
          {order.isWholesale ? " · RPO/MSP co-brand" : ""}
        </p>
      )}
    </div>
  );
}
