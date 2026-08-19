"use client";

/**
 * Thermal-printer receipt for the $499 CMMC AI Risk Assessment Report.
 *
 * WHY THIS IS A REBUILD, NOT A DROP-IN. The reference implementation this was
 * modelled on targets a different stack: `motion/react`, `@phosphor-icons/react`,
 * a `grayscale-*` colour scale, a `TactileButton`, and two texture SVGs. This
 * repo runs `framer-motion` + `lucide-react` on the `--hs-*` token system, so
 * copying it verbatim would have meant two new dependencies, a foreign palette,
 * and missing assets — to render one receipt. The paper-feed choreography and
 * the sawtooth tear edge are reproduced; everything else is this design system.
 *
 * WHY IT EARNS ITS PLACE. A $499 purchase gets expensed, and Rachel's office
 * manager or Jordan's contracts officer needs a document to attach. Stripe's
 * generic receipt does not carry the order reference, the vertical, the 14-day
 * fulfillment date, or the NIST mapping — the things that make it legible as a
 * compliance purchase rather than a card charge. So this prints.
 *
 * PRINT IS THE POINT, not the animation. Everything decorative is `print:hidden`
 * and the paper reflows to a clean full-width document, so `window.print()`
 * produces an invoice rather than a screenshot of a printer.
 *
 * Accessibility: the feed animation is suppressed under `prefers-reduced-motion`
 * (paper appears in place), and the printer chrome is `aria-hidden` so a screen
 * reader gets the receipt content, not a description of a machine.
 */

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Loader2, Printer, ShieldCheck } from "lucide-react";

/** Sanitized order shape — mirrors `buildOrderView` in lib/reports/order-view.ts. */
export interface ReceiptOrder {
  reference: string;
  emailMasked: string;
  amountFormatted: string;
  vertical: string | null;
  verticalLabel: string | null;
  statusLabel: string;
  isWholesale: boolean;
  createdAt: string;
  reportDueDate: string;
}

/** "processing" → nothing printed yet · "printing" → feeding · "complete" → done. */
export type ReceiptStage = "processing" | "printing" | "complete";

const TOOTH_COUNT = 40;
const TOOTH_DEPTH_PX = 4;

/**
 * Sawtooth tear edge along the bottom of the paper, as a clip-path polygon.
 *
 * Computed rather than hand-written because it is 80 points. This is the one
 * place an inline `style` is unavoidable — `clip-path` with generated geometry
 * cannot be expressed as a Tailwind class, and the design rules allow a computed
 * style prop for exactly this (the radial-gradient precedent).
 */
