import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockClassify,
  mockOrchestrate,
  mockOrchestratorCtor,
  mockRateLimit,
  mockGetUser,
  mockSupabaseConfigured,
} = vi.hoisted(() => ({
  mockClassify: vi.fn(),
  mockOrchestrate: vi.fn(),
  mockOrchestratorCtor: vi.fn(),
  mockRateLimit: vi.fn(async () => null),
  mockGetUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } } })),
  mockSupabaseConfigured: vi.fn(() => true),
}))

vi.mock('@/lib/classifier/risk-engine', () => ({
  classifyRisk: (t: string) => mockClassify(t),
}))
vi.mock('@/lib/brain-ai/multi-agent-orchestrator', () => ({
  MultiAgentOrchestrator: class {
    constructor(key?: string) {
      mockOrchestratorCtor(key)
    }
    orchestrate(input: unknown) {
      return mockOrchestrate(input)
    }
  },
}))
vi.mock('@/lib/rate-limit-shared', () => ({
  enforceRateLimit: () => mockRateLimit(),
  identifierFor: () => 'id',
  clientIp: () => '127.0.0.1',
  LLM_RATE_LIMITS: {
    authenticated: { limit: 100, windowSec: 60 },
    publicRead: { limit: 100, windowSec: 60 },
  },
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: mockGetUser } }),
}))
vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => mockSupabaseConfigured(),
}))
vi.mock('@/lib/brain', () => ({
  queryBrain: () => ({ answer: 'local', confidence: 1, sources: [], domain: 'x', facts: [] }),
}))
vi.mock('@/lib/brain-ai/brain-query', () => ({
  ask: () => ({ answer: 'local', sources: [] }),
}))

import { POST } from '../route'

/* ──────────────────────────────────────────────────────────────────
 * Brain AI CUI spillage guard.
 *
 * The v3 branch of this route fans out to OpenRouter — a commercial
 * endpoint that is NOT FedRAMP-authorized. A CUI prompt reaching it is
 * a reportable spillage event under DFARS 252.204-7012; PHI without a
 * BAA is a HIPAA disclosure.
 *
 * Before this guard, the only protection was a warning label rendered
 * in components/GlobalChat.tsx. That label does not exist for anyone
 * POSTing the route directly — an agent, a script, or any client other
 * than our own chat widget. CLAUDE.md requires the boundary to be
 * enforced, not merely disclosed.
 *
 * The assertion that matters in every blocking case below is that the
 * orchestrator was never CONSTRUCTED — proving the prompt could not
 * have left the process, rather than merely that the caller saw a 400.
 * ────────────────────────────────────────────────────────────────── */

const clean = {
  risk_level: 'NONE',
  classifications: [],
  entities: [],
  confidence: 1,
  should_block: false,
  should_quarantine: false,
  matched_rules: [],
}

function v3Request(query: string) {
  return new NextRequest('http://localhost/api/brain/query', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-brain-version': 'v3' },
    body: JSON.stringify({ query }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRateLimit.mockResolvedValue(null)
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  mockSupabaseConfigured.mockReturnValue(true)
  mockOrchestrate.mockResolvedValue({ answer: 'ok', agent: 'cmmc' })
})

describe('POST /api/brain/query (v3) — CUI guard', () => {
  it('blocks a prompt the classifier flags, and never builds the orchestrator', async () => {
    mockClassify.mockResolvedValue({
      ...clean,
      risk_level: 'CRITICAL',
      classifications: ['CUI'],
      should_block: true,
      matched_rules: ['cui_marking'],
    })

    const res = await POST(v3Request('Summarize our CAGE code 1ABC2 contract for the Navy'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toMatch(/CUI|spillage/i)
    expect(res.headers.get('x-brain-blocked')).toBe('cui-guard')
    expect(mockOrchestratorCtor).not.toHaveBeenCalled()
    expect(mockOrchestrate).not.toHaveBeenCalled()
  })

  it('blocks quarantine-level content too, not just hard blocks', async () => {
    mockClassify.mockResolvedValue({
      ...clean,
      risk_level: 'HIGH',
      classifications: ['PHI'],
      should_quarantine: true,
    })

    const res = await POST(v3Request('patient MRN 88213 lab results summary'))

    expect(res.status).toBe(400)
    expect(mockOrchestratorCtor).not.toHaveBeenCalled()
  })

  it('scans the query before any outbound call is set up', async () => {
    mockClassify.mockResolvedValue(clean)
    await POST(v3Request('What is CMMC Level 2?'))

    expect(mockClassify).toHaveBeenCalledWith('What is CMMC Level 2?')
  })

  it('lets a benign compliance question through to the orchestrator', async () => {
    mockClassify.mockResolvedValue(clean)

    const res = await POST(v3Request('What is CMMC Level 2?'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.version).toBe('v3')
    expect(mockOrchestrate).toHaveBeenCalled()
  })

  it('fails closed when the classifier itself throws', async () => {
    /*
     * A scanner outage must not become an open door. If we cannot tell
     * whether the prompt carries CUI, it does not go to a commercial
     * endpoint — 503, and nothing is forwarded.
     */
    mockClassify.mockRejectedValue(new Error('regex engine exploded'))

    const res = await POST(v3Request('anything at all'))

    expect(res.status).toBe(503)
    expect(mockOrchestratorCtor).not.toHaveBeenCalled()
  })

  it('still requires authentication before it scans anything', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const res = await POST(v3Request('What is CMMC Level 2?'))

    expect(res.status).toBe(401)
    expect(mockClassify).not.toHaveBeenCalled()
  })
})

describe('POST /api/brain/query (v1) — local path is deliberately unscanned', () => {
  it('answers from the local graph without invoking the classifier', async () => {
    /*
     * v1 resolves entirely in-process from the BM25 knowledge graph. No
     * network boundary is crossed, so there is no spillage risk to guard
     * and no reason to spend scan latency. If this path ever gains an
     * outbound call, this test should start failing by design.
     */
    const req = new NextRequest('http://localhost/api/brain/query', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: 'What is CMMC Level 2?' }),
    })

    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockClassify).not.toHaveBeenCalled()
    expect(mockOrchestratorCtor).not.toHaveBeenCalled()
  })
})
