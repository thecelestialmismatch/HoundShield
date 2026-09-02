/**
 * Hash-chain integrity tests for the Mode B audit log.
 *
 * This is the test suite behind the sentence the product is sold on: "a
 * SHA-256 tamper-evident audit trail, generated from a 14-day run in your own
 * environment". Before the chain existed, `proxy_events` was a flat table and
 * that sentence had nothing behind it inside the customer boundary.
 *
 * A tamper-evidence claim is only worth the tampering you can actually
 * demonstrate being caught, so every test here EDITS THE DATABASE the way an
 * attacker or a careless operator would — `UPDATE`, `DELETE`, and a forged
 * insert — and asserts the specific verdict. A suite that only checked
 * "verifyChain returns ok on data it just wrote" would pass against a function
 * that returned `{ok:true}` unconditionally.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Database from "better-sqlite3";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let dir: string;

/**
 * Fresh module registry + fresh data dir, so no test sees another's chain.
 *
 * `storage.ts` memoises its database handle and prepared statements in module
 * scope, so re-importing without resetting would hand back a handle pointing at
 * the previous test's temp directory.
 */
async function freshStorage(): Promise<typeof import("../storage.js")> {
  vi.resetModules();
  return await import("../storage.js");
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "hs-chain-"));
  process.env.HOUNDSHIELD_DATA_DIR = dir;
});

afterEach(() => {
  delete process.env.HOUNDSHIELD_DATA_DIR;
  rmSync(dir, { recursive: true, force: true });
});

const EVENT = {
  request_id: "req-1",
  org_id: "org_42",
  action: "BLOCKED" as const,
  risk_level: "CRITICAL",
  pattern_name: "CUI marking",
  nist_control: "SC.3.177",
  scan_ms: 3,
};

/** Direct handle to the same file the module writes, for tampering. */
function raw() {
  return new Database(join(dir, "houndshield-events.db"));
}

describe("audit chain — construction", () => {
  it("links the first event to the genesis hash", async () => {
    const s = await freshStorage();
    s.logEvent(EVENT);

    const [row] = s.queryEvents();
    expect(row.prev_hash).toBe(s.GENESIS_HASH);
    expect(row.hash).toMatch(/^[a-f0-9]{64}$/);
    s.closeDb();
  });

  it("links each event to the digest of the one before it", async () => {
    const s = await freshStorage();
    s.logEvent({ ...EVENT, request_id: "a" });
    s.logEvent({ ...EVENT, request_id: "b" });
    s.logEvent({ ...EVENT, request_id: "c" });

    const db = raw();
    const rows = db.prepare("SELECT * FROM proxy_events ORDER BY id ASC").all() as Array<{
      hash: string;
      prev_hash: string;
    }>;
    db.close();

    expect(rows[1].prev_hash).toBe(rows[0].hash);
    expect(rows[2].prev_hash).toBe(rows[1].hash);
    s.closeDb();
  });

  it("gives two identical events different digests, because the chain moved", async () => {
    // If the digest did not cover prev_hash, duplicate events would collide and
    // a whole run of them could be reordered undetected.
    const s = await freshStorage();
    s.logEvent({ ...EVENT, created_at: "2026-09-02T00:00:00.000Z" });
    s.logEvent({ ...EVENT, created_at: "2026-09-02T00:00:00.000Z" });

    const db = raw();
    const rows = db.prepare("SELECT hash FROM proxy_events ORDER BY id ASC").all() as Array<{
      hash: string;
    }>;
    db.close();

    expect(rows[0].hash).not.toBe(rows[1].hash);
    s.closeDb();
  });

  it("verifies clean on an untouched log", async () => {
    const s = await freshStorage();
    for (let i = 0; i < 5; i++) s.logEvent({ ...EVENT, request_id: `r${i}` });

    const result = s.verifyChain();
    expect(result.ok).toBe(true);
    expect(result.chained).toBe(5);
    expect(result.unverifiable).toBe(0);
    expect(result.first_broken_id).toBeNull();
    expect(result.tip_hash).toMatch(/^[a-f0-9]{64}$/);
    s.closeDb();
  });

  it("verifies clean on an empty log rather than erroring", async () => {
    const s = await freshStorage();
    const result = s.verifyChain();
    expect(result.ok).toBe(true);
    expect(result.chained).toBe(0);
    expect(result.tip_hash).toBeNull();
    s.closeDb();
  });
});

