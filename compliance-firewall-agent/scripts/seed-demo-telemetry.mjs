#!/usr/bin/env node
/**
 * Seed the demo account's gateway history.
 *
 *   npm run seed:demo            # insert (idempotent — replaces a previous seed)
 *   npm run seed:demo -- --clear # remove the seed, leave the account empty
 *   npm run seed:demo -- --dry   # generate and summarise, write nothing
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (already in
 * .env.local for anyone who can run the app).
 *
 * ── The three safety rails, in order of how much damage they prevent ─────────
 *
 *  1. ONE ACCOUNT. The target comes from `DEMO_ACCOUNT_EMAIL` in the environment
 *     (this repo is public, so the address is operator configuration and is not
 *     committed — same rule as FOUNDER_EMAIL in lib/email/identity.ts). There is
 *     no --email flag and no positional argument, on purpose: this script must
 *     not be a general-purpose "write events into any customer's tenant" tool.
 *     Adding one would turn a demo fixture into a way to corrupt real audit
 *     evidence. Unset means the script stops, never guesses.
 *
 *  2. IT ONLY EVER TOUCHES ITS OWN ROWS. Both the insert and the clear are
 *     filtered on `user_id = <demo>` AND `metadata->>demo_seed = <tag>`. If the
 *     demo account ever routes real traffic, that traffic has no marker and this
 *     script cannot see or delete it.
 *
 *  3. IT REFUSES TO OVERWRITE REAL DATA. Before inserting, it counts unmarked
 *     rows on the account and aborts if it finds any.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { register } from 'node:module'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const CFA = path.join(HERE, '..')

// Load .env.local the same way `next dev` does, without adding a dependency.
for (const file of ['.env.local', '.env']) {
  try {
    for (const line of readFileSync(path.join(CFA, file), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      const value = m[2].replace(/^["']|["']$/g, '')
      if (!process.env[m[1]]) process.env[m[1]] = value
    }
  } catch {
    /* file absent — fall back to the ambient environment */
  }
}

// The generator is TypeScript and is shared with the test suite, so it is loaded
// through tsx rather than duplicated here. One definition of the data, ever.
register('tsx/esm', import.meta.url)
const { generateDemoTelemetry, DEMO_SEED_TAG, demoAccountEmail, MAX_SEED_ROWS } = await import(
  path.join(CFA, 'lib/dashboard/demo-telemetry-seed.ts')
)

const TARGET_EMAIL = demoAccountEmail()
if (!TARGET_EMAIL) {
  console.error(
    '✗ DEMO_ACCOUNT_EMAIL is not set.\n' +
      '  Add it to .env.local — the repo is public, so the address is operator\n' +
      '  configuration and is deliberately not committed. There is no CLI flag\n' +
      '  for it: this script must never become a way to write events into an\n' +
      '  arbitrary tenant.',
  )
  process.exit(1)
}

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL_ || !KEY) {
  console.error('✗ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.')
  process.exit(1)
}

const argv = process.argv.slice(2)
const CLEAR = argv.includes('--clear')
const DRY = argv.includes('--dry')

const db = createClient(URL_, KEY, { auth: { persistSession: false } })

// ── Rail 1: resolve the one permitted account ────────────────────────────────
const { data: userPage, error: userErr } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (userErr) {
  console.error('✗ could not list users:', userErr.message)
  process.exit(1)
}
const account = userPage.users.find(
  (u) => (u.email ?? '').toLowerCase() === TARGET_EMAIL.toLowerCase(),
)
if (!account) {
  console.error(`✗ no account for ${TARGET_EMAIL}. Sign up first, then re-run.`)
  process.exit(1)
}
console.log(`• account   ${TARGET_EMAIL}  (${account.id})`)

// ── Rail 2 + 3: inspect what is already there ────────────────────────────────
const { count: seededCount } = await db
  .from('compliance_events')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', account.id)
  .eq('metadata->>demo_seed', DEMO_SEED_TAG)

const { count: totalCount } = await db
  .from('compliance_events')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', account.id)

const realRows = (totalCount ?? 0) - (seededCount ?? 0)
console.log(`• existing  ${seededCount ?? 0} seeded, ${realRows} real`)

if (realRows > 0) {
  console.error(
    `✗ refusing to run: ${realRows} unmarked event(s) on this account are real gateway ` +
      'traffic. Delete them deliberately first if that is what you want.',
  )
  process.exit(1)
}

async function clearSeed() {
  const { error } = await db
    .from('compliance_events')
    .delete()
    .eq('user_id', account.id)
    .eq('metadata->>demo_seed', DEMO_SEED_TAG)
  if (error) throw new Error(error.message)
}

if (CLEAR) {
  if (DRY) {
    console.log(`… dry run: would delete ${seededCount ?? 0} seeded row(s)`)
    process.exit(0)
  }
  await clearSeed()
  console.log(`✓ cleared ${seededCount ?? 0} seeded row(s). Dashboard is back to its empty state.`)
  process.exit(0)
}

// ── Generate ─────────────────────────────────────────────────────────────────
const rows = generateDemoTelemetry({ userId: account.id })

if (rows.length > MAX_SEED_ROWS) {
  console.error(`✗ generator produced ${rows.length} rows, over the ${MAX_SEED_ROWS} cap.`)
  process.exit(1)
}

const tally = (fn) => rows.reduce((m, r) => ((m[fn(r)] = (m[fn(r)] ?? 0) + 1), m), {})
console.log(`• generated ${rows.length} events over 30 days`)
console.log('  outcomes ', tally((r) => r.action_taken))
console.log('  providers', tally((r) => r.destination_provider))
console.log(`  span      ${rows[0].created_at} → ${rows[rows.length - 1].created_at}`)

if (DRY) {
  console.log('… dry run: nothing written')
  process.exit(0)
}

// ── Write ────────────────────────────────────────────────────────────────────
// Replace rather than append, so re-running is idempotent instead of doubling.
await clearSeed()

const BATCH = 500
for (let i = 0; i < rows.length; i += BATCH) {
  const slice = rows.slice(i, i + BATCH)
  const { error } = await db.from('compliance_events').insert(slice)
  if (error) {
    console.error(`✗ insert failed at row ${i}: ${error.message}`)
    process.exit(1)
  }
  process.stdout.write(`\r  inserted ${Math.min(i + BATCH, rows.length)}/${rows.length}`)
}
console.log('')

const { count: final } = await db
  .from('compliance_events')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', account.id)
  .eq('metadata->>demo_seed', DEMO_SEED_TAG)

console.log(`✓ ${final} events seeded for ${TARGET_EMAIL}.`)
console.log('  The dashboard will show a "Demo data" tag beside the title while these exist.')
console.log('  Undo with: npm run seed:demo -- --clear')
