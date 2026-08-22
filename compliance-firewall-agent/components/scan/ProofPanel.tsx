"use client";

import { useState } from "react";
import { CheckCircle2, Download, ShieldCheck, WifiOff, AlertTriangle } from "lucide-react";
import { SCAN_TOKENS, type ScanTheme } from "./theme";
import type { NetworkWitnessReport } from "./useNetworkWitness";
import type { LocalScanResult } from "@/lib/scan/local-engine";

/**
 * The "nothing left this device" evidence panel.
 *
 * Everything here is a MEASUREMENT of the scan that just ran, not a promise
 * about scans in general. That distinction is the whole point: a buyer
 * evaluating a compliance tool discounts prose and checks instruments, and this
 * is the instrument. If the local-only guarantee ever broke, the number in this
 * panel would change on its own.
 *
 * The receipt is deliberately counts-only, mirroring the boundary the lead
 * endpoint enforces — the artifact that proves nothing was transmitted must not
 * itself become the thing that transmits it.
 */

interface ProofPanelProps {
  theme: ScanTheme;
  witness: NetworkWitnessReport | null;
  result: LocalScanResult;
  /** Where the scan ran, recorded in the receipt so it is self-describing. */
  surface: string;
}

/** SHA-256 via Web Crypto — available in every browser this app supports. */
async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function ProofPanel({ theme, witness, result, surface }: ProofPanelProps) {
  const t = SCAN_TOKENS[theme];
  const [hash, setHash] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);

  const clean = witness !== null && witness.count === 0;

  /**
   * Build a receipt the founder (or a buyer) can re-hash independently.
   *
   * COUNTS ONLY. No pasted text, no matched value, no redacted preview — the
   * receipt records what was FOUND, never what was read. A "proof of privacy"
   * file that carried the private data would be the most embarrassing possible
   * version of this feature.
   */
  const download = async () => {
    setBuilding(true);
    try {
      const body = {
        artifact: "HoundShield local-scan proof receipt",
        version: 1,
        surface,
        generated_at: new Date().toISOString(),
        network: {
          calls_observed_during_scan: witness?.count ?? null,
          observed: witness?.calls ?? [],
          window_ms: witness ? Math.round(witness.windowMs) : null,
          note:
            "Counted by wrapping fetch, XMLHttpRequest, navigator.sendBeacon and WebSocket for the duration of the scan.",
        },
        scan: {
          patterns_checked: result.patternsChecked,
          scan_ms: Math.round(result.scanMs * 1000) / 1000,
          finding_types: result.findings.length,
          critical: result.summary.criticalCount,
          high: result.summary.highCount,
          medium: result.summary.mediumCount,
          total_matches: result.summary.totalMatches,
          nist_controls: result.summary.controls,
          estimated_sprs_impact: result.summary.estimatedSprsImpact,
          categories: result.coverage.map((c) => ({
            category: c.category,
            patterns_matched: c.matched,
            occurrences: c.occurrences,
          })),
          findings: result.findings.map((f) => ({
            pattern: f.patternName,
            category: f.category,
            risk: f.risk,
            action: f.action,
            count: f.count,
            found_via: f.foundVia,
          })),
        },
        privacy:
          "Counts and classifications only. No prompt text, matched value, or redacted preview is included in this file.",
      };
      const json = JSON.stringify(body, null, 2);
      const digest = await sha256(json);
      setHash(digest);

      // Same-origin blob; nothing is uploaded to produce it.
      const blob = new Blob([`${json}\n`], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "houndshield-local-scan-proof.json";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className={`glass-card p-5 border ${clean ? "border-[rgba(5,150,105,0.25)]" : t.border}`}>
      <div className="flex items-start gap-3">
        <ShieldCheck
          className={`w-6 h-6 shrink-0 ${clean ? "text-[var(--hs-success)]" : t.inkTertiary}`}
        />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${t.ink}`}>Proof this stayed on your device</p>

          {/* The measurement. */}
          <div className={`mt-3 rounded-lg p-3 ${t.subtleBg}`}>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className={`text-2xl font-black ${clean ? "text-[var(--hs-success)]" : "text-rose-500"}`}>
                {witness ? witness.count : "—"}
              </span>
              <span className={`text-xs ${t.inkSecondary}`}>
                network call{witness?.count === 1 ? "" : "s"} during this scan
              </span>
            </div>
            <p className={`text-[11px] mt-1.5 leading-relaxed ${t.inkTertiary}`}>
              Measured by wrapping <code className="font-mono">fetch</code>,{" "}
              <code className="font-mono">XMLHttpRequest</code>,{" "}
              <code className="font-mono">navigator.sendBeacon</code> and{" "}
              <code className="font-mono">WebSocket</code> for the {witness ? Math.round(witness.windowMs) : 0}ms
              the scan ran. Not a badge — a count that would change by itself if this stopped being true.
            </p>
          </div>

          {/* Anything observed is shown, never summarised away. */}
          {witness && witness.count > 0 && (
            <div className="mt-2 rounded-lg p-3 bg-rose-500/10 border border-rose-500/30">
              <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Requests observed — inspect these
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {witness.calls.map((c, i) => (
                  <li key={`${c.api}-${i}`} className={`text-[10px] font-mono break-all ${t.inkSecondary}`}>
                    {c.api} → {c.url}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ul className={`mt-3 space-y-1.5 text-[11px] ${t.inkSecondary}`}>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 mt-px shrink-0 text-[var(--hs-success)]" />
              <span>
                Findings show the pattern <strong>name</strong> and its NIST control — never the value
                that matched.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <WifiOff className="w-3.5 h-3.5 mt-px shrink-0 text-[var(--hs-success)]" />
              <span>
                <strong>Check it yourself:</strong> once this page has loaded, disconnect from the
                network and scan again. It still works, because the engine is already on your machine.
              </span>
            </li>
          </ul>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={download}
              disabled={building}
              className="btn-ghost text-[11px] px-3 py-1.5 inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Download proof receipt
            </button>
            {hash && (
              <span className={`text-[10px] font-mono break-all ${t.inkTertiary}`}>
                SHA-256 {hash.slice(0, 16)}…
              </span>
            )}
          </div>
          {hash && (
            <p className={`text-[10px] mt-1.5 leading-relaxed ${t.inkTertiary}`}>
              Re-hash the saved file to confirm it is the one this page produced:{" "}
              <code className="font-mono">shasum -a 256 houndshield-local-scan-proof.json</code>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
