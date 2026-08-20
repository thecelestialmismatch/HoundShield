"use client";

import { useState } from "react";
import {
  ShieldCheck,
  FileText,
  Radar,
  Lock,
  AlertTriangle,
  Download,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  scanForSnapshot,
  summarizeFindings,
  buildSnapshotReportData,
  splitPrompts,
  type SnapshotFinding,
} from "@/lib/reports/snapshot-from-scan";
import {
  CATEGORY_LABEL,
  CATEGORY_NIST_MAP,
  CATEGORY_REMEDIATION,
} from "@/lib/reports/category-nist-map";
import { ReportCheckoutButton } from "@/components/ReportCheckoutButton";

import { LeadCapture } from "@/components/snapshot/LeadCapture";
import type { Vertical } from "@/components/snapshot/types";
import { SAMPLE_SCENARIOS, SNAPSHOT_CONTROLS } from "@/components/snapshot/samples";

type Phase = "idle" | "scanned" | "generated";

function severityStyle(risk: SnapshotFinding["risk"]): { badge: string; dot: string } {
  if (risk === "CRITICAL") {
    return { badge: "bg-rose-500/15 text-rose-600 border-rose-500/30", dot: "bg-rose-500" };
  }
  if (risk === "HIGH") {
    return { badge: "bg-brand-500/15 text-brand-700 border-brand-500/30", dot: "bg-brand-500" };
  }
  return { badge: "bg-[var(--hs-mist)] text-[var(--hs-ink-secondary)] border-[var(--hs-border)]", dot: "bg-[var(--hs-steel)]" };
}

function wouldLabel(action: SnapshotFinding["action"]): string {
  return action === "BLOCK" ? "Would be blocked" : "Would be flagged";
}


/**
 * Instant AI Risk Snapshot — the money-path climax of the demo.
 *
 * Paste → LOCAL scan with the product's real detection engines → on-screen
 * NIST-mapped findings → download a branded PREVIEW gap-report PDF → $499 CTA.
 * The pasted text is scanned and rendered to PDF entirely in the browser; it is
 * never transmitted. This both honours the local-only boundary and is a live
 * demonstration of it.
 */
