import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ProvenancePanel, SourceChip } from '../ProvenancePanel'

describe('SourceChip — honest affordance', () => {
  it('renders a real button with a dialog hint when a handler exists', () => {
    const onSource = vi.fn()
    render(<SourceChip id="scans-24h" onSource={onSource} className="mono">sample</SourceChip>)
    const btn = screen.getByRole('button', { name: 'sample' })
    expect(btn.getAttribute('aria-haspopup')).toBe('dialog')
    expect(btn.className).toContain('src-chip')
    fireEvent.click(btn)
    expect(onSource).toHaveBeenCalledWith('scans-24h')
  })

  it('degrades to a plain span without a handler — NEVER a button that does nothing', () => {
    render(<SourceChip id="scans-24h" className="mono">sample</SourceChip>)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('sample').tagName).toBe('SPAN')
  })
})

describe('ProvenancePanel — the "where does this number come from?" dialog', () => {
  it('renders nothing when no surface is selected', () => {
    const { container } = render(<ProvenancePanel id={null} live={false} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('answers what / where-from / how-it-updates for the selected surface', () => {
    render(<ProvenancePanel id="scans-24h" live={false} onClose={() => {}} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(screen.getByText('Prompts scanned (24h)')).toBeTruthy()
    expect(screen.getByText('Simulated demo data')).toBeTruthy()
    expect(screen.getByText('What this is')).toBeTruthy()
    expect(screen.getByText('Where it comes from')).toBeTruthy()
    expect(screen.getByText('How it updates')).toBeTruthy()
    // The exact origin is named, not hand-waved.
    expect(screen.getByText(/SCANS_24H/)).toBeTruthy()
  })

  it('simulated surfaces carry the go-live step and an Open Settings CTA', () => {
    const onOpenSettings = vi.fn()
    const onClose = vi.fn()
    render(<ProvenancePanel id="blocked-today" live={false} onClose={onClose} onOpenSettings={onOpenSettings} />)
    expect(screen.getByText('How it becomes your data')).toBeTruthy()
    fireEvent.click(screen.getByText(/Open Settings · Proxy URL/))
    expect(onOpenSettings).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('a signed-in viewer sees the ACCOUNT variant for usage meters', () => {
    render(<ProvenancePanel id="usage-scans" live onClose={() => {}} />)
    expect(screen.getByText('Your account')).toBeTruthy()
    expect(screen.getByText(/nothing is simulated for your account/i)).toBeTruthy()
    // Already the operator's own data — no "become live" upsell step.
    expect(screen.queryByText('How it becomes your data')).toBeNull()
  })

  it('a signed-in viewer sees the ON-DEVICE variant for the assessment', () => {
    render(<ProvenancePanel id="assessment" live onClose={() => {}} />)
    expect(screen.getByText('Your data · this device')).toBeTruthy()
    expect(screen.getByText(/local storage/i)).toBeTruthy()
  })

  it('closes on Escape, on the backdrop, and on the close button', () => {
    const onClose = vi.fn()
    const { container } = render(<ProvenancePanel id="throughput" live={false} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.click(container.querySelector('.prov-overlay')!)
    fireEvent.click(screen.getByLabelText('Close data source details'))
    expect(onClose).toHaveBeenCalledTimes(3)
  })

  it('clicking inside the card does NOT close the dialog', () => {
    const onClose = vi.fn()
    render(<ProvenancePanel id="throughput" live={false} onClose={onClose} />)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('moves focus to the close button on open (keyboard users land inside the dialog)', () => {
    render(<ProvenancePanel id="risk-mix" live={false} onClose={() => {}} />)
    expect(document.activeElement).toBe(screen.getByLabelText('Close data source details'))
  })

  it('carries the standing honesty footer', () => {
    render(<ProvenancePanel id="detection-mix" live={false} onClose={() => {}} />)
    expect(screen.getByText(/never show fabricated data as their own/)).toBeTruthy()
  })
})
