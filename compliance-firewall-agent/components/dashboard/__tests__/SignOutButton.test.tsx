import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const push = vi.fn()
const refresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}))

const betterSignOut = vi.fn()
let betterAuthOn = false
vi.mock('@/lib/auth/auth-client', () => ({
  isBetterAuthClientEnabled: () => betterAuthOn,
  signOut: (...args: unknown[]) => betterSignOut(...args),
}))

const supabaseSignOut = vi.fn()
vi.mock('@/lib/supabase/browser', () => ({
  createClient: () => ({ auth: { signOut: supabaseSignOut } }),
}))

import { SignOutButton } from '../SignOutButton'

describe('SignOutButton — provider-agnostic, never a fake success', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    betterAuthOn = false
  })

  it('signs out through Supabase (current default provider) and redirects to /login', async () => {
    supabaseSignOut.mockResolvedValue({ error: null })
    render(<SignOutButton />)
    fireEvent.click(screen.getByText('Sign out'))
    await waitFor(() => expect(push).toHaveBeenCalledWith('/login'))
    expect(supabaseSignOut).toHaveBeenCalled()
    expect(betterSignOut).not.toHaveBeenCalled()
    expect(refresh).toHaveBeenCalled()
  })

  it('signs out through Better Auth when the provider flag selects it', async () => {
    betterAuthOn = true
    betterSignOut.mockResolvedValue(undefined)
    render(<SignOutButton />)
    fireEvent.click(screen.getByText('Sign out'))
    await waitFor(() => expect(push).toHaveBeenCalledWith('/login'))
    expect(betterSignOut).toHaveBeenCalled()
    expect(supabaseSignOut).not.toHaveBeenCalled()
  })

  it('on failure it degrades honestly: visible retry label, NO redirect', async () => {
    supabaseSignOut.mockResolvedValue({ error: new Error('network down') })
    render(<SignOutButton />)
    fireEvent.click(screen.getByText('Sign out'))
    await screen.findByText('Sign out failed — retry')
    expect(push).not.toHaveBeenCalled()
  })
})
