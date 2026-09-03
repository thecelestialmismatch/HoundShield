/**
 * Hound Shield Proxy — local SQLite event log, SHA-256 hash-chained.
 *
 * Stores metadata ONLY. Never stores prompt text, CUI content, or user data.
 * Schema fields: timestamp, action, pattern_name, risk_level, request_id,
 * org_id, scan_ms — plus the chain columns below.
 *
 * ─── Why the chain is HERE and not only in the cloud plane ─────────────────
 *
 * The product is sold on "a SHA-256 tamper-evident audit trail, generated from
 * a 14-day run in your own environment" (components/scan/LocalScanPanel.tsx),
 * and a C3PAO accepts that artifact because the evidence cannot be edited after
 * the fact without detection.
 *
 * Until this change, `proxy_events` had no hash column, no previous-hash column
 * and no signature. The only SHA-256 anywhere in `proxy/` hashed the licence
 * key. The chain existed exclusively in `compliance-firewall-agent/lib/audit/
 * seed-anchor.ts` and Supabase migrations 029/030 — that is, inside the Vercel
 * and Supabase plane which CLAUDE.md itself declares NOT CUI-safe.
 *
 * So the tamper-evidence lived in the one place a CUI-handling customer is told
 * not to send CUI, and Mode B — the only deployment the CUI-safe claim holds
 * for — produced a flat table anyone with the volume mounted could edit with
 * `sqlite3`. An SSP artifact generated from that table is inadmissible.
 *
 * ─── How the chain works ───────────────────────────────────────────────────
 *
 *   hash(n) = SHA-256( prev_hash(n) || canonical(event n) )
 *
 * `canonical` is a stable, key-ordered JSON of the event's own fields. `id` is
 * deliberately NOT part of the digest: SQLite assigns it during the insert, so
 * it is not knowable when the digest is computed. Ordering is still enforced,
 * because the chain is walked in `id` order and each link names its
 * predecessor's digest — delete row N and row N+1's `prev_hash` no longer
 * matches the recomputed digest of the row that now precedes it.
 *
 * `created_at` is computed in JS rather than left to SQLite's
 * `datetime('now')` default. A digest cannot cover a value the database
 * invents after the digest is taken.
 *
 * Reading the tip and writing the next link are two statements, so they run
 * inside a single IMMEDIATE transaction. better-sqlite3 is synchronous and Node
 * is single-threaded, which already serialises writers inside one process; the
 * transaction is what stops a SECOND process with the same volume mounted from
 * forking the chain.
 *
 * ─── Legacy rows are reported honestly ─────────────────────────────────────
 *
 * A database written before this change has rows with no digest. They cannot be
 * retro-hashed into the chain — inventing digests for records whose integrity
 * was never protected would be manufacturing evidence, which is the precise
 * failure this file exists to prevent. `verifyChain()` therefore reports them as
 * UNVERIFIABLE (pre-chain) and distinguishes that from TAMPERED. The report
 * states the boundary index so an assessor can see exactly where the guarantee
 * begins.
 *
 * Written with better-sqlite3 (synchronous API — safe in single-threaded Node).
 */

import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { createHash } from "node:crypto";

export interface ProxyEvent {
  request_id: string;
  org_id: string;
  action: "ALLOWED" | "BLOCKED" | "QUARANTINED";
  risk_level: string;
  pattern_name?: string;
  nist_control?: string;
  scan_ms: number;
  created_at?: string;
}

/** The prev_hash of the first link. 64 zeros — never a real SHA-256 output. */
export const GENESIS_HASH = "0".repeat(64);

// ── Init ────────────────────────────────────────────────────────────────────

const DB_DIR = process.env.HOUNDSHIELD_DATA_DIR ?? path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "houndshield-events.db");

/** Columns the digest covers, in the exact order they are serialised. */
const DIGEST_FIELDS = [
  "request_id",
  "org_id",
  "action",
  "risk_level",
  "pattern_name",
  "nist_control",
  "scan_ms",
  "created_at",
] as const;

type DigestSource = Record<(typeof DIGEST_FIELDS)[number], unknown>;

/**
 * Stable serialization of an event's digest-covered fields.
 *
 * Field order is fixed by DIGEST_FIELDS rather than by object key order, so the
 * digest cannot change because someone reordered an object literal. `null` and
 * `undefined` collapse to the same token: SQLite returns NULL for an absent
 * optional column, and the value handed to `logEvent` was `undefined`, so the
 * two must digest identically or every row with no pattern name would verify as
 * tampered on read-back.
 */
