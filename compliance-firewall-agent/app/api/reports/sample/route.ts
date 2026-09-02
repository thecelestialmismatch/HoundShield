import { NextResponse } from "next/server";
import { generateCompliancePDF } from "@/lib/reports/pdf-generator";
import { buildSampleReportData } from "@/lib/reports/sample-data";

/**
 * GET /api/reports/sample
 *
 * Public, no-auth: serves a watermarked sample of the $499 CMMC AI Risk
 * Assessment Report (synthetic data only). This is the asset the /assessment
 * page and the RPO/MSP + HIPAA outreach emails link to.
 *
 * ─── Why this is no longer `force-static` ──────────────────────────────────
 *
 * It declared `export const dynamic = "force-static"`, so Next evaluated the
 * handler ONCE at build and served the resulting bytes as a static asset.
 * `buildSampleReportData()` derives every date from `now`, which under
 * force-static is the build time — so the sample PDF a prospect downloads is
 * dated to the last production deploy, and its "14-day window" is fourteen days
 * ending whenever we last merged to main.
 *
 * On an evidence product sold to buyers who verify things, an artifact whose
 * own cover date is months stale is the first thing a careful assessor notices.
 * `export const revalidate = 86400` did not help: a statically-evaluated handler
 * with no dynamic input produces identical bytes on every regeneration.
 *
 * The handler now runs at the origin, and the CDN holds the result for a day —
 * so the dates track real time to within 24 hours, at one PDF render per day
 * per edge region rather than one per request.
 *
 * `runtime` is pinned because `generateCompliancePDF` returns a Node `Buffer`
 * (lib/reports/pdf-generator.ts). Nothing here works on the edge runtime, and
 * the failure would be a runtime crash rather than a build error, so the
 * constraint is declared rather than left to the default.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  const pdf = generateCompliancePDF(buildSampleReportData());
  // jsPDF returns a Node Buffer; hand its bytes to the Response as a Uint8Array.
  const bytes = new Uint8Array(pdf);

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'inline; filename="HoundShield-Sample-CMMC-AI-Risk-Assessment-Report.pdf"',
      /*
       * `s-maxage` is what actually caches this: the shared CDN keeps one copy
       * for a day. `stale-while-revalidate` means the day's first visitor after
       * expiry gets the slightly-stale copy immediately while the fresh one is
       * built behind them, so nobody waits on a PDF render.
       *
       * `max-age=0` on purpose — a browser that cached this privately would
       * keep showing a prospect the same dated artifact across visits, which is
       * the defect this change exists to fix, just moved one hop closer to them.
       */
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