describe("audit chain — detects tampering", () => {
  it("catches a record edited in place, and names the row", async () => {
    const s = await freshStorage();
    s.logEvent({ ...EVENT, request_id: "a" });
    s.logEvent({ ...EVENT, request_id: "b", action: "BLOCKED" });
    s.logEvent({ ...EVENT, request_id: "c" });
    s.closeDb();

    // The realistic edit: turn a BLOCKED CUI event into an ALLOWED one, so the
    // evidence pack no longer shows the violation.
    const db = raw();
    const target = db.prepare("SELECT id FROM proxy_events WHERE request_id='b'").get() as {
      id: number;
    };
    db.prepare("UPDATE proxy_events SET action='ALLOWED' WHERE id=?").run(target.id);
    db.close();

    const s2 = await freshStorage();
    const result = s2.verifyChain();

    expect(result.ok).toBe(false);
    expect(result.first_broken_id).toBe(target.id);
    expect(result.reason).toContain("BROKEN_ROW");
    s2.closeDb();
  });

  it("catches a deleted record", async () => {
    const s = await freshStorage();
    s.logEvent({ ...EVENT, request_id: "a" });
    s.logEvent({ ...EVENT, request_id: "b" });
    s.logEvent({ ...EVENT, request_id: "c" });
    s.closeDb();

    const db = raw();
    const ids = db.prepare("SELECT id FROM proxy_events ORDER BY id ASC").all() as Array<{
      id: number;
    }>;
    db.prepare("DELETE FROM proxy_events WHERE id=?").run(ids[1].id);
    db.close();

    const s2 = await freshStorage();
    const result = s2.verifyChain();

    expect(result.ok).toBe(false);
    // The row AFTER the hole is where the break surfaces: its prev_hash names a
    // digest that is no longer its predecessor's.
    expect(result.first_broken_id).toBe(ids[2].id);
    expect(result.reason).toContain("BROKEN_LINK");
    s2.closeDb();
  });

  it("catches a forged record appended by hand", async () => {
    const s = await freshStorage();
    s.logEvent({ ...EVENT, request_id: "a" });
    s.closeDb();

    // Someone with the volume mounted inserts a clean-looking ALLOWED row and
    // invents a plausible digest.
    const db = raw();
    db.prepare(
      `INSERT INTO proxy_events (request_id, org_id, action, risk_level, scan_ms, created_at, prev_hash, hash)
       VALUES ('forged','org_42','ALLOWED','NONE',1,'2026-09-02T00:00:00.000Z', ?, ?)`
    ).run("f".repeat(64), "e".repeat(64));
    const forged = db.prepare("SELECT id FROM proxy_events WHERE request_id='forged'").get() as {
      id: number;
    };
    db.close();

    const s2 = await freshStorage();
    const result = s2.verifyChain();

    expect(result.ok).toBe(false);
    expect(result.first_broken_id).toBe(forged.id);
    s2.closeDb();
  });

  it("catches a timestamp backdated to move an event out of the audit window", async () => {
    const s = await freshStorage();
    s.logEvent({ ...EVENT, request_id: "a" });
    s.closeDb();

    const db = raw();
    const row = db.prepare("SELECT id FROM proxy_events").get() as { id: number };
    db.prepare("UPDATE proxy_events SET created_at='2020-01-01T00:00:00.000Z' WHERE id=?").run(
      row.id
    );
    db.close();

    const s2 = await freshStorage();
    expect(s2.verifyChain().ok).toBe(false);
    s2.closeDb();
  });
});

