import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import {
  PROVENANCE,
  PROVENANCE_IDS,
  KIND_META,
  resolveProvenance,
  type ProvenanceId,
  type ProvenanceKind,
} from '../dataProvenance'

/**
 * The provenance registry is the console's honesty ledger: click any number
 * and it must answer where that number comes from. These tests make the
 * ledger's claims a CONTRACT — every simulated entry must say how it becomes
 * live, live variants must be complete, and every id a component opens must
 * actually exist in the registry.
 */

const VALID_KINDS: ProvenanceKind[] = ['simulated', 'on-device', 'account', 'product']

describe('dataProvenance — registry completeness', () => {
  it('registers at least the full dashboard surface area', () => {
    expect(PROVENANCE_IDS.length).toBeGreaterThanOrEqual(18)
  })

  it('every entry carries a metric, explanation, source and update mechanics', () => {
    for (const id of PROVENANCE_IDS) {
      const e = PROVENANCE[id]
      expect(e.metric.length, id).toBeGreaterThan(3)
      expect(e.what.length, id).toBeGreaterThan(10)
      expect(e.source.length, id).toBeGreaterThan(10)
      expect(e.updates.length, id).toBeGreaterThan(5)
      expect(VALID_KINDS, id).toContain(e.kind)
    }
  })

  it('every SIMULATED entry says how it becomes the operator’s own data', () => {
    for (const id of PROVENANCE_IDS) {
      const e = PROVENANCE[id]
      if (e.kind === 'simulated') {
        expect(e.liveWhen, `${id} is simulated but has no path to live data`).toBeTruthy()
        expect(e.liveWhen!.length, id).toBeGreaterThan(20)
      }
    }
  })

  it('every entry with a live kind-switch carries the live source variant', () => {
    for (const id of PROVENANCE_IDS) {
      const e = PROVENANCE[id]
      if (e.kindLive) {
        expect(VALID_KINDS, id).toContain(e.kindLive)
        expect(e.sourceLive, `${id} switches kind for viewers but has no sourceLive`).toBeTruthy()
      }
    }
  })

  it('every kind used has display metadata (label + blurb)', () => {
    for (const k of VALID_KINDS) {
      expect(KIND_META[k].label.length).toBeGreaterThan(3)
      expect(KIND_META[k].blurb.length).toBeGreaterThan(20)
    }
  })

  it('no entry ever claims cloud processing — the local-only boundary holds in the copy', () => {
    for (const id of PROVENANCE_IDS) {
      const e = PROVENANCE[id]
      const text = [e.source, e.sourceLive, e.liveWhen].filter(Boolean).join(' ')
      expect(text, id).not.toMatch(/scanned in (the|our) cloud|uploaded to our servers/i)
    }
  })
})

describe('dataProvenance — resolveProvenance (demo vs signed-in)', () => {
  it('demo path returns the simulated description with the go-live step', () => {
    const r = resolveProvenance('scans-24h', false)
    expect(r.kind).toBe('simulated')
    expect(r.source).toMatch(/SCANS_24H/)
    expect(r.liveWhen).toMatch(/Settings → Proxy URL/)
  })

  it('signed-in usage meters resolve to the ACCOUNT variant — never demo seeds', () => {
    const demo = resolveProvenance('usage-scans', false)
    expect(demo.kind).toBe('simulated')
    expect(demo.source).toMatch(/demo seed/i)
    const live = resolveProvenance('usage-scans', true)
    expect(live.kind).toBe('account')
    expect(live.source).toMatch(/nothing is simulated for your account/i)
  })

  it('signed-in assessment resolves to the ON-DEVICE variant', () => {
    const live = resolveProvenance('assessment', true)
    expect(live.kind).toBe('on-device')
    expect(live.source).toMatch(/local storage/i)
    expect(live.source).toMatch(/nothing is uploaded/i)
  })

  it('non-simulated resolutions drop the "become live" step — it is already theirs', () => {
    expect(resolveProvenance('assessment', true).liveWhen).toBeUndefined()
    expect(resolveProvenance('usage-brain', false).liveWhen).toBeUndefined()
    expect(resolveProvenance('product-stats', false).liveWhen).toBeUndefined()
  })

  it('simulated-for-everyone surfaces stay simulated even when signed in', () => {
    expect(resolveProvenance('sprs-score', true).kind).toBe('simulated')
    expect(resolveProvenance('threat-feed', true).kind).toBe('simulated')
  })
})

describe('dataProvenance — every id the console opens exists in the registry', () => {
  const dash = path.resolve(__dirname, '..')
  const sources = [
    'LiveCommandCenter.tsx',
    'OverviewCharts.tsx',
    'AssessSnapshot.tsx',
  ].map((f) => readFileSync(path.join(dash, f), 'utf8')).join('\n')

  const referenced = new Set<string>()
  for (const m of sources.matchAll(/setProv\('([a-z0-9-]+)'\)/g)) referenced.add(m[1])
  for (const m of sources.matchAll(/<SourceChip\s+id="([a-z0-9-]+)"/g)) referenced.add(m[1])
  for (const m of sources.matchAll(/sourceId="([a-z0-9-]+)"/g)) referenced.add(m[1])

  it('found the provenance references in the components', () => {
    expect(referenced.size).toBeGreaterThanOrEqual(15)
  })

  it('every referenced id resolves (no dead dialogs)', () => {
    for (const id of referenced) {
      expect(PROVENANCE_IDS, `component opens '${id}' but the registry has no such entry`).toContain(id as ProvenanceId)
    }
  })

  it('every registered id is reachable from a component (no orphan entries)', () => {
    for (const id of PROVENANCE_IDS) {
      expect([...referenced], `registry entry '${id}' is never opened by any surface`).toContain(id)
    }
  })
})