export function InstantSnapshot() {
  const [inputText, setInputText] = useState("");
  const [org, setOrg] = useState("");
  const [vertical, setVertical] = useState<Vertical>("defense");
  const [phase, setPhase] = useState<Phase>("idle");
  const [findings, setFindings] = useState<SnapshotFinding[]>([]);
  const [scanMs, setScanMs] = useState(0);
  const [generating, setGenerating] = useState(false);

  const summary = findings.length > 0 ? summarizeFindings(findings) : null;
  const promptsScanned = splitPrompts(inputText).length;

  const runScan = () => {
    if (!inputText.trim()) return;
    const start = performance.now();
    const found = scanForSnapshot(inputText);
    const elapsed = performance.now() - start;
    setFindings(found);
    setScanMs(elapsed);
    setPhase("scanned");
  };

  const generatePdf = async () => {
    setGenerating(true);
    try {
      // jsPDF (~130 kB) is loaded on demand — only when the visitor actually
      // generates a PDF — so the top-of-funnel /demo page stays light.
      const { saveComplianceReport } = await import("@/lib/reports/download");
      const data = buildSnapshotReportData(inputText, {
        organization: org,
        scanMs,
      });
      saveComplianceReport(data, "HoundShield-AI-Risk-Snapshot.pdf");
      setPhase("generated");
    } finally {
      setGenerating(false);
    }
  };

  const resetOnEdit = (value: string) => {
    setInputText(value);
    if (phase !== "idle") setPhase("idle");
  };

  /**
   * Load a scenario AND switch the industry selector to match it, so the PDF
   * and the $499 CTA describe the same vertical the visitor just chose. Picking
   * a healthcare sample while the form still says "defense" would put the wrong
   * framing on the artifact the demo is supposed to end on.
   */
  const loadSample = (sample: (typeof SAMPLE_SCENARIOS)[number]) => {
    resetOnEdit(sample.text);
    setVertical(sample.vertical);
  };

  return (
    <section id="snapshot" aria-labelledby="snapshot-heading" className="glass-card p-6 md:p-8">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-brand-700" />
        </div>
        <div>
          <h2 id="snapshot-heading" className="text-2xl font-extrabold tracking-tight text-[var(--hs-ink)]">
            Generate your CMMC AI risk snapshot
          </h2>
          <p className="text-sm text-[var(--hs-ink-tertiary)] mt-1 max-w-2xl">
            Paste a real prompt your team sends to ChatGPT, Claude or Copilot. HoundShield&apos;s
            detection engines scan it <strong className="text-[var(--hs-ink-secondary)]">locally, in your browser</strong>,
            map every finding to a NIST 800-171 control, and produce a preview gap-report PDF.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-[var(--hs-ink-secondary)] mb-4">
        <Lock className="w-3.5 h-3.5 text-[var(--hs-success)]" />
        Your text is never sent anywhere — the scan and the PDF are generated entirely on this device.
      </div>

      {/* Inputs */}
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label htmlFor="snapshot-org" className="block text-xs font-semibold text-[var(--hs-ink-secondary)] mb-1">
            Organization (optional — appears on the PDF)
          </label>
          <input
            id="snapshot-org"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            placeholder="Acme Defense LLC"
            className="w-full bg-white border border-[var(--hs-border)] rounded-lg px-3 py-2 text-sm text-[var(--hs-ink)] placeholder:text-[var(--hs-ink-tertiary)] focus:outline-none focus:border-brand-500/50"
          />
        </div>
        <div>
          <label htmlFor="snapshot-vertical" className="block text-xs font-semibold text-[var(--hs-ink-secondary)] mb-1">
            Industry
          </label>
          <select
            id="snapshot-vertical"
            value={vertical}
            onChange={(e) => setVertical(e.target.value as Vertical)}
            className="w-full bg-white border border-[var(--hs-border)] rounded-lg px-3 py-2 text-sm text-[var(--hs-ink)] focus:outline-none focus:border-brand-500/50"
          >
            <option value="defense">Defense / CMMC</option>
            <option value="healthcare">Healthcare / HIPAA</option>
            <option value="legal">Legal</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <label htmlFor="snapshot-input" className="text-xs font-semibold text-[var(--hs-ink-secondary)]">
          Prompt text
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-[var(--hs-ink-tertiary)]">Try a real scenario:</span>
          {SAMPLE_SCENARIOS.map((sample) => (
            <button
              key={sample.name}
              type="button"
              onClick={() => loadSample(sample)}
              className="text-[11px] font-medium px-2 py-1 rounded-lg border border-[var(--hs-border)] text-brand-700 hover:border-brand-500/40 hover:bg-brand-500/5 transition-colors"
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
        className="w-full bg-white border border-[var(--hs-border)] rounded-xl p-4 text-sm font-mono text-[var(--hs-ink)] placeholder:text-[var(--hs-ink-tertiary)] focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 resize-none"
      />

      <div className="mt-3">
        <button
          type="button"
          onClick={runScan}
          disabled={!inputText.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Radar className="w-4 h-4" /> {SNAPSHOT_CONTROLS.scan}
        </button>
      </div>

      {/* Results */}
      <div aria-live="polite">
        {phase !== "idle" && summary && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Critical" value={summary.criticalCount} tone="critical" />
              <Stat label="High" value={summary.highCount} tone="high" />
              <Stat label="Medium" value={summary.mediumCount} tone="medium" />
              <Stat label="Local scan" value={`${Math.max(1, Math.round(scanMs))}ms`} tone="neutral" />
            </div>

            <div className="text-xs text-[var(--hs-ink-secondary)]">
              {summary.findings.length} finding type{summary.findings.length === 1 ? "" : "s"} across{" "}
              {promptsScanned} prompt{promptsScanned === 1 ? "" : "s"} · maps to{" "}
              <strong className="text-[var(--hs-ink-secondary)]">{summary.controls.length} NIST 800-171 control{summary.controls.length === 1 ? "" : "s"}</strong>{" "}
              · estimated SPRS exposure{" "}
              <strong className="text-rose-600">{summary.estimatedSprsImpact} pts</strong>
            </div>

            {summary.findings.length === 0 ? (
              <div className="glass-card p-4 flex items-center gap-2 text-[var(--hs-success)]">
                <CheckCircle2 className="w-4 h-4" />
                <p className="text-sm font-medium">No sensitive data detected in this text.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {summary.findings.map((f) => {
                  const s = severityStyle(f.risk);
                  const control = CATEGORY_NIST_MAP[f.category];
                  const fix = CATEGORY_REMEDIATION[f.category];
                  return (
                    <li key={f.patternName} className="glass-card p-0 overflow-hidden">
                      {/* Native <details> rather than a useState toggle — the
                          browser already does disclosure, including keyboard
                          and screen-reader semantics. */}
                      <details className="group">
                        <summary className="p-3 flex flex-wrap items-center gap-2 cursor-pointer list-none">
                          <span className={`w-2 h-2 rounded-full ${s.dot}`} aria-hidden="true" />
                          <span className="text-sm font-semibold text-[var(--hs-ink)]">{f.patternName}</span>
                          <span className="text-[11px] text-[var(--hs-ink-tertiary)]">×{f.count}</span>
                          <span className="text-[11px] text-[var(--hs-ink-secondary)]">{CATEGORY_LABEL[f.category]}</span>
                          <span className="text-[11px] font-mono text-brand-700">{control.control}</span>
                          <span className={`ml-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${s.badge}`}>
                            {wouldLabel(f.action)}
                          </span>
                          <span className="text-[11px] text-brand-700 font-medium group-open:hidden">How to fix</span>
                          <span className="text-[11px] text-[var(--hs-ink-tertiary)] font-medium hidden group-open:inline">Hide</span>
                        </summary>
                        <div className="px-3 pb-3 pt-0 space-y-2 border-t border-[var(--hs-border)] mt-0">
                          <p className="text-[11px] text-[var(--hs-ink-tertiary)] pt-2">
                            <strong className="text-[var(--hs-ink-secondary)]">Control · {control.control}</strong>{" "}
                            {control.name}
                          </p>
                          <p className="text-[11px] text-[var(--hs-ink-secondary)] leading-relaxed">
                            <strong className="text-[var(--hs-ink-secondary)]">Why it matters. </strong>
                            {fix.impact}
                          </p>
                          <p className="text-[11px] text-[var(--hs-ink-secondary)] leading-relaxed">
                            <strong className="text-[var(--hs-ink-secondary)]">Quick fix. </strong>
                            {fix.quickFix}
                          </p>
                          <p className="text-[11px] text-[var(--hs-ink-secondary)] leading-relaxed">
                            <strong className="text-[var(--hs-ink-secondary)]">Permanent fix. </strong>
                            {fix.permanentFix}
                          </p>
                        </div>
                      </details>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* The mandated climax: end on the PDF. */}
            <div className="glass-card p-5 border-brand-500/20">
              <div className="flex items-start gap-3">
                <FileText className="w-6 h-6 text-brand-700 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-[var(--hs-ink)]">Your gap-report PDF</p>
                  <p className="text-xs text-[var(--hs-ink-secondary)] mt-1">
                    A branded preview mapped to NIST 800-171 — built in your browser.{" "}
                    <span className="text-[var(--hs-ink-tertiary)]">
                      This is a preview, not the tamper-evident 14-day signed report an assessor accepts.
                    </span>
                  </p>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={generatePdf}
                      disabled={generating}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--hs-ink)] text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-60"
                    >
                      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      {phase === "generated" ? "Download again" : SNAPSHOT_CONTROLS.generatePdf}
                    </button>
                  </div>
                  {phase === "generated" && (
                    <p className="mt-2 text-xs text-[var(--hs-success)] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Your snapshot PDF was generated on this device.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* $499 CTA — the real deliverable */}
            <div className="glass-card p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--hs-ink-secondary)]">
                  This preview shows exposure. The{" "}
                  <strong className="text-[var(--hs-ink)]">$499 CMMC AI Risk Assessment Report</strong>{" "}
                  runs 14 days in your environment and delivers the SHA-256-signed PDF your assessor accepts.
                </p>
              </div>
              <ReportCheckoutButton vertical={vertical} label="Get the $499 report" className="shrink-0" />
            </div>

            {summary.findings.length > 0 && (
              <LeadCapture
                vertical={vertical}
                counts={{
                  criticalCount: summary.criticalCount,
                  highCount: summary.highCount,
                  mediumCount: summary.mediumCount,
                  totalMatches: summary.totalMatches,
                  promptsScanned,
                  controls: summary.controls,
                }}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "critical" | "high" | "medium" | "neutral";
}) {
  const color =
    tone === "critical"
      ? "text-rose-600"
      : tone === "neutral"
        ? "text-[var(--hs-ink)]"
        : "text-brand-700";
  return (
    <div className="glass-card p-3 text-center">
      <div className="text-[11px] uppercase font-semibold text-[var(--hs-ink-secondary)]">{label}</div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
    </div>
  );
}
