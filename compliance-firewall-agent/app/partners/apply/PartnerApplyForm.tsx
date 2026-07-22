"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, CheckCircle2, ArrowRight } from "lucide-react";

/**
 * RPO / MSP partner application form.
 *
 * Posts to the (previously caller-less) POST /api/partners/apply route → writes
 * `partner_applications`, alerts the founder, and sends the branded applicant
 * welcome email. Before this component existed the /partners CTAs dumped every
 * RPO into the generic /contact form, so the structured backend never fired —
 * the "capability with no caller" dangling thread (tasks/lessons.md 2026-07-04).
 *
 * Honesty contract (tasks/lessons.md 2026-07-12): the form makes a REAL request
 * and only shows success on `res.ok && data.success`. On any failure it degrades
 * to the direct partner inbox — never a fake success that shreds the lead.
 */

type PartnerType = "referral" | "reseller" | "technology";

const PARTNER_TYPES: { value: PartnerType; label: string; hint: string }[] = [
  { value: "referral", label: "Referral partner", hint: "Refer clients, earn commission on each co-branded report" },
  { value: "reseller", label: "Reseller", hint: "Co-brand and resell the $499 report at $299 wholesale" },
  { value: "technology", label: "Technology / integration", hint: "Embed the compliant AI gateway inside your own product" },
];

const PARTNER_INBOX = "contact@houndshield.com";

export function PartnerApplyForm() {
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    partnerType: "referral" as PartnerType,
    clientCount: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Your name is required";
    if (!form.company.trim()) e.company = "Company is required";
    if (!form.email.trim()) e.email = "Work email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (form.clientCount.trim() && !/^\d{1,7}$/.test(form.clientCount.trim()))
      e.clientCount = "Enter a whole number of clients";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitError(null);

    // Only send clientCount when it's a real number — the route treats it as
    // optional and defaults to 0.
    const trimmedCount = form.clientCount.trim();
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      company: form.company.trim(),
      email: form.email.trim(),
      partnerType: form.partnerType,
      message: form.message.trim() || undefined,
    };
    if (trimmedCount) payload.clientCount = Number(trimmedCount);

    try {
      const res = await fetch("/api/partners/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setSubmitted(true);
        return;
      }
      // Never a fake success. If the application can't be recorded, hand the
      // applicant a working way to reach us instead of pretending it sent.
      setSubmitError(
        `We couldn't submit that just now. Please email your firm name and client base to ${PARTNER_INBOX} and we'll set up your partner kit within two business days.`
      );
    } catch {
      setSubmitError(`Network error. Please email us directly at ${PARTNER_INBOX} and we'll follow up.`);
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full bg-white border border-[var(--hs-border)] rounded-xl px-4 py-3 text-sm text-[var(--hs-ink)] placeholder-[var(--hs-ink-secondary)]/50 focus:outline-none focus:border-[var(--hs-steel)] focus:ring-1 focus:ring-[var(--hs-steel)]/30 transition-all duration-200";
  const labelCls =
    "text-xs font-medium text-[var(--hs-ink-secondary)] uppercase tracking-wider block mb-1.5 font-[var(--font-mono)]";

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-1)] p-8 text-center" role="status" aria-live="polite">
        <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-[var(--hs-success)]" />
        <h3 className="text-2xl font-bold text-[var(--hs-ink)]">Application received</h3>
        <p className="mx-auto mt-2 max-w-md text-[var(--hs-ink-secondary)]">
          Check your inbox for a confirmation. We&rsquo;ll review your firm and reach out within two
          business days with the wholesale agreement, the co-branded report kit, and a sample report.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/partners/kit"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--hs-steel-dark)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--hs-steel)]"
          >
            Read the full partner kit <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--hs-border)] px-6 py-3 text-sm font-semibold text-[var(--hs-ink)] transition hover:border-[var(--hs-steel)]"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-surface-1)] p-6 sm:p-8">
      <h2 className="font-[var(--font-display)] text-xl font-semibold text-[var(--hs-ink)]">
        Apply to the partner program
      </h2>
      <p className="mt-2 text-sm text-[var(--hs-ink-secondary)]">
        Tell us about your firm and client base. No exclusivity, no minimums — published $299
        wholesale terms.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pa-name" className={labelCls}>Your name *</label>
            <input
              id="pa-name"
              name="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
              placeholder="Jane Smith"
              aria-invalid={!!errors.name}
              autoComplete="name"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500" role="alert">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="pa-company" className={labelCls}>Company *</label>
            <input
              id="pa-company"
              name="company"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className={inputCls}
              placeholder="Summit Compliance LLC"
              aria-invalid={!!errors.company}
              autoComplete="organization"
            />
            {errors.company && <p className="mt-1 text-xs text-red-500" role="alert">{errors.company}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="pa-email" className={labelCls}>Work email *</label>
          <input
            id="pa-email"
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputCls}
            placeholder="jane@summitcompliance.com"
            aria-invalid={!!errors.email}
            autoComplete="email"
          />
          {errors.email && <p className="mt-1 text-xs text-red-500" role="alert">{errors.email}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pa-type" className={labelCls}>Partner type</label>
            <select
              id="pa-type"
              name="partnerType"
              value={form.partnerType}
              onChange={(e) => setForm({ ...form, partnerType: e.target.value as PartnerType })}
              className={`${inputCls} cursor-pointer appearance-none`}
            >
              {PARTNER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[var(--hs-ink-secondary)]">
              {PARTNER_TYPES.find((t) => t.value === form.partnerType)?.hint}
            </p>
          </div>
          <div>
            <label htmlFor="pa-clients" className={labelCls}>Clients you serve</label>
            <input
              id="pa-clients"
              name="clientCount"
              type="text"
              inputMode="numeric"
              value={form.clientCount}
              onChange={(e) => setForm({ ...form, clientCount: e.target.value })}
              className={inputCls}
              placeholder="e.g. 25"
              aria-invalid={!!errors.clientCount}
            />
            {errors.clientCount
              ? <p className="mt-1 text-xs text-red-500" role="alert">{errors.clientCount}</p>
              : <p className="mt-1 text-xs text-[var(--hs-ink-secondary)]">Optional — helps us size your enablement</p>}
          </div>
        </div>

        <div>
          <label htmlFor="pa-message" className={labelCls}>Anything else? (optional)</label>
          <textarea
            id="pa-message"
            name="message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            rows={4}
            className={`${inputCls} resize-none`}
            placeholder="Which verticals you serve (defense, healthcare, legal), any deadline-driven clients, questions on the wholesale terms…"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--hs-steel-dark)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--hs-steel)] disabled:opacity-60"
        >
          {loading
            ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            : <Send className="h-4 w-4" />}
          {loading ? "Submitting…" : "Submit application"}
        </button>

        {submitError && (
          <p className="text-sm text-red-500" role="alert">{submitError}</p>
        )}

        <p className="text-center text-xs text-[var(--hs-ink-secondary)]">
          C3PAOs are not eligible — assessors can&rsquo;t refer tools to clients they assess
          (32 CFR Part 170). This program is for RPOs, MSPs, MSSPs &amp; compliance consultancies.
        </p>
      </form>
    </div>
  );
}
