import { buildComplianceDoc, type ReportData } from "./pdf-generator";

/**
 * Browser-only: build the compliance PDF and trigger a download via jsPDF's
 * native `save()`. Shares `buildComplianceDoc` with the server buffer path so
 * the layout is identical; kept in its own module so the Node route
 * (`/api/reports/sample`) never pulls the `save()` (DOM) code path.
 */
export function saveComplianceReport(data: ReportData, filename: string): void {
  buildComplianceDoc(data).save(filename);
}