describe("audit chain — legacy rows are unverifiable, not tampered", () => {
  it("reports pre-chain rows separately and still verifies the rows after them", async () => {
    /*
     * A database written by the previous release has rows with no digest. They
     * cannot be retro-hashed — inventing digests for records whose integrity
     * was never protected is manufacturing evidence. The honest report is
     * "outside the guarantee", and the guarantee still has to hold for
     * everything written after the upgrade.
     */
    const s = await freshStorage();
    s.logEvent({ ...EVENT, request_id: "chained-1" });
    s.closeDb();

    const db = raw();
    db.prepare(
      `INSERT INTO proxy_events (request_id, org_id, action, risk_level, scan_ms, created_at)
       VALUES ('legacy','org_42','ALLOWED','NONE',1,'2026-01-01T00:00:00.000Z')`
    ).run();
    db.close();

    const s2 = await freshStorage();
    s2.logEvent({ ...EVENT, request_id: "chained-2" });
    const result = s2.verifyChain();

    expect(result.ok).toBe(true);
    expect(result.unverifiable).toBe(1);
    expect(result.chained).toBe(2);
    s2.closeDb();
  });

  it("opens an old database without losing its rows", async () => {
    // The ALTER TABLE upgrade path, exercised against a table created without
    // the chain columns at all.
    const db = new Database(join(dir, "houndshield-events.db"));
    db.prepare(
      `CREATE TABLE proxy_events (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         request_id TEXT NOT NULL, org_id TEXT NOT NULL DEFAULT '',
         action TEXT NOT NULL, risk_level TEXT NOT NULL,
         pattern_name TEXT, nist_control TEXT,
         scan_ms INTEGER NOT NULL DEFAULT 0,
         created_at TEXT NOT NULL DEFAULT (datetime('now')))`
    ).run();
    db.prepare(
      `INSERT INTO proxy_events (request_id, org_id, action, risk_level, scan_ms)
       VALUES ('old','org_1','BLOCKED','HIGH',2)`
    ).run();
    db.close();

    const s = await freshStorage();
    s.logEvent({ ...EVENT, request_id: "new" });

    expect(s.queryEvents()).toHaveLength(2);
    expect(s.verifyChain()).toMatchObject({ ok: true, unverifiable: 1, chained: 1 });
    s.closeDb();
  });
});

describe("audit chain — the log still does its original job", () => {
  it("stores no prompt text, only metadata", async () => {
    const s = await freshStorage();
    s.logEvent(EVENT);

    const db = raw();
    const cols = (db.prepare("PRAGMA table_info(proxy_events)").all() as Array<{ name: string }>)
      .map((c) => c.name)
      .sort();
    db.close();

    // The boundary, asserted rather than commented: no column can hold prompt
    // content, matched substrings or user identity.
    expect(cols).toEqual([
      "action",
      "created_at",
      "hash",
      "id",
      "nist_control",
      "org_id",
      "pattern_name",
      "prev_hash",
      "request_id",
      "risk_level",
      "scan_ms",
    ]);
    s.closeDb();
  });

  it("keeps getStats accurate alongside the chain", async () => {
    const s = await freshStorage();
    s.logEvent({ ...EVENT, action: "BLOCKED" });
    s.logEvent({ ...EVENT, action: "ALLOWED" });
    s.logEvent({ ...EVENT, action: "QUARANTINED" });

    expect(s.getStats()).toMatchObject({
      total: 3,
      blocked: 1,
      allowed: 1,
      quarantined: 1,
    });
    s.closeDb();
  });

  it("never throws out of the audit path, even on a broken database", async () => {
    /*
     * A proxy that 500s its customer's production AI traffic because SQLite
     * blipped is a worse outage than a gap in the log, and the safety decision
     * (block / quarantine) was already made and enforced before logEvent runs.
     *
     * Simulated by dropping the table out from under the prepared statements —
     * the closest reachable analogue of a corrupted or unwritable store.
     */
    const s = await freshStorage();
    s.logEvent(EVENT);

    const db = raw();
    db.prepare("DROP TABLE proxy_events").run();
    db.close();

    expect(() => s.logEvent(EVENT)).not.toThrow();
    s.closeDb();
  });
});