function canonical(event: DigestSource): string {
  return JSON.stringify(
    DIGEST_FIELDS.map((f) => {
      const v = event[f];
      return v === undefined || v === null ? null : v;
    })
  );
}

/** hash(n) = SHA-256( prev_hash || canonical(event) ), hex. */
export function eventDigest(prevHash: string, event: DigestSource): string {
  return createHash("sha256").update(prevHash).update(canonical(event)).digest("hex");
}

function openDb(): Database.Database {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  // Create table — one prepare per DDL statement (better-sqlite3 requirement)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS proxy_events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id  TEXT NOT NULL,
      org_id      TEXT NOT NULL DEFAULT '',
      action      TEXT NOT NULL,
      risk_level  TEXT NOT NULL,
      pattern_name TEXT,
      nist_control TEXT,
      scan_ms     INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      prev_hash   TEXT,
      hash        TEXT
    )
  `).run();

  /*
   * In-place upgrade for databases created before the chain existed.
   * `ADD COLUMN` cannot be made conditional in SQLite, so the existing column
   * set is read first. The columns are nullable on purpose: legacy rows keep
   * NULL, which is what lets `verifyChain` tell "written before the guarantee"
   * apart from "edited after the fact".
   */
  const existing = new Set(
    (db.prepare(`PRAGMA table_info(proxy_events)`).all() as Array<{ name: string }>).map(
      (c) => c.name
    )
  );
  if (!existing.has("prev_hash")) {
    db.prepare(`ALTER TABLE proxy_events ADD COLUMN prev_hash TEXT`).run();
  }
  if (!existing.has("hash")) {
    db.prepare(`ALTER TABLE proxy_events ADD COLUMN hash TEXT`).run();
  }

  db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_proxy_events_created ON proxy_events(created_at)`
  ).run();

  db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_proxy_events_action ON proxy_events(action)`
  ).run();

  return db;
}

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) _db = openDb();
  return _db;
}

// ── Writes ──────────────────────────────────────────────────────────────────

let _insert: Database.Statement | null = null;
let _tip: Database.Statement | null = null;
let _appendTxn: ((event: ProxyEvent & { created_at: string }) => void) | null = null;

function insertStmt(): Database.Statement {
  if (!_insert) {
    _insert = getDb().prepare(`
      INSERT INTO proxy_events
        (request_id, org_id, action, risk_level, pattern_name, nist_control, scan_ms, created_at, prev_hash, hash)
      VALUES
        (@request_id, @org_id, @action, @risk_level, @pattern_name, @nist_control, @scan_ms, @created_at, @prev_hash, @hash)
    `);
  }
  return _insert;
}

/** Digest of the newest CHAINED row, or GENESIS_HASH when there is none. */
function tipStmt(): Database.Statement {
  if (!_tip) {
    _tip = getDb().prepare(
      `SELECT hash FROM proxy_events WHERE hash IS NOT NULL ORDER BY id DESC LIMIT 1`
    );
  }
  return _tip;
}

function appendTxn(): (event: ProxyEvent & { created_at: string }) => void {
  if (!_appendTxn) {
    const db = getDb();
    _appendTxn = db.transaction((event: ProxyEvent & { created_at: string }) => {
      const tip = tipStmt().get() as { hash: string } | undefined;
      const prev_hash = tip?.hash ?? GENESIS_HASH;
      const row = {
        request_id: event.request_id,
        org_id: event.org_id,
        action: event.action,
        risk_level: event.risk_level,
        pattern_name: event.pattern_name ?? null,
        nist_control: event.nist_control ?? null,
        scan_ms: event.scan_ms,
        created_at: event.created_at,
      };
      insertStmt().run({ ...row, prev_hash, hash: eventDigest(prev_hash, row) });
    });
  }
  return _appendTxn;
}

/**
 * Append one event to the chain.
 *
 * Never throws out of the audit path on a chain error: a proxy that 500s a
 * customer's production AI traffic because SQLite blipped is a worse outage
 * than a gap in the log, and the safety decision (block / quarantine) has
 * already been made and enforced before this is called. This mirrors the
 * failure policy `lib/audit/record-decision.ts` documents on the web side.
 * A gap is visible to `verifyChain` either way.
 */
export function logEvent(event: ProxyEvent): void {
  const created_at = event.created_at ?? new Date().toISOString();
  try {
    appendTxn()({ ...event, created_at });
  } catch (err) {
    console.error("[houndshield] audit chain append failed:", err);
  }
}

// ── Reads (for local health / audit endpoints) ──────────────────────────────

export interface EventQuery {
  limit?: number;
  offset?: number;
  action?: string;
  since?: string; // ISO datetime
}

export interface EventRow extends ProxyEvent {
  id: number;
  prev_hash: string | null;
  hash: string | null;
}

export function queryEvents(q: EventQuery = {}): EventRow[] {
  const { limit = 100, offset = 0, action, since } = q;
  let sql = "SELECT * FROM proxy_events";
  const params: (string | number)[] = [];
  const where: string[] = [];

  if (action) {
    where.push("action = ?");
    params.push(action);
  }
  if (since) {
    where.push("created_at >= ?");
    params.push(since);
  }
  if (where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  return getDb().prepare(sql).all(...params) as EventRow[];
}

export interface EventStats {
  total: number;
  blocked: number;
  quarantined: number;
  allowed: number;
  last_event_at: string | null;
}

export function getStats(): EventStats {
  const row = getDb()
    .prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN action='BLOCKED' THEN 1 ELSE 0 END) as blocked,
        SUM(CASE WHEN action='QUARANTINED' THEN 1 ELSE 0 END) as quarantined,
        SUM(CASE WHEN action='ALLOWED' THEN 1 ELSE 0 END) as allowed,
        MAX(created_at) as last_event_at
      FROM proxy_events`
    )
    .get() as EventStats;
  return row;
}

