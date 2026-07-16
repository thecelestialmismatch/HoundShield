import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SprsInput } from '@/lib/customer/status'
import { ASSESSMENT_UPDATED_EVENT } from '@/lib/shieldready/events'

let sprsResult: SprsInput | null = null
vi.mock('@/lib/customer/client-status', () => ({
  computeSprsInput: () => sprsResult,
}))

import { AssessSnapshot } from '../AssessSnapshot'

const realSprs = (over: Partial<SprsInput> = {}): SprsInput => ({
  score: 55,
  completionPercent: 40,
  totalControls: 110,
  metCount: 30,
  partialCount: 8,
  unmetCount: 6,
  assessedCount: 44,
  topGaps: [
    { controlId: '3.8.3', title: 'Media sanitization', status: 'UNMET', deduction: 3, fix: 'Sanitize', hours: 2 },
    { controlId: '3.13.11', title: 'FIPS crypto', status: 'PARTIAL', deduction: 3, fix: 'Enable FIPS', hours: 6 },
  ],
  ...over,
})

describe('AssessSnapshot — the summary above the board tells the truth', () => {
  beforeEach(() => {
    sprsResult = null
  })

  it('public demo renders the sample posture, clearly labeled', () => {
    render(<AssessSnapshot live={false} />)
    expect(screen.getByText('+78')).toBeTruthy()
    expect(screen.getAllByText(/sample/i).length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText(/3\.8\.3 — Media sanitization/)).toBeTruthy()
    // The dishonest badge is gone — nothing here is "AI-ranked".
    expect(screen.queryByText(/AI-ranked/)).toBeNull()
  })

  it('live mode with no answers is honest: no score, no invented gaps', async () => {
    render(<AssessSnapshot live />)
    expect(await screen.findByText(/No controls answered yet/)).toBeTruthy()
    expect(screen.getByText('—')).toBeTruthy()
    expect(screen.queryByText('+78')).toBeNull()
    expect(screen.getByText(/Answer controls below/)).toBeTruthy()
  })

  it('live mode computes the ring + fastest wins from the operator’s own answers', async () => {
    sprsResult = realSprs()
    render(<AssessSnapshot live />)
    expect(await screen.findByText('+55')).toBeTruthy()
    expect(screen.getByText(/30 met/)).toBeTruthy()
    expect(screen.getByText(/3\.8\.3 — Media sanitization/)).toBeTruthy()
    expect(screen.getByText('impact-ranked')).toBeTruthy()
  })

  it('recomputes when the board below saves an answer (assessment-updated event)', async () => {
    sprsResult = null
    render(<AssessSnapshot live />)
    await screen.findByText(/No controls answered yet/)
    sprsResult = realSprs({ score: 61 })
    await act(async () => {
      window.dispatchEvent(new CustomEvent(ASSESSMENT_UPDATED_EVENT))
    })
    expect(await screen.findByText('+61')).toBeTruthy()
  })
})
