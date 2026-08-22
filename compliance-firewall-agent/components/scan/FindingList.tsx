"use client";

import { CheckCircle2, EyeOff } from "lucide-react";
import {
  CATEGORY_LABEL,
  CATEGORY_NIST_MAP,
  CATEGORY_REMEDIATION,
  sprsImpactForRisk,
  isDcsaReportable,
} from "@/lib/reports/category-nist-map";
import type { LocalFinding } from "@/lib/scan/local-engine";
import { SCAN_TOKENS, severityStyle, type ScanTheme } from "./theme";

/**
 * One row per detected pattern, expandable to the guidance behind it.
 *
 * Everything rendered here was already computed by the engine and previously
 * thrown away: the control's full NAME (not just its id), the SPRS delta, the
 * DCSA-reportable flag, the block-vs-flag verdict, and whether the match was
 * only visible after decoding. Surfacing it is the difference between "we found
 * an SSN" and "we found an SSN, here is the control it implicates, here is what
 * it costs your score, and here is what to do about it".
 *
 * Native `<details>` rather than a `useState` toggle: the browser already does
 * disclosure, including keyboard and screen-reader semantics.
 */

function foundViaNote(via: LocalFinding["foundVia"]): string | null {
  if (via === "base64") return "Only visible after base64-decoding — a plain text search would miss this.";
  if (via === "hex") return "Only visible after hex-decoding — a plain text search would miss this.";
  return null;
}

export function FindingList({
  findings,
  theme,
}: {
  findings: LocalFinding[];
  theme: ScanTheme;
}) {
  const t = SCAN_TOKENS[theme];

  if (findings.length === 0) {
    return (
      <div className="glass-card p-4 flex items-center gap-2 text-[var(--hs-success)]">
        <CheckCircle2 className="w-4 h-4" />
        <p className="text-sm font-medium">No sensitive data detected in this text.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {findings.map((f) => {
        const s = severityStyle(f.risk, theme);
        const control = CATEGORY_NIST_MAP[f.category];
        const fix = CATEGORY_REMEDIATION[f.category];
        const sprs = sprsImpactForRisk(f.risk);
        const dcsa = isDcsaReportable(f.category, f.risk);
        const via = foundViaNote(f.foundVia);

        return (
          <li key={f.patternName} className="glass-card p-0 overflow-hidden">
            <details className="group">
              <summary className="p-3 flex flex-wrap items-center gap-2 cursor-pointer list-none">
                <span className={`w-2 h-2 rounded-full ${s.dot}`} aria-hidden="true" />
                <span className={`text-sm font-semibold ${t.ink}`}>{f.patternName}</span>
                <span className={`text-[11px] ${t.inkTertiary}`}>×{f.count}</span>
                <span className={`text-[11px] ${t.inkSecondary}`}>{CATEGORY_LABEL[f.category]}</span>
                <span className={`text-[11px] font-mono ${t.accent}`}>{control.control}</span>
                {sprs !== 0 && (
                  <span className="text-[11px] font-mono text-rose-500">{sprs} SPRS</span>
                )}
                {f.foundVia !== "plain" && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border bg-amber-500/15 text-amber-500 border-amber-500/30">
                    {f.foundVia}
                  </span>
                )}
                {dcsa && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border bg-rose-500/15 text-rose-500 border-rose-500/30">
                    DCSA reportable
                  </span>
                )}
                <span
                  className={`ml-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${s.badge}`}
                >
                  {f.action === "BLOCK" ? "Would be blocked" : "Would be flagged"}
                </span>
                <span className={`text-[11px] font-medium group-open:hidden ${t.accent}`}>How to fix</span>
                <span className={`text-[11px] font-medium hidden group-open:inline ${t.inkTertiary}`}>
                  Hide
                </span>
              </summary>

              <div className={`px-3 pb-3 pt-2 space-y-2 border-t ${t.border}`}>
                {via && (
                  <p className="text-[11px] leading-relaxed text-amber-500 flex items-start gap-1.5">
                    <EyeOff className="w-3.5 h-3.5 mt-px shrink-0" />
                    <span>{via}</span>
                  </p>
                )}
                <p className={`text-[11px] ${t.inkTertiary}`}>
                  <strong className={t.inkSecondary}>Control · {control.control}</strong> {control.name}
                </p>
                <p className={`text-[11px] leading-relaxed ${t.inkSecondary}`}>
                  <strong>Why it matters. </strong>
                  {fix.impact}
                </p>
                <p className={`text-[11px] leading-relaxed ${t.inkSecondary}`}>
                  <strong>Quick fix. </strong>
                  {fix.quickFix}
                </p>
                <p className={`text-[11px] leading-relaxed ${t.inkSecondary}`}>
                  <strong>Permanent fix. </strong>
                  {fix.permanentFix}
                </p>
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
