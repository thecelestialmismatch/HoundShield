/**
 * Programmatic NIST 800-171 / CMMC control pages (/controls/[slug]).
 *
 * Every page is generated from the same 110-control dataset the ShieldReady
 * assessment engine ships (lib/shieldready/controls) — official text, plain
 * English, remediation steps, assessor evidence — so pages are substantive,
 * not thin doorway content. Each page also carries an HONEST AI-relevance
 * verdict: only the controls where AI prompt monitoring genuinely produces
 * evidence say so; the rest say so too. That honesty is enforced by
 * app/__tests__/controls-pages-contract.test.ts.
 */

import { ALL_CONTROLS, getControlsByFamily } from "@/lib/shieldready/controls";
import type { NISTControl } from "@/lib/shieldready/types";

// ─── Slugs ───────────────────────────────────────────────────────────────────

/** "AC.1.001" -> "ac-1-001" */
export function controlSlug(id: string): string {
  return id.toLowerCase().replace(/\./g, "-");
}

const BY_SLUG = new Map<string, NISTControl>(
  ALL_CONTROLS.map((c) => [controlSlug(c.id), c])
);

export const CONTROL_SLUGS: string[] = ALL_CONTROLS.map((c) => controlSlug(c.id));

export function getControlBySlug(slug: string): NISTControl | undefined {
  return BY_SLUG.get(slug);
}

/** Other controls in the same family (for internal linking), capped. */
export function relatedControls(control: NISTControl, limit = 6): NISTControl[] {
  return getControlsByFamily(control.family)
    .filter((c) => c.id !== control.id)
    .slice(0, limit);
}

// ─── AI-relevance verdicts (honest, curated — see contract test) ────────────

export type AiRelevance = "direct" | "supporting" | "none";

/**
 * Controls where a local AI prompt firewall DIRECTLY produces evidence:
 * the control's requirement is (in part) satisfied for the AI data path by
 * scanning/blocking prompts at the boundary and hash-chaining the log.
 */
export const AI_DIRECT: readonly string[] = [
  "AC.2.003", // Control CUI flow per authorizations
  "AC.2.020", // Verify and control connections to external systems
  "AC.2.022", // Control CUI posted to publicly accessible systems
  "AU.2.001", // Create and retain system audit logs
  "AU.2.002", // User accountability through unique identifiers
  "AU.2.008", // Protect audit information from unauthorized access
  "SC.1.001", // Monitor and protect communications at boundaries
];

/**
 * Controls where the prompt firewall SUPPORTS the practice — its event
 * stream and tamper-evident log feed the capability, but the control needs
 * more than AI monitoring to be met.
 */
export const AI_SUPPORTING: readonly string[] = [
  "IR.2.092", // Operational incident-handling capability
  "IR.2.093", // Track, document, and report incidents
  "SI.2.006", // Monitor systems for attacks
  "SI.2.007", // Identify unauthorized system use
  "AU.2.005", // Correlate audit review, analysis, and reporting
  "AU.2.006", // Audit record reduction and report generation
];

export function aiRelevance(id: string): AiRelevance {
  if (AI_DIRECT.includes(id)) return "direct";
  if (AI_SUPPORTING.includes(id)) return "supporting";
  return "none";
}

export function aiRelevanceCopy(control: NISTControl): {
  heading: string;
  body: string;
} {
  const verdict = aiRelevance(control.id);
  if (verdict === "direct") {
    return {
      heading: "Does AI prompt monitoring help with this control? Yes — directly.",
      body:
        `${control.id} is one of the requirements a local AI prompt firewall concretely evidences. ` +
        "When employees send prompts to ChatGPT, Copilot, or Claude, that traffic crosses your external boundary — " +
        "HoundShield inspects it on your own infrastructure (self-hosted Docker, Mode B), blocks CUI patterns before " +
        "transmission, and writes every allowed/blocked event to a SHA-256 hash-chained log attributable to the user. " +
        "Architecture diagram, active pattern set, and a log sample are the evidence an assessor tests this against " +
        "for the AI data path.",
    };
  }
  if (verdict === "supporting") {
    return {
      heading: "Does AI prompt monitoring help with this control? It supports it.",
      body:
        `AI prompt monitoring does not satisfy ${control.id} on its own, but its output feeds the capability this ` +
        "control requires: the tamper-evident event stream of allowed and blocked AI prompts becomes detection " +
        "signal, incident record, and reviewable audit material. Treat the AI firewall as one input to this " +
        "practice, alongside the remediation steps above.",
    };
  }
  return {
    heading: "Does AI prompt monitoring help with this control? Honestly, no.",
    body:
      `${control.id} is met through the remediation steps above, not through AI traffic controls — an AI prompt ` +
      "firewall neither satisfies nor substitutes for it. We map AI monitoring only to the controls it genuinely " +
      "evidences (flow control, boundary protection, audit, and incident support); for the full picture of where " +
      "it does help, see the mapping guide linked below.",
  };
}

// ─── Page metadata ───────────────────────────────────────────────────────────

export function controlMetaTitle(c: NISTControl): string {
  // e.g. "AC.2.003 — Control CUI Flow per Authorizations (NIST 800-171)"
  const base = `${c.id} — ${c.title}`;
  const suffix = " | NIST 800-171";
  return base.length + suffix.length <= 70 ? base + suffix : base;
}

export function controlMetaDescription(c: NISTControl): string {
  const lead = `${c.id} (${c.familyName}, CMMC Level ${c.cmmcLevel}): ${c.officialDescription}`;
  const trimmed = lead.length > 150 ? lead.slice(0, 149).trimEnd() + "…" : lead;
  return `${trimmed} Plain-English guide, remediation steps, and assessor evidence.`.slice(0, 300);
}
