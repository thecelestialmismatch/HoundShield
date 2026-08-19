import { readFileSync } from 'fs'
import path from 'path'

/**
 * Migration 036 least-privilege contract.
 *
 * These functions require SECURITY DEFINER to bypass RLS for trusted server-side
 * work, but that does not make them safe public RPCs. They must be callable only
 * by the service-role server client (or, for the trigger helper, by PostgreSQL
 * itself). The Supabase production advisor found each was exposed to anon and
 * authenticated roles before this migration existed.
 */
const SQL = readFileSync(
  path.resolve(__dirname, '../../../supabase/migrations/036_revoke_public_security_definer.sql'),
  'utf8',
)

const CODE = SQL.replace(/--.*$/gm, '')

describe('migration 036 — security-definer functions are least privilege', () => {
  it('revokes audit trigger-helper execution from all external PostgREST roles', () => {
    expect(CODE).toMatch(/revoke\s+all\s+on\s+function\s+public\.auth_audit_events_immutable\(\)\s+from\s+public,\s*anon,\s*authenticated/i)
  })

  it('revokes shared rate-limit RPC execution from all external PostgREST roles', () => {
    expect(CODE).toMatch(/revoke\s+all\s+on\s+function\s+public\.consume_rate_limit\(text,\s*integer,\s*integer\)\s+from\s+public,\s*anon,\s*authenticated/i)
    expect(CODE).toMatch(/revoke\s+all\s+on\s+function\s+public\.sweep_rate_limit_buckets\(\)\s+from\s+public,\s*anon,\s*authenticated/i)
  })

  it('restores only service-role execution for trusted server-side rate limiting', () => {
    expect(CODE).toMatch(/grant\s+execute\s+on\s+function\s+public\.consume_rate_limit\(text,\s*integer,\s*integer\)\s+to\s+service_role/i)
    expect(CODE).toMatch(/grant\s+execute\s+on\s+function\s+public\.sweep_rate_limit_buckets\(\)\s+to\s+service_role/i)
  })

  it('never grants the privileged functions to anon or authenticated roles', () => {
    expect(CODE).not.toMatch(/grant\s+execute\s+on\s+function[^;]+to\s+(anon|authenticated)/i)
  })
})
