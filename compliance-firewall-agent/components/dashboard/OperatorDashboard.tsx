'use client'

/**
 * The after-login dashboard, rendered INSIDE the `(tools)` shell.
 *
 * Founder direction 2026-07-31: "I still want all of these features and the
 * dashboard home section should look like these" — sent with screenshots of the
 * 23-item Command Center sidebar. That sidebar is `(tools)/layout.tsx`, and
 * until now the dashboard was the one page that escaped it: `LiveCommandCenter`
 * ships its own `hs-lcc` shell with a rival 10-item sidebar, so "Dashboard Home"
 * and "Overview" both navigated OUT of the navigation. Two sidebars, two mental
 * models, and the deep tool pages only reachable from one of them.
 *
 * This component is the fix. It mounts `OperatorOverview` — the same real-data
 * panels, unchanged — with no shell of its own, so the `(tools)` sidebar stays
 * on screen and every one of those 23 destinations is one click from the
 * dashboard.
 *
 * WHY THE `hs-lcc` WRAPPER IS STILL HERE, and must stay:
 *
 * `LCC_CSS` is the panel stylesheet, and every rule in it is scoped `.hs-lcc …`
 * (`.hs-lcc .panel`, `.hs-lcc .op-matrix`, `.hs-lcc .row`…). The class is not
 * decoration — drop it and the Overview renders as unstyled divs. It also
 * declares the `--panel/--line/--ok/--bad/--brand` custom properties the panels
 * read. The sidebar grid is a SEPARATE class (`.hs-lcc .shell`) which this
 * component never renders, which is exactly why the wrapper can travel into
 * another shell without bringing a second sidebar with it.
 *
 * `hs-embedded` then neutralises the two rules that assume the wrapper owns the
 * viewport — the fixed-attachment gradient background and the min-height. The
 * `(tools)` shell already paints the page.
 */

import { useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { SlidersHorizontal, RotateCcw, Wand2 } from 'lucide-react'
import { LCC_CSS } from './lccStyles'
import { OperatorOverview } from './OperatorOverview'
import { ProvenancePanel } from './ProvenancePanel'
import { BrainQuickAsk, FirstRunChecklist } from './operator/OperatorSlots'
import { getThemeById, consoleThemeVars } from '@/lib/dashboard/design-themes'
import { useDashboardPrefs, SIGNED_IN_STRIPPED_HIDDEN } from '@/lib/dashboard/use-dashboard-prefs'
import type { ProvenanceId } from './dataProvenance'

/**
 * Where the Overview's CTAs actually go, now that they are routes rather than
 * in-page tabs.
 *
 * Each target is a page that already exists in the `(tools)` group — verified
 * against `app/command-center/(tools)/` rather than assumed. A CTA pointing at a
 * 404 is worse than no CTA, and the empty-state panels lean on these: an
 * operator with no telemetry sees "Open settings", and that has to land on the
 * proxy URL they need.
 */
const TAB_ROUTES: Record<'assess' | 'settings' | 'feed' | 'reports', string> = {
  assess: '/command-center/shield/assessment',
  settings: '/command-center/settings',
  feed: '/command-center/realtime',
  reports: '/command-center/shield/reports',
}

/** Brain AI's home in this shell is the Compliance AI page. */
const BRAIN_ROUTE = '/command-center/chat'

export function OperatorDashboard({ name, connected = false }: {
  /** First name, for the Brain AI card's greeting. Display only. */
  name?: string | null
  /**
   * Does this operator's gateway have any events yet? Drives the checklist's
   * completed steps — a real signal, never a constant. See FirstRunChecklist.
   */
  connected?: boolean
}) {
  const router = useRouter()
  // Empty stripped-set: the signed-in panels are real data now, so there is
  // nothing dishonest to hide. See SIGNED_IN_STRIPPED_HIDDEN's own comment.
  const prefs = useDashboardPrefs(SIGNED_IN_STRIPPED_HIDDEN)
  const [customizing, setCustomizing] = useState(false)
  const [prov, setProv] = useState<ProvenanceId | null>(null)
  const theme = getThemeById(prefs.themeId)

  const go = (tab: 'assess' | 'settings' | 'feed' | 'reports') => router.push(TAB_ROUTES[tab])

  return (
    <div
      className="hs-lcc hs-embedded"
      data-theme={theme.id}
      data-mode={theme.mode}
      style={consoleThemeVars(theme) as CSSProperties}
    >
      <style dangerouslySetInnerHTML={{ __html: LCC_CSS }} />

      {/* Customize is free for everyone and saved per device. It lived on the
          old shell's toolbar; without this button the reorder/hide machinery
          (and the prefs it persists) would be unreachable from the dashboard
          that actually ships. */}
      <div className="op-tools">
        <button
          type="button"
          className="btn btn-g btn-sm"
          aria-pressed={customizing}
          onClick={() => setCustomizing((v) => !v)}
        >
          <Wand2 aria-hidden /> {customizing ? 'Done customizing' : 'Customize'}
        </button>
      </div>

      {customizing && (
        <div className="custz">
          <SlidersHorizontal className="custz-ic" aria-hidden />
          <span>Customize mode — reorder or hide sections. Saved on this device, free for everyone.</span>
          <button type="button" className="custz-btn ghost" onClick={prefs.reset}><RotateCcw aria-hidden /> Reset</button>
          <button type="button" className="custz-btn" onClick={() => setCustomizing(false)}>Done</button>
        </div>
      )}

      <OperatorOverview
        name={name}
        prefs={prefs}
        editing={customizing}
        onSource={setProv}
        onTab={go}
        brainSlot={<BrainQuickAsk name={name} onAsk={(q) => router.push(`${BRAIN_ROUTE}?q=${encodeURIComponent(q)}`)} />}
        checklistSlot={<FirstRunChecklist connected={connected} onStep={go} />}
      />

      {/* live: this dashboard only ever renders behind the auth gate, so every
          figure in it is the operator's own — the dialog must describe real
          sources, never the demo seeds. */}
      <ProvenancePanel
        id={prov}
        live
        onClose={() => setProv(null)}
        onOpenSettings={() => go('settings')}
      />
    </div>
  )
}
