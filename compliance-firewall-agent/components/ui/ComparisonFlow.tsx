import { Shield, AlertTriangle } from 'lucide-react'

export function ComparisonFlow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* Without HoundShield */}
      <div className="rounded-[var(--radius-xl)] border border-red-200 bg-red-50/50 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-orange-50 opacity-60" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-700 font-[var(--font-body)]">Without HoundShield</span>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Employee', color: 'bg-slate-200 text-slate-600' },
              { label: 'AI prompt', color: 'bg-slate-200 text-slate-600', arrow: true },
              { label: 'Cloud AI', color: 'bg-red-100 text-red-600', warning: true },
            ].map((step) => (
              <div key={step.label}>
                {step.arrow && (
                  <div className="flex justify-center my-1">
                    <div className="w-px h-4 bg-red-300" />
                  </div>
                )}
                <div className={`rounded-[var(--radius-md)] px-3 py-2 text-xs font-medium text-center font-[var(--font-body)] ${step.color} flex items-center justify-center gap-2`}>
                  {step.warning && <AlertTriangle className="w-3 h-3" />}
                  {step.label}
                  {step.warning && <span className="text-[10px] font-normal">(CUI exposed)</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-[11px] text-red-600 font-[var(--font-body)] space-y-1">
            <div className="flex items-center gap-1.5"><span className="text-red-400">✗</span> Sensitive data leaves your network</div>
            <div className="flex items-center gap-1.5"><span className="text-red-400">✗</span> No audit trail</div>
            <div className="flex items-center gap-1.5"><span className="text-red-400">✗</span> CMMC violation risk</div>
          </div>
        </div>
      </div>

      {/* With HoundShield */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--hs-border-strong)] bg-white p-6 relative overflow-hidden shadow-[var(--shadow-card)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--hs-surface-0)] to-[var(--hs-mist)] opacity-80" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-[var(--hs-steel-dark)]" />
            <span className="text-sm font-semibold text-[var(--hs-ink)] font-[var(--font-body)]">With HoundShield</span>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Employee', sub: null },
              { label: 'HoundShield', sub: 'scans locally <10ms', highlight: true },
              { label: 'Cloud AI', sub: 'clean prompts only' },
            ].map((step, i) => (
              <div key={step.label}>
                {i > 0 && (
                  <div className="flex justify-center my-1">
                    <div className={`w-px h-4 ${step.highlight ? 'bg-[var(--hs-steel)]' : 'bg-[var(--hs-border)]'}`} />
                  </div>
                )}
                <div
                  className={`rounded-[var(--radius-md)] px-3 py-2 text-xs font-medium text-center font-[var(--font-body)] flex flex-col items-center gap-0.5 ${
                    step.highlight
                      ? 'bg-[var(--hs-steel)] text-white'
                      : 'bg-[var(--hs-surface-1)] text-[var(--hs-ink-secondary)] border border-[var(--hs-border-subtle)]'
                  }`}
                >
                  <span>{step.label}</span>
                  {step.sub && (
                    <span className={`text-[10px] font-normal ${step.highlight ? 'text-white/80' : 'text-[var(--hs-ink-tertiary)]'}`}>
                      {step.sub}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-[11px] text-[var(--hs-ink-secondary)] font-[var(--font-body)] space-y-1">
            <div className="flex items-center gap-1.5"><span className="text-[var(--hs-success)]">✓</span> Data never leaves your network</div>
            <div className="flex items-center gap-1.5"><span className="text-[var(--hs-success)]">✓</span> Tamper-proof audit trail</div>
            <div className="flex items-center gap-1.5"><span className="text-[var(--hs-success)]">✓</span> CMMC Level 2 compliant</div>
          </div>
        </div>
      </div>
    </div>
  )
}
