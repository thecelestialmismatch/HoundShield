import { ShieldAlert } from 'lucide-react'

interface DeploymentBoundaryNoteProps {
  /** Extra classes for outer spacing. */
  className?: string
}

/**
 * Deployment-mode honesty banner.
 *
 * The hosted Vercel plane is NOT FedRAMP-authorized and is non-CUI-only; the
 * CUI-safe guarantee holds only in self-hosted Docker (Mode B) or air-gapped
 * (Mode C), where prompt content is scanned locally and never leaves the
 * customer network. Rendered on the CUI-claim-adjacent public pages
 * (/security, /brain-ai); a condensed one-liner also lives in the global
 * footer so the disclosure is present site-wide.
 *
 * This is a compliance statement, not marketing copy — keep the wording exact.
 */
export function DeploymentBoundaryNote({ className = '' }: DeploymentBoundaryNoteProps) {
  return (
    <aside
      role="note"
      className={`flex items-start gap-3 rounded-2xl border border-[var(--hs-border)] bg-[var(--hs-mist)] p-5 ${className}`}
    >
      <ShieldAlert
        className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--hs-steel-dark)]"
        aria-hidden
      />
      <p className="text-sm leading-relaxed text-[var(--hs-ink-secondary)]">
        <span className="font-semibold text-[var(--hs-ink)]">Deployment boundary.</span>{' '}
        This hosted site is for demos and non-CUI evaluation only — it runs on Vercel, which is
        not FedRAMP-authorized. For CUI, PHI, or other regulated data, run HoundShield
        self-hosted in Docker (Mode&nbsp;B) or air-gapped (Mode&nbsp;C), where every prompt is
        scanned locally and never leaves your network.
      </p>
    </aside>
  )
}
