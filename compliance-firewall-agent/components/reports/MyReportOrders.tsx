"use client";

import { useEffect, useState } from "react";
import { FileText, CalendarClock, CheckCircle2, Clock } from "lucide-react";

interface OrderView {
  reference: string;
  amountFormatted: string;
  vertical: string | null;
  verticalLabel: string | null;
  status: string;
  statusLabel: string;
  statusStep: number;
  createdAt: string;
  reportDueDate: string;
  reportDeliveredAt: string | null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Signed-in "your purchased reports" panel. Consumes GET /api/reports/orders,
 * which is gated by Supabase RLS (migration 020's own-rows policy). Renders
 * nothing when the visitor has no linked orders — so it never adds clutter for
 * users who haven't bought the $499 CMMC AI Risk Assessment Report.
 *
 * Dark-surface styling: this lives inside the command-center (dark) shell.
 */
export function MyReportOrders() {
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/reports/orders")
      .then((res) => (res.ok ? res.json() : { orders: [] }))
      .then((data: { orders?: OrderView[] }) => {
        if (active) setOrders(Array.isArray(data?.orders) ? data.orders : []);
      })
      .catch(() => {
        if (active) setOrders([]);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Silent until we know there's something to show — no empty state, no clutter.
  if (!loaded || orders.length === 0) return null;

  return (
    <section className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-4 w-4 text-brand-400" aria-hidden />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
          Your CMMC AI Risk Assessment Report
        </h2>
      </div>

      <ul className="space-y-3">
        {orders.map((order) => {
          const delivered = order.status === "report_delivered" || Boolean(order.reportDeliveredAt);
          return (
            <li
              key={order.reference}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold text-white">{order.reference}</p>
                <p className="mt-0.5 text-xs text-white/50">
                  {order.amountFormatted}
                  {order.verticalLabel ? ` · ${order.verticalLabel}` : ""} · ordered{" "}
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {delivered ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(5,150,105,0.3)] bg-[rgba(5,150,105,0.12)] px-2.5 py-1 font-medium text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    {order.statusLabel}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-medium text-white/70">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {order.statusLabel}
                  </span>
                )}
              </div>
              {!delivered && (
                <p className="flex w-full items-center gap-1.5 text-xs text-white/40">
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                  Signed PDF due by {formatDate(order.reportDueDate)}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
