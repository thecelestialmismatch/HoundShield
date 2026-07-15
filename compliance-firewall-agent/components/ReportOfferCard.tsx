import Link from "next/link";
import { Check, ShieldCheck, Clock, FileText } from "lucide-react";
import { ReportCheckoutButton } from "@/components/ReportCheckoutButton";

/**
 * The $499 CMMC AI Risk Assessment Report — the Stage-1 lead product — as a
 * proper offer card: pitch + what's-included on the left, an unmissable
 * price-and-buy panel on the right. Hermes-styled (see .report-offer in
 * app/hermes.css), so render it inside a `.hermes` page only.
 */
export function ReportOfferCard() {
  return (
    <div className="report-offer">
      <div className="report-offer-pitch">
        <span className="eyebrow">Start here · one-time report</span>
        <h2 className="display">CMMC AI Risk Assessment Report</h2>
        <p>
          Your staff are pasting sensitive data into ChatGPT and Copilot right now — with no
          audit trail. We scan 14 days of your real AI traffic locally and hand you the
          signed evidence your assessor asks for. No subscription, no procurement cycle.
        </p>
        <ul className="report-includes">
          <li>
            <Check />
            <span><b>14 days of real AI-traffic scanning</b> across 16 local detection engines (CUI · PHI · PII · ITAR)</span>
          </li>
          <li>
            <Check />
            <span><b>Every prompt event scored</b> against NIST 800-171 Rev 2 with your SPRS impact</span>
          </li>
          <li>
            <Check />
            <span><b>SHA-256 hash-chained audit trail</b> — tamper-evident, assessor-defensible</span>
          </li>
          <li>
            <Check />
            <span><b>C3PAO-ready PDF</b> plus a 30-minute readout of findings and next steps</span>
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
        <ReportCheckoutButton className="btn btn-primary report-buy-btn" label="Get your report" />
        <Link className="talk-first" href="/contact?topic=assessment-report">
          Talk to us first →
        </Link>
        <p className="fine">
          Fixed price. Yours to keep.{" "}
          <a href="/api/reports/sample">See a sample report (PDF)</a>
        </p>
      </div>
    </div>
  );
}
