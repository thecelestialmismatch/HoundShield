"use client";

import { useState } from "react";
import {
  FileText, Lock, Radar, ShieldCheck,
} from "lucide-react";
import { scanLocal, MAX_INPUT_CHARS, type LocalScanResult } from "@/lib/scan/local-engine";
import { SAMPLE_SCENARIOS, SNAPSHOT_CONTROLS } from "@/components/snapshot/samples";
import type { Vertical } from "@/components/snapshot/types";
import { LeadCapture } from "@/components/snapshot/LeadCapture";
import { ReportCheckoutButton } from "@/components/ReportCheckoutButton";
import { SCAN_TOKENS, type ScanTheme } from "./theme";
import { FindingList } from "./FindingList";
import { ProofPanel } from "./ProofPanel";
import { useNetworkWitness, type NetworkWitnessReport } from "./useNetworkWitness";

/**
 * The local scanner, rendered on BOTH surfaces.
 *
 * Public `/demo` passes `commerce` so the visitor lands on the locked report and
 * the $499 CTA — the demo script mandates the demo always end on the report. The after-login
 * `/command-center/scanner` omits it: a paying customer does not need to be sold
 * the thing they bought, and the page is a tool rather than a funnel.
 *
 * The engine, the proof panel and every finding row are identical in both.
 */

type Phase = "idle" | "scanned";

interface LocalScanPanelProps {
  theme: ScanTheme;
  /** Show the locked full-report preview, $499 CTA and lead capture. Public demo only. */
  commerce?: boolean;
  heading?: string;
  intro?: string;
  /** Recorded in the proof receipt so the artifact says where it came from. */
  surface: string;
}

