import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CommandPalette } from '../CommandPalette'
import { NAV_ITEMS } from '../nav'

/**
 * The ⌘K palette.
 *
 * The affordance had been on screen for months — a search field with a keycap
 * hint — attached to nothing. These tests hold the promise it was already
 * making: type, filter, arrow, Enter, and you are on the page.
 */

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/command-center/overview',
}))

beforeEach(() => push.mockClear())

const open = (onClose = vi.fn()) => {
  const utils = render(<CommandPalette open onClose={onClose} />)
  return { onClose, ...utils }
}

describe('the palette', () => {
  it('renders nothing when closed', () => {
    render(<CommandPalette open={false} onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('lists every navigation destination when unfiltered', () => {
    open()
    // One list, shared with the sidebar. A palette with its own copy is how a
    // destination becomes reachable from one and not the other.
    expect(screen.getAllByRole('option')).toHaveLength(NAV_ITEMS.length)
  })

  it('filters by label', () => {
    open()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'quarantine' } })
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(1)
    expect(options[0]).toHaveTextContent(/quarantine/i)
  })

  it('filters by href, so a known URL finds its page', () => {
    open()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'shield/gaps' } })
    expect(screen.getAllByRole('option')[0]).toHaveTextContent(/gap analysis/i)
  })

  it('says so when nothing matches instead of showing an empty box', () => {
    open()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'zzzznope' } })
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(screen.getByText(/no destination matches/i)).toBeInTheDocument()
  })

  it('navigates on Enter and closes itself', () => {
    const { onClose } = open()
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'quarantine' } })
    fireEvent.keyDown(input.closest('[role="dialog"]')!, { key: 'Enter' })
    expect(push).toHaveBeenCalledWith('/command-center/quarantine')
    expect(onClose).toHaveBeenCalled()
  })

  it('moves the highlight with the arrow keys', () => {
    open()
    const dialog = screen.getByRole('dialog')
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(dialog, { key: 'ArrowDown' })
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(dialog, { key: 'ArrowUp' })
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('wraps at the ends rather than dead-ending', () => {
    open()
    const dialog = screen.getByRole('dialog')
    fireEvent.keyDown(dialog, { key: 'ArrowUp' })
    const options = screen.getAllByRole('option')
    expect(options[options.length - 1]).toHaveAttribute('aria-selected', 'true')
  })

  it('keeps the highlight inside the results as they narrow', () => {
    // Arrow to index 5, then filter to one result: Enter must not fire on an
    // index that no longer exists.
    open()
    const dialog = screen.getByRole('dialog')
    for (let i = 0; i < 5; i++) fireEvent.keyDown(dialog, { key: 'ArrowDown' })
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'quarantine' } })
    fireEvent.keyDown(dialog, { key: 'Enter' })
    expect(push).toHaveBeenCalledWith('/command-center/quarantine')
  })

  it('closes on Escape', () => {
    const { onClose } = open()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('closes when the backdrop is clicked but not the panel', () => {
    const onClose = vi.fn()
    const { container } = render(<CommandPalette open onClose={onClose} />)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(container.firstChild as Element)
    expect(onClose).toHaveBeenCalled()
  })
})
