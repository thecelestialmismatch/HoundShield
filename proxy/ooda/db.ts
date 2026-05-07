/**
 * Hound Shield OODA — SQLite persistence layer.
 *
 * Three tables augment the existing proxy_events table:
 *   behavioral_baselines  — per-org/user behavior history
 *   org_policies          — per-org policy overrides
 *   quarantine_queue      — held requests pending human review
 *
 * Uses the same DB file as storage.ts (shared singleton pattern).
 * WAL mode already set by storage.ts initializer.
 */

import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import type { BehavioralBaseline, OrgPolicy } from "./types.js";

// ── DB singleton ───────────────────────────────────────────────────────────

const DB_DIR = process.env.HOUNDSHIELD_DATA_DIR ?? path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "houndshield-events.db");

let _db: Database.Database | null = null;

export function getOodaDb(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(DB_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("synchronous = NORMAL");
  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database): void {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS behavioral_baselines (
      entity_id              TEXT PRIMARY KEY,
      entity_type            TEXT NOT NULL CHECK(entity_type IN ('org','user')),
      avg_requests_per_hour  REAL NOT NULL DEFAULT 0,
      typical_risk_level     TEXT NOT NULL DEFAULT 'NONE',
      active_hours           TEXT NOT NULL DEFAULT '[]',
      block_count            INTEGER NOT NULL DEFAULT 0,
      lockout_until          INTEGER,
      last_updated           INTEGER NOT NULL,
      sample_count           INTEGER NOT NULL DEFAULT 0
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS org_policies (
      org_id                   TEXT PRIMARY KEY,
      warn_before_block        INTEGER NOT NULL DEFAULT 1,
      redact_low_risk          INTEGER NOT NULL DEFAULT 0,
      max_requests_per_minute  INTEGER NOT NULL DEFAULT 60,
      lockout_after_n_blocks   INTEGER NOT NULL DEFAULT 5,
      lockout_duration_minutes INTEGER NOT NULL DEFAULT 60
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS quarantine_queue (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id   TEXT NOT NULL UNIQUE,
      org_id       TEXT NOT NULL,
      user_id      TEXT NOT NULL DEFAULT '',
      pattern_name TEXT,
      risk_level   TEXT NOT NULL,
      nist_control TEXT,
      scan_ms      INTEGER NOT NULL DEFAULT 0,
      status       TEXT NOT NULL DEFAULT 'pending'
                     CHECK(status IN ('pending','released','blocked')),
      reviewed_by  TEXT,
      reviewed_at  TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_baselines_entity_type ON behavioral_baselines(entity_type)`
  ).run();

  db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_quarantine_status ON quarantine_queue(status)`
  ).run();

  db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_quarantine_org ON quarantine_queue(org_id)`
  ).run();
}

// ── Behavioral baseline rows ────────────────────────────────────────────────

interface BaselineRow {
  entity_id: string;
  entity_type: string;
  avg_requests_per_hour: number;
  typical_risk_level: string;
  active_hours: string; // JSON
  block_count: number;
  lockout_until: number | null;
  last_updated: number;
  sample_count: number;
}

function rowToBaseline(row: BaselineRow): BehavioralBaseline {
  return {
    entity_id: row.entity_id,
    entity_type: row.entity_type as "org" | "user",
    avg_requests_per_hour: row.avg_requests_per_hour,
    typical_risk_level: row.typical_risk_level as BehavioralBaseline["typical_risk_level"],
    active_hours: JSON.parse(row.active_hours) as number[],
    block_count: row.block_count,
    lockout_until: row.lockout_until ?? null,
    last_updated: row.last_updated,
    sample_count: row.sample_count,
  };
}

export function getBaselineRow(entityId: string): BehavioralBaseline | null {
  const row = getOodaDb()
    .prepare("SELECT * FROM behavioral_baselines WHERE entity_id = ?")
    .get(entityId) as BaselineRow | undefined;
  return row ? rowToBaseline(row) : null;
}

export function upsertBaselineRow(baseline: BehavioralBaseline): void {
  getOodaDb()
    .prepare(`
      INSERT INTO behavioral_baselines
        (entity_id, entity_type, avg_requests_per_hour, typical_risk_level,
         active_hours, block_count, lockout_until, last_updated, sample_count)
      VALUES
        (@entity_id, @entity_type, @avg_requests_per_hour, @typical_risk_level,
         @active_hours, @block_count, @lockout_until, @last_updated, @sample_count)
      ON CONFLICT(entity_id) DO UPDATE SET
        avg_requests_per_hour = excluded.avg_requests_per_hour,
        typical_risk_level    = excluded.typical_risk_level,
        active_hours          = excluded.active_hours,
        block_count           = excluded.block_count,
        lockout_until         = excluded.lockout_until,
        last_updated          = excluded.last_updated,
        sample_count          = excluded.sample_count
    `)
    .run({
      ...baseline,
      active_hours: JSON.stringify(baseline.active_hours),
    });
}

/** Atomic increment — safe under concurrent requests. */
export function incrementBlockCountRow(entityId: string): void {
  getOodaDb()
    .prepare(
      "UPDATE behavioral_baselines SET block_count = block_count + 1 WHERE entity_id = ?"
    )
    .run(entityId);
}

export function setLockoutUntilRow(entityId: string, lockoutUntilMs: number | null): void {
  getOodaDb()
    .prepare("UPDATE behavioral_baselines SET lockout_until = ? WHERE entity_id = ?")
    .run(lockoutUntilMs, entityId);
}

// ── Org policy rows ────────────────────────────────────────────────────────

interface PolicyRow {
  org_id: string;
  warn_before_block: number; // SQLite stores booleans as 0/1
  redact_low_risk: number;
  max_requests_per_minute: number;
  lockout_after_n_blocks: number;
  lockout_duration_minutes: number;
}

function rowToPolicy(row: PolicyRow): OrgPolicy {
  return {
    org_id: row.org_id,
    warn_before_block: row.warn_before_block === 1,
    redact_low_risk: row.redact_low_risk === 1,
    max_requests_per_minute: row.max_requests_per_minute,
    lockout_after_n_blocks: row.lockout_after_n_blocks,
    lockout_duration_minutes: row.lockout_duration_minutes,
  };
}

export function getOrgPolicyRow(orgId: string): OrgPolicy | null {
  const row = getOodaDb()
    .prepare("SELECT * FROM org_policies WHERE org_id = ?")
    .get(orgId) as PolicyRow | undefined;
  return row ? rowToPolicy(row) : null;
}

export function upsertOrgPolicyRow(policy: OrgPolicy): void {
  getOodaDb()
    .prepare(`
      INSERT INTO org_policies
        (org_id, warn_before_block, redact_low_risk, max_requests_per_minute,
         lockout_after_n_blocks, lockout_duration_minutes)
      VALUES
        (@org_id, @warn_before_block, @redact_low_risk, @max_requests_per_minute,
         @lockout_after_n_blocks, @lockout_duration_minutes)
      ON CONFLICT(org_id) DO UPDATE SET
        warn_before_block        = excluded.warn_before_block,
        redact_low_risk          = excluded.redact_low_risk,
        max_requests_per_minute  = excluded.max_requests_per_minute,
        lockout_after_n_blocks   = excluded.lockout_after_n_blocks,
        lockout_duration_minutes = excluded.lockout_duration_minutes
    `)
    .run({
      ...policy,
      warn_before_block: policy.warn_before_block ? 1 : 0,
      redact_low_risk: policy.redact_low_risk ? 1 : 0,
    });
}

// ── Quarantine queue rows ──────────────────────────────────────────────────

export interface QuarantineRow {
  id?: number;
  request_id: string;
  org_id: string;
  user_id: string;
  pattern_name?: string;
  risk_level: string;
  nist_control?: string;
  scan_ms: number;
  status: "pending" | "released" | "blocked";
  reviewed_by?: string;
  reviewed_at?: string;
  created_at?: string;
}

export function addQuarantineRow(row: Omit<QuarantineRow, "id" | "created_at">): void {
  // better-sqlite3 requires all named params to be present (undefined → error)
  getOodaDb()
    .prepare(`
      INSERT OR IGNORE INTO quarantine_queue
        (request_id, org_id, user_id, pattern_name, risk_level, nist_control, scan_ms, status)
      VALUES
        (@request_id, @org_id, @user_id, @pattern_name, @risk_level, @nist_control, @scan_ms, @status)
    `)
    .run({
      pattern_name: null,
      nist_control: null,
      reviewed_by: null,
      reviewed_at: null,
      ...row,
    });
}

export function getQuarantineRows(
  orgId: string,
  status: "pending" | "released" | "blocked" = "pending",
  limit = 100
): QuarantineRow[] {
  return getOodaDb()
    .prepare(
      "SELECT * FROM quarantine_queue WHERE org_id = ? AND status = ? ORDER BY created_at DESC LIMIT ?"
    )
    .all(orgId, status, limit) as QuarantineRow[];
}

export function updateQuarantineStatus(
  requestId: string,
  status: "released" | "blocked",
  reviewedBy: string
): void {
  getOodaDb()
    .prepare(`
      UPDATE quarantine_queue
      SET status = ?, reviewed_by = ?, reviewed_at = datetime('now')
      WHERE request_id = ?
    `)
    .run(status, reviewedBy, requestId);
}

export function closeOodaDb(): void {
  _db?.close();
  _db = null;
}