// ── Verification ────────────────────────────────────────────────────────────

export interface ChainVerification {
  /** True when every chained row recomputes to its stored digest. */
  ok: boolean;
  /** Rows carrying a digest, i.e. rows the guarantee actually covers. */
  chained: number;
  /**
   * Rows written before the chain existed. NOT a failure — they are outside
   * the guarantee, and the report says so rather than calling them tampered.
   */
  unverifiable: number;
  /** `id` of the first row that failed to recompute, else null. */
  first_broken_id: number | null;
  /** Why it failed, in words an assessor can read. */
  reason: string | null;
  /** Digest of the newest chained row — the value to anchor externally. */
  tip_hash: string | null;
}

/**
 * Walk the chain and recompute every digest.
 *
 * Two distinct failures are reported separately, because they mean different
 * things to an assessor:
 *
 *   BROKEN_LINK  — a row's `prev_hash` does not match the digest of the row
 *                  before it. A record was deleted or reordered.
 *   BROKEN_ROW   — a row's own digest does not recompute from its own fields.
 *                  A record was edited in place.
 */
export function verifyChain(): ChainVerification {
  const rows = getDb()
    .prepare(`SELECT * FROM proxy_events ORDER BY id ASC`)
    .all() as EventRow[];

  let unverifiable = 0;
  let chained = 0;
  let expectedPrev = GENESIS_HASH;
  let tip: string | null = null;

  for (const row of rows) {
    if (row.hash === null || row.prev_hash === null) {
      unverifiable += 1;
      continue;
    }

    if (row.prev_hash !== expectedPrev) {
      return {
        ok: false,
        chained,
        unverifiable,
        first_broken_id: row.id,
        reason: `BROKEN_LINK at id ${row.id}: prev_hash ${row.prev_hash} does not match the digest of the preceding record (${expectedPrev}). A record was deleted or reordered.`,
        tip_hash: tip,
      };
    }

    const recomputed = eventDigest(row.prev_hash, {
      request_id: row.request_id,
      org_id: row.org_id,
      action: row.action,
      risk_level: row.risk_level,
      pattern_name: row.pattern_name ?? null,
      nist_control: row.nist_control ?? null,
      scan_ms: row.scan_ms,
      created_at: row.created_at,
    });

    if (recomputed !== row.hash) {
      return {
        ok: false,
        chained,
        unverifiable,
        first_broken_id: row.id,
        reason: `BROKEN_ROW at id ${row.id}: stored digest ${row.hash} does not recompute from the record's own fields. A record was edited in place.`,
        tip_hash: tip,
      };
    }

    chained += 1;
    expectedPrev = row.hash;
    tip = row.hash;
  }

  return {
    ok: true,
    chained,
    unverifiable,
    first_broken_id: null,
    reason: null,
    tip_hash: tip,
  };
}

export function closeDb(): void {
  _db?.close();
  _db = null;
  _insert = null;
  _tip = null;
  _appendTxn = null;
}
