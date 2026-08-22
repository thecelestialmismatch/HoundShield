"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import type { Vertical } from "@/components/snapshot/types";

type LeadStatus = "idle" | "sending" | "sent" | "error" | "unconfigured";

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
export function LeadCapture({ vertical, counts }: LeadCaptureProps) {
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