export function LocalScanPanel({
  theme, commerce = false, heading, intro, surface,
}: LocalScanPanelProps) {
  const t = SCAN_TOKENS[theme];
  const { watch } = useNetworkWitness();

  const [inputText, setInputText] = useState("");
  const [org, setOrg] = useState("");
  const [vertical, setVertical] = useState<Vertical>("defense");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<LocalScanResult | null>(null);
  const [witness, setWitness] = useState<NetworkWitnessReport | null>(null);
  const [showRedacted, setShowRedacted] = useState(false);

  const runScan = async () => {
    if (!inputText.trim()) return;
    // The scan runs INSIDE the witness window, so the number the proof panel
    // reports covers exactly the interval the pasted text was being processed.
    const { result: scanned, report } = await watch(() => scanLocal(inputText));
    setResult(scanned);
    setWitness(report);
    setPhase("scanned");
  };


  const resetOnEdit = (value: string) => {
    setInputText(value);
    if (phase !== "idle") setPhase("idle");
    setShowRedacted(false);
  };

  const loadSample = (sample: (typeof SAMPLE_SCENARIOS)[number]) => {
    resetOnEdit(sample.text);
    setVertical(sample.vertical);
  };

  const summary = result?.summary;
  const over = inputText.length > MAX_INPUT_CHARS;

  return (
    <section id="snapshot" aria-labelledby="scan-heading" className="glass-card p-6 md:p-8">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
          <ShieldCheck className={`w-5 h-5 ${t.accent}`} />
        </div>
        <div>
          <h2 id="scan-heading" className={`text-2xl font-extrabold tracking-tight ${t.ink}`}>
            {heading ?? "Generate your CMMC AI risk snapshot"}
          </h2>
          <p className={`text-sm mt-1 max-w-2xl ${t.inkTertiary}`}>
            {intro ??
              "Paste a real prompt your team sends to ChatGPT, Claude or Copilot. HoundShield's detection engines scan it locally, in your browser, map every finding to a NIST 800-171 control, and preview exactly what the full $499 report contains."}
          </p>
        </div>
      </div>

      <div className={`flex items-center gap-2 text-xs mb-4 ${t.inkSecondary}`}>
        <Lock className="w-3.5 h-3.5 text-[var(--hs-success)]" />
        Your text is never sent anywhere — the scan runs entirely on this device.
      </div>

      {commerce && (
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label htmlFor="scan-org" className={`block text-xs font-semibold mb-1 ${t.inkSecondary}`}>
              Organization (optional — appears on the PDF)
            </label>
            <input
              id="scan-org"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              placeholder="Acme Defense LLC"
              className={`w-full ${t.inputBg} border ${t.border} rounded-lg px-3 py-2 text-sm ${t.ink} focus:outline-none focus:border-brand-500/50`}
            />
          </div>
          <div>
            <label htmlFor="scan-vertical" className={`block text-xs font-semibold mb-1 ${t.inkSecondary}`}>
              Industry
            </label>
            <select
              id="scan-vertical"
              value={vertical}
              onChange={(e) => setVertical(e.target.value as Vertical)}
              className={`w-full ${t.inputBg} border ${t.border} rounded-lg px-3 py-2 text-sm ${t.ink} focus:outline-none focus:border-brand-500/50`}
            >
              <option value="defense">Defense / CMMC</option>
              <option value="healthcare">Healthcare / HIPAA</option>
              <option value="legal">Legal</option>
            </select>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <label htmlFor="snapshot-input" className={`text-xs font-semibold ${t.inkSecondary}`}>
          Prompt text
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-[11px] ${t.inkTertiary}`}>Try a real scenario:</span>
          {SAMPLE_SCENARIOS.map((sample) => (
            <button
              key={sample.name}
              type="button"
              onClick={() => loadSample(sample)}
              className={`text-[11px] font-medium px-2 py-1 rounded-lg border ${t.border} ${t.accent} hover:border-brand-500/40 hover:bg-brand-500/5 transition-colors`}
            >
              {sample.name}
            </button>
          ))}
        </div>
      </div>
      <textarea
        id="snapshot-input"
        value={inputText}
        onChange={(e) => resetOnEdit(e.target.value)}
        placeholder="Paste a prompt, code snippet, or message here…"
        rows={8}
        className={`w-full ${t.inputBg} border ${t.border} rounded-xl p-4 text-sm font-mono ${t.mono} focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 resize-none`}
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runScan}
          disabled={!inputText.trim() || over}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Radar className="w-4 h-4" /> {SNAPSHOT_CONTROLS.scan}
        </button>
        <span className={`text-[11px] ${t.inkTertiary}`}>
          {inputText.length.toLocaleString()} / {MAX_INPUT_CHARS.toLocaleString()} characters
        </span>
      </div>

      {over && (
        <p className="mt-2 text-xs text-rose-500">
          That paste is {inputText.length.toLocaleString()} characters — above the{" "}
          {MAX_INPUT_CHARS.toLocaleString()} limit this scanner accepts. Trim it and scan again. (The
          deployed proxy has no such limit; it streams.)
        </p>
      )}

      <div aria-live="polite">
        {phase !== "idle" && result && summary && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat theme={theme} label="Critical" value={summary.criticalCount} tone="critical" />
              <Stat theme={theme} label="High" value={summary.highCount} tone="high" />
              <Stat theme={theme} label="Medium" value={summary.mediumCount} tone="medium" />
              <Stat
                theme={theme}
                label="Local scan"
                value={`${Math.max(1, Math.round(result.scanMs))}ms`}
                tone="neutral"
              />
            </div>

            <div className={`text-xs ${t.inkSecondary}`}>
              {result.findings.length} finding type{result.findings.length === 1 ? "" : "s"} across{" "}
              {result.perPrompt.length} prompt{result.perPrompt.length === 1 ? "" : "s"} · checked{" "}
              <strong>{result.patternsChecked} patterns</strong> · maps to{" "}
              <strong>
                {summary.controls.length} NIST 800-171 control{summary.controls.length === 1 ? "" : "s"}
              </strong>{" "}
              · estimated SPRS exposure{" "}
              <strong className="text-rose-500">{summary.estimatedSprsImpact} pts</strong>
            </div>

            {result.coverage.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {result.coverage.map((c) => (
                  <span
                    key={c.category}
                    className={`text-[11px] px-2 py-1 rounded-lg border ${t.border} ${t.inkSecondary}`}
                  >
                    {c.label} · {c.matched} pattern{c.matched === 1 ? "" : "s"} · {c.occurrences} match
                    {c.occurrences === 1 ? "" : "es"}
                  </span>
                ))}
              </div>
            )}

            <FindingList findings={result.findings} theme={theme} />

            {result.findings.length > 0 && (
              <div className="glass-card p-4">
                <button
                  type="button"
                  onClick={() => setShowRedacted((v) => !v)}
                  className={`text-xs font-semibold ${t.accent}`}
                >
                  {showRedacted ? "Hide" : "Show"} redacted preview
                </button>
                <p className={`text-[11px] mt-1 ${t.inkTertiary}`}>
                  Your paste with every match replaced in place. Shows you <em>where</em> the exposure
                  is without this page ever rendering the value.
                </p>
                {showRedacted && (
                  <pre
                    className={`mt-3 p-3 rounded-lg ${t.subtleBg} text-[11px] font-mono whitespace-pre-wrap break-words max-h-64 overflow-y-auto ${t.mono}`}
                  >
                    {result.redacted}
                  </pre>
                )}
              </div>
            )}

            <ProofPanel theme={theme} witness={witness} result={result} surface={surface} />

            {commerce && (
              <>
                {/* The scan above is the free teaser. The assessor-ready report is
                    shown but LOCKED — the buyer sees exactly what $499 unlocks
                    rather than being handed a report-shaped PDF for nothing. */}
                <div className="relative overflow-hidden rounded-2xl border border-[var(--hs-border)]">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none select-none blur-[5px] opacity-70 p-6 space-y-4 bg-white"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--hs-border)] pb-3">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-brand-700">
                          CMMC Level 2 · AI Gateway Audit
                        </p>
                        <p className="text-lg font-black text-[var(--hs-ink)]">
                          AI Risk Assessment Report
                        </p>
                        <p className="text-xs text-[var(--hs-ink-secondary)]">
                          {org.trim() || "Your Organization"} · 14-day assessment window
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase text-[var(--hs-ink-secondary)]">
                          SPRS impact
                        </p>
                        <p className="text-2xl font-black text-rose-600">
                          {summary.estimatedSprsImpact} pts
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] font-mono uppercase tracking-wide text-[var(--hs-ink-secondary)]">
                      NIST 800-171 control mapping
                    </p>
                    <div className="h-2 rounded bg-[var(--hs-mist)]" />
                    <div className="h-2 w-3/4 rounded bg-[var(--hs-mist)]" />
                    <div className="h-2 w-1/2 rounded bg-[var(--hs-mist)]" />
                    <p className="text-[11px] font-mono uppercase tracking-wide text-[var(--hs-ink-secondary)] pt-1">
                      Tamper-evident audit trail · SHA-256 Merkle root
                    </p>
                    <div className="h-2 w-2/3 rounded bg-[var(--hs-mist)]" />
                  </div>

                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center bg-gradient-to-b from-white/50 via-white/80 to-white/95">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--hs-ink)] text-white flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </div>
                    <p className="text-base font-black text-[var(--hs-ink)]">
                      Your full CMMC AI Risk Assessment Report
                    </p>
                    <p className="text-xs text-[var(--hs-ink-secondary)] max-w-md">
                      Every finding mapped to NIST 800-171, your SPRS impact, a SHA-256
                      tamper-evident audit trail, and a prioritized remediation plan — the
                      assessor-ready PDF, generated from a 14-day run in your own environment.
                    </p>
                    <ReportCheckoutButton
                      vertical={vertical}
                      label="Unlock the full report — $499"
                    />
                    <p className="text-[11px] text-[var(--hs-ink-tertiary)] max-w-sm flex items-center gap-1.5 justify-center">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      The scan above is a local preview — not the tamper-evident 14-day signed
                      report an assessor accepts.
                    </p>
                  </div>
                </div>

                {result.findings.length > 0 && (
                  <LeadCapture
                    vertical={vertical}
                    counts={{
                      criticalCount: summary.criticalCount,
                      highCount: summary.highCount,
                      mediumCount: summary.mediumCount,
                      totalMatches: summary.totalMatches,
                      promptsScanned: result.perPrompt.length,
                      controls: summary.controls,
                    }}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({
  label, value, tone, theme,
}: {
  label: string;
  value: number | string;
  tone: "critical" | "high" | "medium" | "neutral";
  theme: ScanTheme;
}) {
  const t = SCAN_TOKENS[theme];
  const color =
    tone === "critical" ? "text-rose-500" : tone === "neutral" ? t.ink : t.accent;
  return (
    <div className="glass-card p-3 text-center">
      <div className={`text-[11px] uppercase font-semibold ${t.inkSecondary}`}>{label}</div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
    </div>
  );
}
