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
  Mail,
} from "lucide-react";
import {
  scanForSnapshot,
  summarizeFindings,
  buildSnapshotReportData,
  splitPrompts,
  type SnapshotFinding,
} from "@/lib/reports/snapshot-from-scan";
import { CATEGORY_LABEL, CATEGORY_NIST_MAP } from "@/lib/reports/category-nist-map";
import { ReportCheckoutButton } from "@/components/ReportCheckoutButton";

type Vertical = "defense" | "healthcare" | "legal";
type Phase = "idle" | "scanned" | "generated";
type LeadStatus = "idle" | "sending" | "sent" | "error" | "unconfigured";

/** A defense-flavoured example that trips the real CMMC/PII/secret engines. */
const EXAMPLE_PROMPT = `Draft a status email to the PM about our Navy contract N00024-25-C-1234.
Reference CAGE code 1ABC2 and note the SPRS score.

The subcontractor sent employee John Smith (SSN 123-45-6789) for the ITAR-controlled
avionics work. Our AWS deploy key is AKIA1234567890ABCD12 — put it in the runbook.

CUI//SP-CTI: the radar cross-section figures must not leave the enclave.`;

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

interface LeadCaptureProps {
  vertical: Vertical;
  counts: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    totalMatches: number;
    promptsScanned: number;
    controls: string[];
  };
}

/**
 * Opt-in: emails the visitor their summary and alerts the founder to a warm
 * lead. Sends COUNTS ONLY — the pasted text and matched strings are never
 * transmitted (there is no field for them), preserving the local-only boundary.
 */
function LeadCapture({ vertical, counts }: LeadCaptureProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<LeadStatus>("idle");
  const [fallbackEmail, setFallbackEmail] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setStatus("sending");
    setFallbackEmail(null);
    try {
      const res = await fetch("/api/report/snapshot-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Counts only — never the pasted text.
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          company: company.trim() || undefined,
          vertical,
          criticalCount: counts.criticalCount,
          highCount: counts.highCount,
          mediumCount: counts.mediumCount,
          totalMatches: counts.totalMatches,
          promptsScanned: counts.promptsScanned,
          controls: counts.controls,
        }),
      });
      if (res.ok) {
        setStatus("sent");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 503 && data?.fallbackEmail) {
        setFallbackEmail(String(data.fallbackEmail));
        setStatus("unconfigured");
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="glass-card p-5 border-[rgba(5,150,105,0.25)]">
        <div className="flex items-center gap-2 text-[var(--hs-success)]">
          <CheckCircle2 className="w-5 h-5" />
          <p className="text-sm font-bold">Sent — check your inbox.</p>
        </div>
        <p className="text-xs text-[var(--hs-ink-secondary)] mt-2">
          We emailed you this summary and gave our team a heads-up. Your pasted text was never sent.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-brand-700" />
        <p className="text-sm font-bold text-[var(--hs-ink)]">Email me this snapshot + a human review</p>
      </div>
      <p className="text-xs text-[var(--hs-ink-secondary)]">
        We send you the summary above and alert our team to reach out.{" "}
        <strong className="text-[var(--hs-ink-secondary)]">Your pasted text is never transmitted</strong> — only the finding counts.
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        <label className="sr-only" htmlFor="lead-name">Name</label>
        <input
          id="lead-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          required
          className="bg-white border border-[var(--hs-border)] rounded-lg px-3 py-2 text-sm text-[var(--hs-ink)] placeholder:text-[var(--hs-ink-tertiary)] focus:outline-none focus:border-brand-500/50"
        />
        <label className="sr-only" htmlFor="lead-email">Work email</label>
        <input
          id="lead-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Work email"
          required
          className="bg-white border border-[var(--hs-border)] rounded-lg px-3 py-2 text-sm text-[var(--hs-ink)] placeholder:text-[var(--hs-ink-tertiary)] focus:outline-none focus:border-brand-500/50"
        />
      </div>
      <label className="sr-only" htmlFor="lead-company">Company</label>
      <input
        id="lead-company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="Company (optional)"
        className="w-full bg-white border border-[var(--hs-border)] rounded-lg px-3 py-2 text-sm text-[var(--hs-ink)] placeholder:text-[var(--hs-ink-tertiary)] focus:outline-none focus:border-brand-500/50"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-all disabled:opacity-60"
      >
        {status === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        {status === "sending" ? "Sending…" : "Email me the snapshot"}
      </button>
      {status === "error" && (
        <p className="text-xs text-rose-600" role="alert">
          Something went wrong. Please try again or email us directly.
        </p>
      )}
      {status === "unconfigured" && fallbackEmail && (
        <p className="text-xs text-[var(--hs-ink-secondary)]" role="alert">
          Email delivery is briefly unavailable — reach us at{" "}
          <a className="text-brand-700 font-medium" href={`mailto:${fallbackEmail}`}>{fallbackEmail}</a>.
        </p>
      )}
    </form>
  );
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

      <div className="flex items-center justify-between mb-1">
        <label htmlFor="snapshot-input" className="text-xs font-semibold text-[var(--hs-ink-secondary)]">
          Prompt text
        </label>
        <button
          type="button"
          onClick={() => resetOnEdit(EXAMPLE_PROMPT)}
          className="text-xs text-brand-700 hover:text-brand-800 font-medium"
        >
          Load an example
        </button>
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
          <Radar className="w-4 h-4" /> Scan locally
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
                  return (
                    <li key={f.patternName} className="glass-card p-3 flex flex-wrap items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${s.dot}`} aria-hidden="true" />
                      <span className="text-sm font-semibold text-[var(--hs-ink)]">{f.patternName}</span>
                      <span className="text-[11px] text-[var(--hs-ink-tertiary)]">×{f.count}</span>
                      <span className="text-[11px] text-[var(--hs-ink-secondary)]">{CATEGORY_LABEL[f.category]}</span>
                      <span className="text-[11px] font-mono text-brand-700">{control.control}</span>
                      <span className={`ml-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${s.badge}`}>
                        {wouldLabel(f.action)}
                      </span>
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
                      {phase === "generated" ? "Download again" : "Generate my gap-report PDF"}
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
