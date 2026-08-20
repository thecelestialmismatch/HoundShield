import Link from "next/link";
import { Check, Clock, FileText, ShieldCheck } from "lucide-react";
import { ReportCheckoutButton } from "@/components/ReportCheckoutButton";

/**
 * Public assessment-engagement framing.
 *
 * This card deliberately describes a scoped review process rather than promising
 * universal traffic coverage, a fixed observation period, assessor acceptance,
 * delivery timing, or a data boundary that depends on customer deployment.
 */
export function ReportOfferCard() {
  return (
    <div className="report-offer">
      <div className="report-offer-pitch">
        <span className="eyebrow">Start here · scoped assessment</span>
        <h2 className="display">AI Risk Assessment</h2>
        <p>
          Review a defined AI workflow, its control boundary, and the assessment materials needed for your internal
          evidence process. Scope, compatible integrations, deployment mode, retention, and commercial terms are
          confirmed before sensitive data or production traffic is used.
        </p>
        <ul className="report-includes">
          <li>
            <Check />
            <span><b>Scoped workflow review</b> for compatible traffic intentionally routed through an agreed customer-operated deployment</span>
          </li>
          <li>
            <Check />
            <span><b>Policy and control mapping</b> to support your assessment against applicable NIST 800-171 and HIPAA considerations</span>
          </li>
          <li>
            <Check />
            <span><b>Reviewable decision records</b> with integrity and provenance information where supported by the selected deployment</span>
          </li>
          <li>
            <Check />
            <span><b>Assessment materials</b> with findings, assumptions, scope, limitations, and recommended next actions for your review</span>
          </li>
        </ul>
        <div className="report-trust">
          <span><ShieldCheck /> Sensitive workflows require a reviewed customer-operated deployment</span>
          <span><Clock /> Scope and timeline confirmed before engagement</span>
          <span><FileText /> Review the deployment and data boundary before purchase</span>
        </div>
      </div>

      <div className="report-offer-buy">
        <div className="price-tag">$499</div>
        <div className="price-sub">assessment engagement · scope confirmed first</div>
        <ReportCheckoutButton className="btn btn-primary report-buy-btn" label="Start assessment engagement — $499" />
        <Link className="talk-first" href="/contact?topic=assessment-report">
          Confirm scope before purchase →
        </Link>
        <p className="fine">
          Confirm the selected deployment, data boundary, scope, timeline, and commercial terms before using sensitive
          data or production traffic. <a href="/api/reports/sample">See an illustrative sample report (PDF)</a>
        </p>
      </div>
    </div>
  );
}
