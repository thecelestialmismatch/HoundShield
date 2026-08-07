import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Sidebar } from '../Sidebar'

/**
 * The sidebar's behaviour, mounted — not its class list.
 *
 * The source contract in `app/__tests__/dashboard-responsive-contract.test.ts`
 * proves the breakpoints are declared. This proves the drawer actually behaves
 * like a drawer: it can be closed, Escape works, focus goes into it, and the
 * quarantine badge tells the truth.
 */

let pathname = '/command-center/overview'
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: vi.fn() }),
}))

// SignOutButton reaches for Supabase; the shell test does not care how it signs
// out, only that a way out exists.
vi.mock('@/components/dashboard/SignOutButton', () => ({
  SignOutButton: ({ className }: { className?: string }) => (
    <button className={className}>Sign out</button>
  ),
}))

function mockQuarantine(body: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok, json: () => Promise.resolve(body) })),
  )
}

function renderSidebar(overrides: Partial<Parameters<typeof Sidebar>[0]> = {}) {
  const props = {
    collapsed: false,
    onToggleCollapsed: vi.fn(),
    mobileOpen: false,
    onCloseMobile: vi.fn(),
    onOpenPalette: vi.fn(),
    ...overrides,
  }
  return { props, ...render(<Sidebar {...props} />) }
}

beforeEach(() => {
  pathname = '/command-center/overview'
  mockQuarantine({ items: [], count: 0 })
})

describe('the off-canvas drawer', () => {
  it('is dismissible — the close control exists and calls back', () => {
    // Before 2026-08-07 there was no way to dismiss the sidebar on a phone at
    // all: the only control was a "Collapse" button at the bottom of a 23-item
    // nav, and it still left a 68px rail.
    const { props } = renderSidebar({ mobileOpen: true })
    fireEvent.click(screen.getByRole('button', { name: /close navigation/i }))
    expect(props.onCloseMobile).toHaveBeenCalled()
  })

  it('closes on Escape while open', () => {
    const { props } = renderSidebar({ mobileOpen: true })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(props.onCloseMobile).toHaveBeenCalled()
  })

  it('ignores Escape when it is not the thing on top', () => {
    const { props } = renderSidebar({ mobileOpen: false })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(props.onCloseMobile).not.toHaveBeenCalled()
  })

  it('moves focus into the drawer when it opens', async () => {
    renderSidebar({ mobileOpen: true })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /close navigation/i })).toHaveFocus(),
    )
  })

  it('is a dialog only while overlaying the page', () => {
    // Announcing the permanent desktop rail as a modal dialog is worse than
    // announcing nothing.
    const { unmount } = renderSidebar({ mobileOpen: true })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    unmount()

    renderSidebar({ mobileOpen: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('the quarantine badge tells the truth or says nothing', () => {
  const badge = () => screen.queryByText(/items awaiting review/i)

  it('renders nothing when the queue is empty', async () => {
    mockQuarantine({ items: [], count: 0 })
    renderSidebar()
    await waitFor(() => expect(screen.getByText('Quarantine')).toBeInTheDocument())
    expect(badge()).not.toBeInTheDocument()
  })

  it('renders the real count when there is a queue', async () => {
    mockQuarantine({ items: [], count: 7 })
    renderSidebar()
    await waitFor(() => expect(screen.getByText('7')).toBeInTheDocument())
  })

  it('renders nothing when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    renderSidebar()
    await waitFor(() => expect(screen.getByText('Quarantine')).toBeInTheDocument())
    expect(badge()).not.toBeInTheDocument()
  })

  it('never surfaces the demo-mode seed as a live count', async () => {
    // /api/quarantine/review answers with a seeded list when Supabase is
    // unconfigured. Rendering that as the customer's queue depth is exactly the
    // hardcoded `badge: "4"` this replaced.
    mockQuarantine({ items: [1, 2, 3], count: 3, demo: true })
    renderSidebar()
    await waitFor(() => expect(screen.getByText('Quarantine')).toBeInTheDocument())
    expect(badge()).not.toBeInTheDocument()
  })
})

describe('navigation semantics', () => {
  it('marks the current destination with aria-current', () => {
    pathname = '/command-center/rules'
    renderSidebar()
    expect(screen.getByRole('link', { name: /firewall rules/i })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('exposes ONE dashboard destination, not a Home/Overview pair', () => {
    renderSidebar()
    expect(screen.queryByRole('link', { name: /dashboard home/i })).toBeNull()
    const toDashboard = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href') === '/command-center/overview')
    expect(toDashboard).toHaveLength(1)
  })

  it('marks only the current page active — not every page', () => {
    // `/command-center` is a prefix of all 23 routes, so a startsWith match on
    // it lit up the old Home row everywhere.
    pathname = '/command-center/rules'
    renderSidebar()
    expect(screen.getAllByRole('link').filter((a) => a.getAttribute('aria-current') === 'page'))
      .toHaveLength(1)
  })

  it('personalizes the dashboard label once the session name is known', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve(
              String(url).includes('/api/me')
                ? { authenticated: true, name: 'Sam', company: 'Meridian' }
                : { items: [], count: 0 },
            ),
        }),
      ),
    )
    renderSidebar()
    expect(await screen.findByRole('link', { name: /sam's dashboard/i })).toBeTruthy()
  })

  it('falls back to the neutral label when there is no name — never a stand-in', () => {
    // Same rule the header's company slot follows: an empty/neutral slot is
    // honest, an invented one is fabricated data on the customer's dashboard.
    mockQuarantine({ items: [], count: 0 })
    renderSidebar()
    expect(screen.getByRole('link', { name: /your dashboard/i })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /'s dashboard/i })).toBeNull()
  })

  it('the search affordance is a real control that opens the palette', () => {
    // It was a <div> with cursor-pointer, no handler and no tab stop.
    const { props } = renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: /search/i }))
    expect(props.onOpenPalette).toHaveBeenCalled()
  })

  it('offers a way out of the dashboard', () => {
    renderSidebar()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })
})
