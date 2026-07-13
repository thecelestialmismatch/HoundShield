import AssessmentBoard from "@/components/dashboard/AssessmentBoard";

/**
 * Standalone 110-control CMMC self-assessment route. The board itself lives in
 * `components/dashboard/AssessmentBoard` so the exact same assessment can also
 * render inline on the after-login `/console` dashboard from one source of truth.
 */
export default function AssessmentPage() {
  return <AssessmentBoard />;
}
