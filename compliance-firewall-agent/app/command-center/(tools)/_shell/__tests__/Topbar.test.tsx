import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Topbar } from '../Topbar'

/**
 * The header says only true things about the customer's account.
 *
 * Three pieces of chrome were removed on 2026-08-07 and these tests are what
 * stop them coming back — each one looked like live state and was a constant.
 */

vi.mock('next/navigation', () => ({
  usePathname: () => '/command-center/overview',
  useRouter: () => ({ push: vi.fn() }),
}))

function mockMe(body: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok, json: () => Promise.resolve(body) })),
  )
}

const renderTopbar = () =>
  render(<Topbar sidebarCollapsed={false} onOpenMobileNav={vi.fn()} />)

beforeEach(() => {
  mockMe({ authenticated: true, name: 'Dana Reyes', company: 'Northwind Defense' })
})

describe('nothing in the header is a decorative constant', () => {
  it('no permanently-green "All Systems Operational" pill', async () => {
    // It was a hardcoded string with a pulsing dot, checked against nothing. It
    // could not be wired to /api/health honestly either: that route returns
    // `status: "healthy"` as a literal, and its services block describes
    // HoundShield's own vendor config, not the customer's posture.
    renderTopbar()
    await waitFor(() => expect(screen.getByText('Northwind Defense')).toBeInTheDocument())
    expect(screen.queryByText(/all systems operational/i)).not.toBeInTheDocument()
  })

  it('no notification bell announcing unread news that does not exist', async () => {
    renderTopbar()
    await waitFor(() => expect(screen.getByText('Northwind Defense')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /notification/i })).not.toBeInTheDocument()
  })

  it('shows no avatar initial until a real name arrives', async () => {
    // It defaulted to "K", a leftover from the Kaelus era, so every operator
    // was briefly shown a stranger's initial.
    mockMe({ authenticated: true, name: null, company: null })
    const { container } = renderTopbar()
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(container.textContent).not.toContain('K')
  })

  it('renders the initial once the profile answers', async () => {
    renderTopbar()
    await waitFor(() => expect(screen.getByText('D')).toBeInTheDocument())
  })
})

describe('the header identifies the customer', () => {
  it('shows the signed-in company', async () => {
    renderTopbar()
    await waitFor(() => expect(screen.getByText('Northwind Defense')).toBeInTheDocument())
  })

  it('renders nothing rather than a placeholder org when none is set', async () => {
    mockMe({ authenticated: true, name: 'Dana Reyes', company: null })
    renderTopbar()
    await waitFor(() => expect(screen.getByText('D')).toBeInTheDocument())
    // Any stand-in here would be fabricated data on the customer's dashboard.
    expect(screen.queryByText(/acme|demo|your company|organization/i)).not.toBeInTheDocument()
  })

  it('survives a failed profile read without breaking the chrome', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    renderTopbar()
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    // Identity is decoration; the auth gate upstream already decided access.
    expect(screen.getByRole('link', { name: /account settings/i })).toBeInTheDocument()
  })
})

describe('mobile navigation is reachable', () => {
  it('the hamburger opens the drawer', async () => {
    const onOpenMobileNav = vi.fn()
    render(<Topbar sidebarCollapsed={false} onOpenMobileNav={onOpenMobileNav} />)
    fireEvent.click(screen.getByRole('button', { name: /open navigation/i }))
    expect(onOpenMobileNav).toHaveBeenCalled()
  })
})
