/**
 * Settings → Gateway API keys.
 *
 * The section this replaces rendered `kls_${user.id}` — derived from the user's
 * id, never stored, never hashed into `api_keys` — behind Reveal and Copy
 * buttons, captioned "Include this key in the x-api-key header of your gateway
 * requests". `resolveApiKey` hashes the incoming key and looks it up, so that
 * value produced a 401 on every request. A customer following the product's own
 * instructions could not send one prompt through the gateway, which is why the
 * dashboard had nothing to show.
 *
 * These tests pin the properties that must hold for that never to come back.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { GatewayKeys } from '../GatewayKeys'
import { GATEWAY_BASE_URL, GATEWAY_COMPLETIONS_URL } from '@/lib/gateway/base-url'

const SETTINGS_PAGE = readFileSync(
  join(process.cwd(), 'app/command-center/(tools)/settings/page.tsx'),
  'utf8'
)

describe('Settings source guard', () => {
  it('never derives a credential from the user id again', () => {
    // The exact shape of the old fabrication: `kls_${user.id...}`. A key the
    // gateway has never seen the hash of cannot authenticate, so a customer
    // who copies it gets 401 on every request — silently, because the UI
    // presented it as working. Fail the build rather than ship that twice.
    expect(SETTINGS_PAGE).not.toMatch(/kls_/)
    expect(SETTINGS_PAGE).not.toMatch(/user\.id\.replace/)
  })

  it('gets its keys from the issuance API, not from local string-building', () => {
    expect(SETTINGS_PAGE).toContain('GatewayKeys')
  })
})

const KEY_ROW = {
  id: 'key-1',
  key_prefix: 'hs_live_abcd…',
  name: 'Gateway key',
  is_active: true,
  created_at: '2026-08-01T00:00:00.000Z',
  last_used_at: null,
  revoked_at: null,
}

function mockFetch(handlers: Record<string, () => Response>) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const method = init?.method ?? 'GET'
    const key = `${method} ${url.split('?')[0]}`
    const h = handlers[key]
    if (!h) throw new Error(`unmocked ${key}`)
    return h()
  })
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

describe('GatewayKeys', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('shows the real gateway URL a client must be pointed at', async () => {
    vi.stubGlobal('fetch', mockFetch({ 'GET /api/gateway/keys': () => json({ keys: [] }) }))
    render(<GatewayKeys />)
    expect(await screen.findByText(GATEWAY_BASE_URL)).toBeTruthy()
  })

  it('never fabricates a key — an account with none says so', async () => {
    vi.stubGlobal('fetch', mockFetch({ 'GET /api/gateway/keys': () => json({ keys: [] }) }))
    render(<GatewayKeys />)

    expect(await screen.findByText(/No keys yet/i)).toBeTruthy()
    // Nothing key-shaped is on screen when the account holds no keys.
    expect(document.body.textContent).not.toMatch(/hs_live_[A-Za-z0-9_-]{8,}/)
    expect(document.body.textContent).not.toMatch(/kls_/)
  })

  it('reveals a minted key exactly once, with the warning that it cannot be shown again', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        'GET /api/gateway/keys': () => json({ keys: [] }),
        'POST /api/gateway/keys': () =>
          json({ key: 'hs_live_SECRETVALUE123', record: KEY_ROW }, 201),
      })
    )
    render(<GatewayKeys />)

    fireEvent.click(await screen.findByRole('button', { name: /create gateway key/i }))

    expect(await screen.findByText('hs_live_SECRETVALUE123')).toBeTruthy()
    expect(screen.getByText(/last time it can be displayed/i)).toBeTruthy()
  })

  it('gives the operator a runnable curl so the first real event is one paste away', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        'GET /api/gateway/keys': () => json({ keys: [] }),
        'POST /api/gateway/keys': () =>
          json({ key: 'hs_live_SECRETVALUE123', record: KEY_ROW }, 201),
      })
    )
    render(<GatewayKeys />)

    fireEvent.click(await screen.findByRole('button', { name: /create gateway key/i }))

    const curl = await screen.findByText(
      (text) => text.startsWith('curl ') && text.includes(GATEWAY_COMPLETIONS_URL)
    )
    expect(curl.textContent).toContain('Authorization: Bearer hs_live_SECRETVALUE123')
  })

  it('lists an existing key by its non-secret prefix only', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({ 'GET /api/gateway/keys': () => json({ keys: [KEY_ROW] }) })
    )
    render(<GatewayKeys />)

    expect(await screen.findByText('hs_live_abcd…')).toBeTruthy()
    expect(screen.getByText(/1 active/)).toBeTruthy()
  })

  it('revoking calls the API and refreshes the list', async () => {
    const fetchMock = mockFetch({
      'GET /api/gateway/keys': () => json({ keys: [KEY_ROW] }),
      'DELETE /api/gateway/keys': () => json({ revoked: 'key-1' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<GatewayKeys />)

    fireEvent.click(await screen.findByRole('button', { name: /revoke key/i }))

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          ([u, i]) => String(u).includes('id=key-1') && (i as RequestInit)?.method === 'DELETE'
        )
      ).toBe(true)
    )
  })

  it('says the load failed rather than rendering an empty list it cannot vouch for', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({ 'GET /api/gateway/keys': () => json({ error: 'boom' }, 500) })
    )
    render(<GatewayKeys />)

    expect(await screen.findByText(/Could not load your gateway keys/i)).toBeTruthy()
    expect(screen.queryByText(/No keys yet/i)).toBeNull()
  })

  it('surfaces a refused mint instead of a silent no-op', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        'GET /api/gateway/keys': () => json({ keys: [] }),
        'POST /api/gateway/keys': () => json({ error: 'You already have 10 active keys.' }, 409),
      })
    )
    render(<GatewayKeys />)

    fireEvent.click(await screen.findByRole('button', { name: /create gateway key/i }))

    expect(await screen.findByText(/already have 10 active keys/i)).toBeTruthy()
  })
})
