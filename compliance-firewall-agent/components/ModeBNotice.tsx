import { ShieldAlert, Server, Cloud } from "lucide-react";

/**
 * ModeBNotice — the architecture-honesty disclosure required everywhere a buyer
 * evaluates HoundShield for CUI workloads.
 *
 * The truth this enforces (per the HERMES brain): the hosted trial endpoint runs
 * on Vercel, which is NOT FedRAMP-authorized. CUI-safety holds ONLY in Mode B
 * (Docker on the customer's own infrastructure). We surface this BEFORE a defense
 * sales conversation rather than letting a C3PAO assessor discover it.
 *
 * Light-mode (marketing) styling using --hs- tokens.
 *
 * Variants:
 *   - "full"   : standalone card with the three deployment modes (pricing, security)
 *   - "inline" : compact one-line banner (partner page, hero footers)
 */
export function ModeBNotice({
  variant = "full",
  className = "",
}: {
  variant?: "full" | "inline";
  className?: string;
}) {
  if (variant === "inline") {
    return (
      <div
        className={`flex items-start gap-3 rounded-xl border border-[var(--hs-border)] bg-[var(--hs-surface-1)] px-4 py-3 ${className}`}
        role="note"
      >
        <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--hs-steel-dark)]" aria-hidden />
        <p className="text-xs leading-relaxed text-[var(--hs-ink-secondary)]">
          <strong className="text-[var(--hs-ink)]">CUI-safe = Mode B (Docker on your infrastructure).</strong>{" "}
          The hosted trial runs on Vercel and is <strong>not FedRAMP-authorized</strong> — use it for
          non-CUI evaluation only.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-[var(--hs-border)] bg-white p-6 shadow-sm ${className}`}
      role="note"
    >
      <div className="mb-4 flex items-center gap-2.5">
        <ShieldAlert className="h-5 w-5 text-[var(--hs-steel-dark)]" aria-hidden />
        <h3 className="text-base font-semibold text-[var(--hs-ink)]">
          Handling CUI? Run Mode B.
        </h3>
      </div>
      <p className="mb-5 max-w-2xl text-sm leading-relaxed text-[var(--hs-ink-secondary)]">
        HoundShield scans prompts locally in under 10ms. That CUI-safe property holds only when the
        scanner runs inside your own boundary. Pick the deployment mode that matches your data:
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--hs-border-subtle)] bg-[var(--hs-surface-1)] p-4">
          <Cloud className="mb-2 h-4 w-4 text-[var(--hs-ink-tertiary)]" aria-hidden />
          <p className="text-sm font-semibold text-[var(--hs-ink)]">A · Hosted trial</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--hs-ink-secondary)]">
            On Vercel — <strong>not FedRAMP-authorized</strong>. Demo and non-CUI evaluation only.
          </p>
        </div>
        <div className="rounded-xl border border-[rgba(5,150,105,0.3)] bg-[rgba(5,150,105,0.06)] p-4">
          <Server className="mb-2 h-4 w-4 text-[var(--hs-success)]" aria-hidden />
          <p className="text-sm font-semibold text-[var(--hs-ink)]">B · Self-hosted Docker</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--hs-ink-secondary)]">
            Your own infrastructure. <strong>CUI-safe</strong> — prompt content never leaves your
            boundary. Right for CUI-handling contractors.
          </p>
        </div>
        <div className="rounded-xl border border-[rgba(5,150,105,0.3)] bg-[rgba(5,150,105,0.06)] p-4">
          <Server className="mb-2 h-4 w-4 text-[var(--hs-success)]" aria-hidden />
          <p className="text-sm font-semibold text-[var(--hs-ink)]">C · Air-gapped</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--hs-ink-secondary)]">
            Isolated network. <strong>CUI-safe</strong>. For enterprise / IL-5+ environments.
          </p>
        </div>
      </div>
    </div>
  );
}
