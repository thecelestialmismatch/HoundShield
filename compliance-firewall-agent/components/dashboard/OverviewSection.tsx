'use client'

/**
 * One reorderable / hideable Overview section.
 *
 * Extracted from LiveCommandCenter so the signed-in operator dashboard
 * (OperatorOverview) and the anonymous demo can share one implementation of the
 * Customize affordance instead of growing a second, drifting copy.
 *
 * In normal view it just applies the user's saved display order (CSS `order`)
 * and drops itself if hidden; in Customize mode it wears a control strip (move
 * up / down / hide-show). The JSX SOURCE order in callers is unchanged — only
 * the rendered visual order moves — so every structure contract test that reads
 * those files keeps matching.
 */
import { ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react'
import { OVERVIEW_SECTIONS, type DashboardPrefs } from '@/lib/dashboard/use-dashboard-prefs'

export function Section({ id, prefs, editing, children }: {
  id: string
  prefs: DashboardPrefs
  editing: boolean
  children: React.ReactNode
}) {
  const hidden = prefs.isHidden(id)
  // Hidden sections vanish entirely in normal view; in edit mode they stay
  // (dimmed) so the operator can bring them back.
  if (hidden && !editing) return null
  const meta = OVERVIEW_SECTIONS.find((s) => s.id === id)
  const label = meta?.label ?? id
  return (
    <section className={`ovsec${hidden ? ' is-hidden' : ''}`} data-sec={id} style={{ order: prefs.orderOf(id) }} aria-label={label}>
      {editing && (
        <div className="secz">
          <span className="secz-name">{label}{hidden && <em> · hidden</em>}</span>
          <div className="secz-btns">
            <button type="button" aria-label={`Move ${label} up`} onClick={() => prefs.move(id, -1)}><ArrowUp aria-hidden /></button>
            <button type="button" aria-label={`Move ${label} down`} onClick={() => prefs.move(id, 1)}><ArrowDown aria-hidden /></button>
            <button type="button" aria-label={hidden ? `Show ${label}` : `Hide ${label}`} onClick={() => prefs.toggleHidden(id)}>
              {hidden ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
            </button>
          </div>
        </div>
      )}
      <div className="ovsec-body">{children}</div>
    </section>
  )
}
