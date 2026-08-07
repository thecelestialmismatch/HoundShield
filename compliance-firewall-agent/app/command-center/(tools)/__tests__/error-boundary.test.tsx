import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CommandCenterToolError from '../error'

/**
 * The tool error boundary.
 *
 * It exists so a throw in one of the 23 pages costs the operator that page and
 * not the whole Command Center. Before 2026-08-07 there was no boundary
 * anywhere under `app/command-center`, so any render error escaped to the root
 * one and the sidebar, header and every route went with it.
 */

beforeEach(() => {
  // The component logs the error on mount by design — the digest is what ties
  // this screen to a server log. Keep it out of the test output.
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

const boom = Object.assign(new Error('kaboom'), { digest: 'abc123' })

describe('the operator is told what happened and can act', () => {
  it('announces itself to assistive tech', () => {
    render(<CommandCenterToolError error={boom} reset={vi.fn()} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('retries in place rather than forcing a reload', () => {
    const reset = vi.fn()
    render(<CommandCenterToolError error={boom} reset={reset} />)
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(reset).toHaveBeenCalledTimes(1)
  })

  it('offers a way onward when retrying will not help', () => {
    render(<CommandCenterToolError error={boom} reset={vi.fn()} />)
    expect(screen.getByRole('link', { name: /audit log/i })).toHaveAttribute(
      'href',
      '/command-center/events',
    )
  })

  it('shows the digest so a support conversation can match the server log', () => {
    render(<CommandCenterToolError error={boom} reset={vi.fn()} />)
    expect(screen.getByText(/abc123/)).toBeInTheDocument()
  })

  it('never prints the raw error message to the browser', () => {
    // The message can carry internals. The digest is the safe handle.
    const { container } = render(<CommandCenterToolError error={boom} reset={vi.fn()} />)
    expect(container.textContent).not.toContain('kaboom')
  })

  it('omits the reference line entirely when there is no digest', () => {
    render(<CommandCenterToolError error={new Error('x')} reset={vi.fn()} />)
    expect(screen.queryByText(/reference:/i)).not.toBeInTheDocument()
  })

  it('does not imply enforcement stopped', () => {
    // The gateway runs in the customer's own environment. A dashboard render
    // error says nothing about whether scanning is still happening, and an
    // operator who assumes otherwise makes a bad call under pressure.
    render(<CommandCenterToolError error={boom} reset={vi.fn()} />)
    expect(screen.getByText(/keeps scanning and\s+recording/i)).toBeInTheDocument()
  })
})
