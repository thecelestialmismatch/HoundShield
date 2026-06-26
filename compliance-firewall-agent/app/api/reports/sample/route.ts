import { NextResponse } from "next/server";
import { generateCompliancePDF } from "@/lib/reports/pdf-generator";
import { buildSampleReportData } from "@/lib/reports/sample-data";

/**
 * GET /api/reports/sample
 *
 * Public, no-auth: serves a watermarked sample of the $499 CMMC AI Risk
 * Assessment Report (synthetic data only). This is the asset the /assessment
 * page and the RPO/MSP + HIPAA outreach emails link to. Cached at the edge.
 */
export const dynamic = "force-static";
export const revalidate = 86400;

export function GET() {
  const pdf = generateCompliancePDF(buildSampleReportData());
  // jsPDF returns a Node Buffer; hand its bytes to the Response as a Uint8Array.
  const bytes = new Uint8Array(pdf);

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'inline; filename="HoundShield-Sample-CMMC-AI-Risk-Assessment-Report.pdf"',
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
