'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react'

type HealthPayload = {
  services?: Record<string, string>
  degraded?: string[]
}

type ReadinessItem = {
  key: string
  label: string
  healthy: string[]
  help: string
}

const READINESS_ITEMS: ReadinessItem[] = [
  { key: 'rate_limit_store', label: 'Shared rate limits', healthy: ['shared'], help: 'Apply the shared limiter migration before relying on a single global ceiling.' },
  { key: 'auth_lockout_store', label: 'Account lockout', healthy: ['enforcing'], help: 'Apply the lockout migration so repeated failures are not forgotten between instances.' },
  { key: 'captcha', label: 'CAPTCHA escalation', healthy: ['enforcing'], help: 'Set the Turnstile secret and site key before handling challenged authentication attempts.' },
  { key: 'reset_code_pepper', label: 'Recovery-code protection', healthy: ['set'], help: 'Set the dedicated recovery-code pepper before enabling password reset in production.' },
  { key: 'quarantine_encryption', label: 'Quarantine encryption', healthy: ['enabled'], help: 'Set a valid 64-hex encryption key so sensitive quarantine writes remain available.' },
]

/**
 * A post-login operator panel backed only by `/api/health`. It reports control
 * state, never values: no secret, provider token, email, prompt, or audit data
 * enters the browser. Unknown data stays unknown rather than being rendered as a
 * reassuring green success state.
 */
export function OperationalReadiness({ onOpenSettings }: { onOpenSettings: () => void }) {
  const [payload, setPayload] = useState<HealthPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [checkedAt, setCheckedAt] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const response = await fetch('/api/health', { cache: 'no-store' })
      if (!response.ok) throw new Error('health request failed')
      const next = (await response.json()) as HealthPayload
      setPayload(next)
      setCheckedAt(Date.now())
    } catch {
      setPayload(null)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const services = payload?.services ?? {}
  const readyCount = READINESS_ITEMS.filter((item) => item.healthy.includes(services[item.key] ?? '')).length
  const degradedCount = payload?.degraded?.length ?? 0

  return (
    <div className="panel">
      <div className="ph">
        <div>
          <h3><ShieldCheck style={{ width: 16, height: 16, verticalAlign: -3, marginRight: 6 }} />Operational readiness</h3>
          <p className="mono" style={{ marginTop: 5 }}>
            {loading ? 'Checking live control state…' : error ? 'Control state could not be loaded' : `${readyCount}/${READINESS_ITEMS.length} core controls ready · ${degradedCount} system conditions need attention`}
          </p>
        </div>
        <button type="button" className="btn btn-g btn-sm" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw aria-hidden /> Refresh
        </button>
      </div>

      <div className="pad" style={{ display: 'grid', gap: 10 }}>
        {error ? (
          <div className="op-banner is-err" role="status"><AlertTriangle aria-hidden /> Health data is unavailable. Do not assume controls are active; refresh or check deployment settings.</div>
        ) : READINESS_ITEMS.map((item) => {
          const status = services[item.key]
          const ready = item.healthy.includes(status ?? '')
          return (
            <div key={item.key} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <div>
                <strong style={{ display: 'block', fontSize: 13 }}>{item.label}</strong>
                <span className="mono" style={{ display: 'block', marginTop: 3, opacity: 0.75 }}>
                  {loading ? 'Checking…' : ready ? 'Ready' : status ? `${status.replace(/_/g, ' ')}` : 'Unknown'}
                </span>
                {!loading && !ready && <span style={{ display: 'block', marginTop: 4, fontSize: 12, opacity: 0.8 }}>{item.help}</span>}
              </div>
              <span className={`chip${ready ? '' : ' warn'}`} aria-label={ready ? `${item.label} ready` : `${item.label} needs attention`}>
                {ready ? 'Ready' : 'Review'}
              </span>
            </div>
          )
        })}
      </div>

      <div className="pad" style={{ paddingTop: 0, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <span className="mono" style={{ opacity: 0.7 }}>{checkedAt ? `Checked ${new Date(checkedAt).toLocaleTimeString()}` : 'No result yet'}</span>
        <button type="button" className="btn btn-g btn-sm" onClick={onOpenSettings}>Open settings <ArrowRight aria-hidden /></button>
      </div>
    </div>
  )
}
