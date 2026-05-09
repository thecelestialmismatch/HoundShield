/**
 * Hound Shield Proxy — local SQLite event log.
 *
 * Stores metadata ONLY. Never stores prompt text, CUI content, or user data.
 * Schema fields: timestamp, action, pattern_name, risk_level, request_id, org_id, scan_ms.
 *
 * Written with better-sqlite3 (synchronous API — safe in single-threaded Node.js).
 */

import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

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

// ── Init ────────────────────────────────────────────────────────────────────

const DB_DIR = process.env.HOUNDSHIELD_DATA_DIR ?? path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "houndshield-events.db");

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
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

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

function insertStmt(): Database.Statement {
  if (!_insert) {
    _insert = getDb().prepare(`
      INSERT INTO proxy_events (request_id, org_id, action, risk_level, pattern_name, nist_control, scan_ms)
      VALUES (@request_id, @org_id, @action, @risk_level, @pattern_name, @nist_control, @scan_ms)
    `);
  }
  return _insert;
}

export function logEvent(event: ProxyEvent): void {
  insertStmt().run(event);
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

export function closeDb(): void {
  _db?.close();
  _db = null;
  _insert = null;
}