function toothClipPath(): string {
  const points = Array.from({ length: TOOTH_COUNT * 2 }, (_, i) => {
    const x = 100 - ((i + 1) * 100) / (TOOTH_COUNT * 2);
    const y = i % 2 === 0 ? "100%" : `calc(100% - ${TOOTH_DEPTH_PX}px)`;
    return `${x}% ${y}`;
  }).join(", ");
  return `polygon(0 0, 100% 0, 100% calc(100% - ${TOOTH_DEPTH_PX}px), ${points})`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

const STAGE_LABEL: Record<ReceiptStage, string> = {
  processing: "Processing your order",
  printing: "Printing your receipt",
  complete: "Order complete",
};

/** One label/value line on the paper. */
function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="text-right font-mono text-[13px] font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

export function ReceiptPrinter({
  order,
  stage = "complete",
}: {
  order: ReceiptOrder;
  stage?: ReceiptStage;
}) {
  const reduceMotion = useReducedMotion();
  const [printing, setPrinting] = useState(false);
  const clipPath = useMemo(() => toothClipPath(), []);

  const paperVisible = stage !== "processing";
  // Feed the paper out of the slot. Suppressed for reduced-motion users, who
  // get the finished receipt in place rather than a 1.75s crawl.
  const shouldFeed = paperVisible && !reduceMotion;

  const handlePrint = () => {
    setPrinting(true);
    // Let the button's pressed state paint before the print dialog blocks the
    // main thread, otherwise the click appears to do nothing.
    window.requestAnimationFrame(() => {
      window.print();
      setPrinting(false);
    });
  };

  return (
    <section
      aria-label="Order receipt"
      className="mb-10 flex w-full flex-col items-center print:mb-0 print:block"
      data-stage={stage}
    >
      {/* ── Printer chrome. Decorative: hidden from AT and from print. ── */}
      <div
        aria-hidden
        className="relative isolate w-full max-w-sm overflow-hidden rounded-3xl border border-[var(--hs-border)] bg-[var(--hs-surface-alt,#eef2f6)] p-3 pb-8 shadow-[0_20px_36px_-20px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.7)] print:hidden"
      >
        <div className="relative z-10 mb-3 flex h-9 items-center justify-between px-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--hs-ink)]">
            <ShieldCheck className="h-4 w-4 text-brand-500" />
            HoundShield
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--hs-ink-secondary)]">
            Receipt
          </span>
        </div>

        {/* Status screen */}
        <div className="relative z-10 overflow-hidden rounded-2xl border border-slate-900 bg-slate-900 p-4 text-slate-100 shadow-inner">
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">CMMC AI Risk Assessment</p>
              <p className="truncate text-xs text-slate-400">
                {order.isWholesale ? "RPO/MSP co-brand" : "One-time report"}
              </p>
            </div>
            <strong className="font-mono text-base">{order.amountFormatted}</strong>
          </div>

          <div className="mt-4 flex items-center gap-2" role="status" aria-live="polite">
            {stage === "complete" ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400 motion-reduce:animate-none" />
            )}
            <span className="text-xs font-medium text-slate-400">{STAGE_LABEL[stage]}</span>
          </div>
        </div>

        {/* Paper slot */}
        <div className="absolute inset-x-6 bottom-3 z-40 h-2 rounded bg-slate-900 shadow-inner" />
      </div>

      {/* ── The receipt itself. This is what prints. ── */}
      <div className="relative z-0 -mt-4 w-[calc(100%-1.5rem)] max-w-sm overflow-hidden px-0 print:mt-0 print:w-full print:max-w-none print:overflow-visible">
        <motion.div
          initial={false}
          animate={{
            opacity: paperVisible ? 1 : 0,
            y: shouldFeed ? 0 : paperVisible ? 0 : "-100%",
          }}
          transition={{
            opacity: { duration: reduceMotion ? 0 : 0.16 },
            y: { duration: reduceMotion ? 0 : 1.1, ease: [0.77, 0, 0.175, 1] },
          }}
          className="origin-top"
        >
          <article
            style={{ clipPath }}
            className="bg-white px-6 pt-7 pb-9 text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.14)] print:px-0 print:pb-0 print:shadow-none print:[clip-path:none]"
          >
            <header className="mb-4 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
                HoundShield
              </p>
              <h2 className="mt-1 text-base font-bold">Payment receipt</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                CMMC AI Risk Assessment Report
              </p>
            </header>

            <div className="border-y border-dashed border-slate-300 py-1">
              <dl>
                <Line label="Order ref" value={order.reference} />
                <Line label="Billed to" value={order.emailMasked} />
                <Line label="Date" value={formatDate(order.createdAt)} />
                {order.verticalLabel ? (
                  <Line label="Vertical" value={order.verticalLabel} />
                ) : null}
                <Line label="Status" value={order.statusLabel} />
                <Line label="Report due" value={formatDate(order.reportDueDate)} />
              </dl>
            </div>

            <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-slate-300 py-3">
              <span className="text-xs font-bold uppercase tracking-[0.12em]">Total paid</span>
              <span className="font-mono text-lg font-bold">{order.amountFormatted}</span>
            </div>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-500">
              Deliverable: a SHA-256-signed PDF risk-scoring every AI prompt event
              against NIST 800-171 Rev 2, after a 14-day observation window in
              your own environment.
            </p>
            <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Thank you — keep this for your records
            </p>
          </article>
        </motion.div>
      </div>

      <button
        type="button"
        onClick={handlePrint}
        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[var(--hs-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--hs-ink)] shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 print:hidden"
      >
        <Printer className="h-4 w-4 text-[var(--hs-steel-dark)]" aria-hidden />
        {printing ? "Opening print…" : "Print receipt"}
      </button>
    </section>
  );
}
