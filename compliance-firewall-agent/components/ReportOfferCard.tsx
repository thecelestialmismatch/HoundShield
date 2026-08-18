import Link from "next/link";
import { Check, ShieldCheck, Clock, FileText } from "lucide-react";
import { ReportCheckoutButton } from "@/components/ReportCheckoutButton";
import { ENGINE_COUNT, PATTERN_COUNT } from "@/lib/detection/engines";

/**
 * The $499 AI Risk Assessment Report — the only thing we sell — as a proper
 * offer card: pitch + what's-included on the left, an unmissable
 * price-and-buy panel on the right. Hermes-styled (see .report-offer in
 * app/hermes.css), so render it inside a `.hermes` page only.
 *
 * Framing note: this card IS the pricing page. It was titled "CMMC AI Risk
 * Assessment Report" and led with C3PAO readiness — which sells to nobody
 * since CMMC Phase 2 was suspended on 2026-07-13, and never spoke to the
 * healthcare privacy officer who is now the lead buyer. It now leads with
 * the outcome both buyers want (evidence) and names HIPAA and NIST together.
 */
export function ReportOfferCard() {
  return (
    <div className="report-offer">
      <div className="report-offer-pitch">
        <span className="eyebrow">Start here · one-time report</span>
        <h2 className="display">AI Risk Assessment Report</h2>
        <p>
          Your staff are pasting patient records and contract data into ChatGPT and Copilot
          right now — with no audit trail. We scan 14 days of your real AI traffic on your
          own hardware and hand you signed evidence you can put in front of an auditor.
          No subscription, no procurement cycle.
        </p>
        <ul className="report-includes">
          <li>
            <Check />
            <span><b>14 days of real AI-traffic scanning</b> across {ENGINE_COUNT} local detection engines ({PATTERN_COUNT} patterns · PHI · CUI · PII · ITAR)</span>
          </li>
          <li>
            <Check />
            <span><b>Every prompt event scored</b> against NIST 800-171 Rev 2 and HIPAA, with your SPRS impact</span>
          </li>
          <li>
            <Check />
            <span><b>SHA-256 hash-chained audit trail</b> — tamper-evident, assessor-defensible</span>
          </li>
          <li>
            <Check />
            <span><b>Audit-ready PDF</b> plus a 30-minute readout of findings and next steps</span>
          </li>
        </ul>
        <div className="report-trust">
          <span><ShieldCheck /> Mode B (Docker) — data never leaves your network</span>
          <span><Clock /> Delivered within days of intake</span>
          <span><FileText /> No signup required</span>
        </div>
      </div>

      <div className="report-offer-buy">
        <div className="price-tag">$499</div>
        <div className="price-sub">one-time · per organization</div>
        {/* "Buy now" and not "Get your report": the whole argument for a $499
            price is that it clears without procurement, and that argument dies
            if the primary control reads like a lead form. The secondary link
            below stays for buyers who want a conversation first — it must never
            be the only path on the page. */}
        <ReportCheckoutButton className="btn btn-primary report-buy-btn" label="Buy now — $499" />
        <Link className="talk-first" href="/contact?topic=assessment-report">
          Or talk to us first →
        </Link>
        <p className="fine">
          Fixed price. Yours to keep.{" "}
          <a href="/api/reports/sample">See a sample report (PDF)</a>
        </p>
      </div>
    </div>
  );
}
