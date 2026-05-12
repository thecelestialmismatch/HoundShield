/**
 * Hound Shield OODA — test suite.
 *
 * Covers all 4 phases + feedback loop with real in-memory SQLite via temp dirs.
 * No mocks for DB — exercises the real singleton with env-var-controlled paths.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

// ── Top-level imports ──────────────────────────────────────────────────────
// (ESM — no require() anywhere)

import { resetRateTracker, recordOrgRequest, recordUserRequest, getOrgRate, getUserRate } from "../rate-tracker.js";
import { amplifyRisk, detectFrameworks, orient } from "../orient.js";
import { decide } from "../decide.js";
import { planAction, redactMessages } from "../act.js";
import {
  getBaselineRow,
  upsertBaselineRow,
  incrementBlockCountRow,
  setLockoutUntilRow,
  addQuarantineRow,
  getQuarantineRows,
  updateQuarantineStatus,
  closeOodaDb,
} from "../db.js";
import {
  getBaseline,
  checkLockout,
  updateBaselineStats,
  resetBaselineCache,
} from "../baseline.js";
import { observe } from "../observe.js";
import { scanMessages } from "../../scanner.js";
import { closeDb } from "../../storage.js";

// ── Test isolation: fresh SQLite DB per test via tempDir ────────────────────

let tempDir: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "hs-ooda-test-"));
  process.env["HOUNDSHIELD_DATA_DIR"] = tempDir;
  // Reset all in-memory singletons so the new tempDir takes effect
  resetRateTracker();
  resetBaselineCache();
  closeOodaDb(); // forces getOodaDb() to reopen at new tempDir on next call
  closeDb();     // forces storage.ts to reopen at new tempDir on next call
});

afterEach(() => {
  closeOodaDb();
  closeDb();
  fs.rmSync(tempDir, { recursive: true, force: true });
  delete process.env["HOUNDSHIELD_DATA_DIR"];
});

// ── Rate tracker ───────────────────────────────────────────────────────────

describe("rate-tracker", () => {
  it("counts requests in sliding window", () => {
    resetRateTracker();
    const now = Date.now();
    recordOrgRequest("org-1", now);
    recordOrgRequest("org-1", now + 100);
    recordOrgRequest("org-1", now + 200);
    expect(getOrgRate("org-1", now + 500)).toBe(3);
  });

  it("expires requests outside 60s window", () => {
    resetRateTracker();
    const old = Date.now() - 61_000;
    recordOrgRequest("org-2", old);
    recordOrgRequest("org-2", old + 100);
    const now = Date.now();
    recordOrgRequest("org-2", now);
    expect(getOrgRate("org-2", now)).toBe(1);
  });

  it("tracks org and user independently", () => {
    resetRateTracker();
    const now = Date.now();
    recordOrgRequest("org-3", now);
    recordOrgRequest("org-3", now + 10);
    recordUserRequest("user-3", now);
    expect(getOrgRate("org-3", now + 50)).toBe(2);
    expect(getUserRate("user-3", now + 50)).toBe(1);
  });
});

// ── Orient: amplifyRisk ───────────────────────────────────────────────────

describe("orient.amplifyRisk", () => {
  it("no delta → no change", () => {
    expect(amplifyRisk("HIGH", 0)).toBe("HIGH");
    expect(amplifyRisk("NONE", 0)).toBe("NONE");
  });

  it("delta > 0.5 → upgrade 1 level", () => {
    expect(amplifyRisk("LOW", 0.6)).toBe("MEDIUM");
    expect(amplifyRisk("HIGH", 0.6)).toBe("CRITICAL");
  });

  it("delta > 1.0 → upgrade 2 levels", () => {
    expect(amplifyRisk("LOW", 1.1)).toBe("HIGH");
    expect(amplifyRisk("MEDIUM", 1.1)).toBe("CRITICAL");
  });

  it("never exceeds CRITICAL", () => {
    expect(amplifyRisk("CRITICAL", 2.0)).toBe("CRITICAL");
    expect(amplifyRisk("HIGH", 2.0)).toBe("CRITICAL");
  });
});

// ── Orient: detectFrameworks ──────────────────────────────────────────────

describe("orient.detectFrameworks", () => {
  it("CUI entity → CMMC", () => {
    const entities = [
      { pattern_name: "CUI marking", category: "CUI" as const, risk_level: "CRITICAL" as const, action: "BLOCK" as const },
    ];
    const result = detectFrameworks(entities);
    expect(result).toContain("CMMC");
    expect(result).not.toContain("HIPAA");
  });

  it("PHI entity → HIPAA", () => {
    const entities = [
      { pattern_name: "SSN", category: "PHI" as const, risk_level: "HIGH" as const, action: "BLOCK" as const },
    ];
    expect(detectFrameworks(entities)).toContain("HIPAA");
  });

  it("CREDENTIAL entity → SOC2", () => {
    const entities = [
      { pattern_name: "AWS secret key", category: "CREDENTIAL" as const, risk_level: "CRITICAL" as const, action: "BLOCK" as const },
    ];
    expect(detectFrameworks(entities)).toContain("SOC2");
  });

  it("ITAR only when nist_control includes ITAR", () => {
    const withItar = [
      { pattern_name: "ITAR", category: "IP" as const, risk_level: "CRITICAL" as const, action: "BLOCK" as const, nist_controls: ["ITAR"] },
    ];
    const withoutItar = [
      { pattern_name: "TDP reference", category: "IP" as const, risk_level: "HIGH" as const, action: "BLOCK" as const },
    ];
    expect(detectFrameworks(withItar)).toContain("ITAR");
    expect(detectFrameworks(withoutItar)).not.toContain("ITAR");
  });
});

// ── Orient: full orient() ─────────────────────────────────────────────────

describe("orient()", () => {
  const cleanBaseline = {
    entity_id: "org-clean",
    entity_type: "org" as const,
    avg_requests_per_hour: 10,
    typical_risk_level: "NONE" as const,
    active_hours: [9, 10, 11, 12, 13, 14, 15, 16, 17],
    block_count: 0,
    lockout_until: null,
    last_updated: Date.now(),
    sample_count: 20,
  };

  it("no behavioral signals → effective_risk equals scan risk", () => {
    const observation = {
      request_id: "r1", org_id: "org-1", user_id: "u1", session_id: "s1",
      messages: [], timestamp: Date.now(), provider: "openai",
      hour_of_day: 10, is_weekend: false,
      // org_requests_per_min: 0 → 0 req/hr, not a spike vs baseline of 10/hr
      session_request_count: 1, org_requests_per_min: 0, user_requests_per_min: 0,
    };
    const scanResult = { risk_level: "MEDIUM" as const, action: "QUARANTINE" as const, entities: [], scan_ms: 2 };
    const result = orient(observation, scanResult, cleanBaseline);
    expect(result.effective_risk).toBe("MEDIUM");
    expect(result.behavioral_risk_delta).toBe(0);
    expect(result.threat_signals).toHaveLength(0);
  });

  it("velocity spike detected when req/min × 60 > 3× baseline avg_req_hr", () => {
    const baselineWithHistory = { ...cleanBaseline, avg_requests_per_hour: 20, sample_count: 20 };
    const observation = {
      request_id: "r2", org_id: "org-1", user_id: "u1", session_id: "s1",
      messages: [], timestamp: Date.now(), provider: "openai",
      hour_of_day: 10, is_weekend: false,
      session_request_count: 5, org_requests_per_min: 5, user_requests_per_min: 5,
    };
    const scanResult = { risk_level: "NONE" as const, action: "ALLOW" as const, entities: [], scan_ms: 1 };
    const result = orient(observation, scanResult, baselineWithHistory);
    expect(result.is_velocity_spike).toBe(true);
    expect(result.threat_signals).toContain("velocity_spike");
  });

  it("anomalous_timing flagged for off-hours request", () => {
    const observation = {
      request_id: "r3", org_id: "org-1", user_id: "u1", session_id: "s1",
      messages: [], timestamp: Date.now(), provider: "openai",
      hour_of_day: 3, is_weekend: false, // 3am — not in active_hours
      session_request_count: 1, org_requests_per_min: 1, user_requests_per_min: 1,
    };
    const scanResult = { risk_level: "NONE" as const, action: "ALLOW" as const, entities: [], scan_ms: 1 };
    const result = orient(observation, scanResult, cleanBaseline);
    expect(result.is_anomalous_timing).toBe(true);
    expect(result.threat_signals).toContain("anomalous_timing");
  });
});

// ── Decide ─────────────────────────────────────────────────────────────────

describe("decide()", () => {
  const basePolicy = {
    org_id: "org-1",
    warn_before_block: true,
    redact_low_risk: false,
    max_requests_per_minute: 60,
    lockout_after_n_blocks: 5,
    lockout_duration_minutes: 60,
  };

  const cleanBaseline = {
    entity_id: "org-1",
    entity_type: "org" as const,
    avg_requests_per_hour: 0,
    typical_risk_level: "NONE" as const,
    active_hours: [],
    block_count: 0,
    lockout_until: null,
    last_updated: Date.now(),
    sample_count: 0,
  };

  type RiskLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  type DetectedEntity = {
    pattern_name: string;
    category: "PII" | "PHI" | "IP" | "CUI" | "CREDENTIAL";
    risk_level: RiskLevel;
    action: "ALLOW" | "BLOCK" | "QUARANTINE";
    nist_controls?: string[];
  };

  function makeOrientation(effective_risk: RiskLevel, extraEntities: DetectedEntity[] = []) {
    return {
      scan_result: {
        risk_level: effective_risk,
        action: (effective_risk === "NONE" ? "ALLOW" : "BLOCK") as "ALLOW" | "BLOCK" | "QUARANTINE",
        entities: extraEntities,
        scan_ms: 1,
      },
      behavioral_risk_delta: 0,
      is_anomalous_timing: false,
      is_velocity_spike: false,
      is_first_seen_pattern: false,
      effective_risk,
      threat_signals: [] as string[],
      frameworks: [] as ReadonlyArray<"CMMC" | "HIPAA" | "SOC2" | "ITAR">,
    };
  }

  it("CRITICAL → BLOCK (always)", () => {
    const result = decide(makeOrientation("CRITICAL"), cleanBaseline, basePolicy, false, false, 1);
    expect(result.action).toBe("BLOCK");
    expect(result.policy_id).toBe("critical_block");
  });

  it("HIGH + warn_before_block + no prior blocks → WARN", () => {
    const result = decide(makeOrientation("HIGH"), cleanBaseline, basePolicy, false, false, 1);
    expect(result.action).toBe("WARN");
    expect(result.policy_id).toBe("high_warn_first");
  });

  it("HIGH + warn_before_block + prior blocks → BLOCK", () => {
    const baselineWithBlocks = { ...cleanBaseline, block_count: 2 };
    const result = decide(makeOrientation("HIGH"), baselineWithBlocks, basePolicy, false, false, 1);
    expect(result.action).toBe("BLOCK");
    expect(result.policy_id).toBe("high_block");
  });

  it("HIGH + warn_before_block=false → BLOCK immediately", () => {
    const strictPolicy = { ...basePolicy, warn_before_block: false };
    const result = decide(makeOrientation("HIGH"), cleanBaseline, strictPolicy, false, false, 1);
    expect(result.action).toBe("BLOCK");
  });

  it("MEDIUM + PII-only + redact_low_risk=true → REDACT", () => {
    const piiPolicy = { ...basePolicy, redact_low_risk: true };
    const piiEntities: DetectedEntity[] = [
      { pattern_name: "Email address", category: "PII", risk_level: "MEDIUM", action: "QUARANTINE" },
      { pattern_name: "Phone number", category: "PII", risk_level: "LOW", action: "QUARANTINE" },
    ];
    const result = decide(makeOrientation("MEDIUM", piiEntities), cleanBaseline, piiPolicy, false, false, 1);
    expect(result.action).toBe("REDACT");
    expect(result.redaction_patterns).toContain("Email address");
  });

  it("MEDIUM + CUI entity + redact_low_risk=true → QUARANTINE (never REDACT CUI)", () => {
    const piiPolicy = { ...basePolicy, redact_low_risk: true };
    const cuiEntities: DetectedEntity[] = [
      { pattern_name: "CUI marking", category: "CUI", risk_level: "CRITICAL", action: "BLOCK" },
    ];
    const result = decide(makeOrientation("MEDIUM", cuiEntities), cleanBaseline, piiPolicy, false, false, 1);
    expect(result.action).toBe("QUARANTINE");
  });

  it("NONE + velocity + anomalous timing → WARN", () => {
    const o = { ...makeOrientation("NONE"), is_velocity_spike: true, is_anomalous_timing: true };
    const result = decide(o, cleanBaseline, basePolicy, false, false, 1);
    expect(result.action).toBe("WARN");
    expect(result.policy_id).toBe("behavioral_warn");
  });

  it("NONE → ALLOW", () => {
    const result = decide(makeOrientation("NONE"), cleanBaseline, basePolicy, false, false, 1);
    expect(result.action).toBe("ALLOW");
  });

  it("locked out → LOCKOUT regardless of risk", () => {
    const result = decide(makeOrientation("NONE"), cleanBaseline, basePolicy, true, false, 1);
    expect(result.action).toBe("LOCKOUT");
  });

  it("rate limit exceeded → BLOCK", () => {
    const result = decide(makeOrientation("NONE"), cleanBaseline, basePolicy, false, false, 100);
    expect(result.action).toBe("BLOCK");
    expect(result.policy_id).toBe("rate_limit");
  });
});

// ── Act: planAction ────────────────────────────────────────────────────────

describe("planAction()", () => {
  type OODAAction = "ALLOW" | "WARN" | "REDACT" | "QUARANTINE" | "BLOCK" | "LOCKOUT";

  function makeDecision(action: OODAAction) {
    return {
      action,
      reason: `Test: ${action}`,
      policy_id: "test",
      alert_manager: action !== "ALLOW",
      redaction_patterns: action === "REDACT" ? ["Email address"] : [] as string[],
      reputation_delta: 0,
    };
  }

  const orientation = {
    scan_result: { risk_level: "MEDIUM" as const, action: "QUARANTINE" as const, entities: [], scan_ms: 1 },
    behavioral_risk_delta: 0,
    is_anomalous_timing: false,
    is_velocity_spike: false,
    is_first_seen_pattern: false,
    effective_risk: "MEDIUM" as const,
    threat_signals: [] as string[],
    frameworks: [] as ReadonlyArray<"CMMC" | "HIPAA" | "SOC2" | "ITAR">,
  };

  it("ALLOW → should_forward=true, no error body", () => {
    const plan = planAction(makeDecision("ALLOW"), orientation, "req-1");
    expect(plan.should_forward).toBe(true);
    expect(plan.error_body).toBeUndefined();
    expect(plan.log_action).toBe("ALLOWED");
    expect(plan.increment_block_count).toBe(false);
  });

  it("WARN → should_forward=true, warning header set", () => {
    const plan = planAction(makeDecision("WARN"), orientation, "req-2");
    expect(plan.should_forward).toBe(true);
    expect(plan.extra_headers["X-HoundShield-Warning"]).toBeTruthy();
    expect(plan.log_action).toBe("WARNED");
  });

  it("REDACT → should_forward=true, log_action=REDACTED", () => {
    const plan = planAction(makeDecision("REDACT"), orientation, "req-3");
    expect(plan.should_forward).toBe(true);
    expect(plan.log_action).toBe("REDACTED");
    expect(plan.increment_block_count).toBe(false);
  });

  it("BLOCK → should_forward=false, status 403, increment_block_count=true", () => {
    const plan = planAction(makeDecision("BLOCK"), orientation, "req-4");
    expect(plan.should_forward).toBe(false);
    expect(plan.error_status).toBe(403);
    expect(plan.increment_block_count).toBe(true);
    expect(plan.log_action).toBe("BLOCKED");
  });

  it("QUARANTINE → should_forward=false, status 403, increment_block_count=false", () => {
    const plan = planAction(makeDecision("QUARANTINE"), orientation, "req-5");
    expect(plan.should_forward).toBe(false);
    expect(plan.error_status).toBe(403);
    expect(plan.increment_block_count).toBe(false);
    expect(plan.log_action).toBe("QUARANTINED");
  });

  it("LOCKOUT → should_forward=false, status 429", () => {
    const plan = planAction(makeDecision("LOCKOUT"), orientation, "req-6");
    expect(plan.should_forward).toBe(false);
    expect(plan.error_status).toBe(429);
    expect(plan.log_action).toBe("LOCKED_OUT");
  });
});

// ── Act: redactMessages ───────────────────────────────────────────────────

describe("redactMessages()", () => {
  it("replaces email matches with [REDACTED-PII]", () => {
    const messages = [
      { role: "user", content: "My email is john.doe@example.com please contact me" },
    ];
    const result = redactMessages(messages, ["Email address"]);
    const content = result[0]?.content as string;
    expect(content).not.toContain("john.doe@example.com");
    expect(content).toContain("[REDACTED-PII]");
  });

  it("leaves non-string content (arrays) untouched", () => {
    const messages = [
      { role: "user", content: [{ type: "image", url: "data:image/png;base64,xyz" }] },
    ];
    const result = redactMessages(messages, ["Email address"]);
    expect(result[0]?.content).toEqual(messages[0]?.content);
  });

  it("no-op when patternNames is empty", () => {
    const messages = [{ role: "user", content: "some content" }];
    const result = redactMessages(messages, []);
    expect(result[0]?.content).toBe("some content");
  });

  it("returns immutable copy — does not mutate input", () => {
    const messages = [{ role: "user", content: "my email is test@test.com" }];
    redactMessages(messages, ["Email address"]);
    expect(messages[0]?.content).toContain("test@test.com"); // original unchanged
  });
});

// ── DB: behavioral baselines ──────────────────────────────────────────────

describe("db: behavioral baselines", () => {
  it("getBaselineRow returns null for unknown entity", () => {
    expect(getBaselineRow("nonexistent-org")).toBeNull();
  });

  it("upsertBaselineRow then getBaselineRow round-trips correctly", () => {
    const baseline = {
      entity_id: "org-test",
      entity_type: "org" as const,
      avg_requests_per_hour: 5.5,
      typical_risk_level: "LOW" as const,
      active_hours: [9, 10, 11],
      block_count: 2,
      lockout_until: null,
      last_updated: Date.now(),
      sample_count: 10,
    };
    upsertBaselineRow(baseline);
    const fetched = getBaselineRow("org-test");
    expect(fetched).not.toBeNull();
    expect(fetched!.avg_requests_per_hour).toBeCloseTo(5.5);
    expect(fetched!.active_hours).toEqual([9, 10, 11]);
    expect(fetched!.block_count).toBe(2);
  });

  it("incrementBlockCountRow atomically increments", () => {
    upsertBaselineRow({
      entity_id: "org-increment",
      entity_type: "org",
      avg_requests_per_hour: 0,
      typical_risk_level: "NONE",
      active_hours: [],
      block_count: 3,
      lockout_until: null,
      last_updated: Date.now(),
      sample_count: 5,
    });
    incrementBlockCountRow("org-increment");
    incrementBlockCountRow("org-increment");
    expect(getBaselineRow("org-increment")!.block_count).toBe(5);
  });

  it("setLockoutUntilRow persists lockout timestamp", () => {
    upsertBaselineRow({
      entity_id: "org-lockout",
      entity_type: "org",
      avg_requests_per_hour: 0,
      typical_risk_level: "NONE",
      active_hours: [],
      block_count: 5,
      lockout_until: null,
      last_updated: Date.now(),
      sample_count: 5,
    });
    const lockoutTime = Date.now() + 60_000;
    setLockoutUntilRow("org-lockout", lockoutTime);
    expect(getBaselineRow("org-lockout")!.lockout_until).toBe(lockoutTime);
  });
});

// ── Baseline: lockout check ───────────────────────────────────────────────

describe("baseline: checkLockout", () => {
  it("returns false when no baseline exists", () => {
    expect(checkLockout("org-never-seen", "org")).toBe(false);
  });

  it("returns true when lockout_until is in the future", () => {
    upsertBaselineRow({
      entity_id: "org-locked",
      entity_type: "org",
      avg_requests_per_hour: 0,
      typical_risk_level: "NONE",
      active_hours: [],
      block_count: 5,
      lockout_until: Date.now() + 999_999,
      last_updated: Date.now(),
      sample_count: 5,
    });
    resetBaselineCache(); // force re-read from DB
    expect(checkLockout("org-locked", "org")).toBe(true);
  });

  it("returns false when lockout_until has already expired", () => {
    upsertBaselineRow({
      entity_id: "org-expired",
      entity_type: "org",
      avg_requests_per_hour: 0,
      typical_risk_level: "NONE",
      active_hours: [],
      block_count: 5,
      lockout_until: Date.now() - 1000,
      last_updated: Date.now(),
      sample_count: 5,
    });
    resetBaselineCache();
    expect(checkLockout("org-expired", "org")).toBe(false);
  });
});

// ── Baseline: updateBaselineStats ─────────────────────────────────────────

describe("baseline: updateBaselineStats", () => {
  it("EMA builds avg_requests_per_hour toward observed rate", () => {
    const before = getBaselineRow("org-ema")?.sample_count ?? 0;
    for (let i = 0; i < 10; i++) {
      updateBaselineStats("org-ema", "org", 10, "NONE", 2, Date.now());
    }
    const row = getBaselineRow("org-ema");
    expect(row).not.toBeNull();
    expect(row!.avg_requests_per_hour).toBeGreaterThan(0);
    expect(row!.sample_count).toBe(before + 10);
  });

  it("active_hours accumulates observed hours without duplicates", () => {
    updateBaselineStats("org-hours", "org", 9, "NONE", 1, Date.now());
    updateBaselineStats("org-hours", "org", 14, "NONE", 1, Date.now());
    updateBaselineStats("org-hours", "org", 9, "NONE", 1, Date.now()); // dup
    const row = getBaselineRow("org-hours");
    expect(row!.active_hours).toContain(9);
    expect(row!.active_hours).toContain(14);
    expect(row!.active_hours).toHaveLength(2);
  });

  it("typical_risk_level ratchets up to observed max", () => {
    updateBaselineStats("org-risk", "org", 10, "LOW", 1, Date.now());
    updateBaselineStats("org-risk", "org", 10, "MEDIUM", 1, Date.now());
    updateBaselineStats("org-risk", "org", 10, "LOW", 1, Date.now());
    expect(getBaselineRow("org-risk")!.typical_risk_level).toBe("MEDIUM");
  });
});

// ── DB: quarantine queue ───────────────────────────────────────────────────

describe("db: quarantine queue", () => {
  it("addQuarantineRow → getQuarantineRows returns pending entry", () => {
    addQuarantineRow({
      request_id: "req-q1",
      org_id: "org-1",
      user_id: "user-1",
      pattern_name: "CUI marking",
      risk_level: "CRITICAL",
      scan_ms: 5,
      status: "pending",
    });
    const rows = getQuarantineRows("org-1", "pending");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.request_id).toBe("req-q1");
  });

  it("updateQuarantineStatus moves entry from pending to blocked", () => {
    addQuarantineRow({
      request_id: "req-q2",
      org_id: "org-1",
      user_id: "user-1",
      risk_level: "HIGH",
      scan_ms: 3,
      status: "pending",
    });
    updateQuarantineStatus("req-q2", "blocked", "admin@org.com");
    const pending = getQuarantineRows("org-1", "pending");
    const blocked = getQuarantineRows("org-1", "blocked");
    expect(pending.find((r) => r.request_id === "req-q2")).toBeUndefined();
    expect(blocked.find((r) => r.request_id === "req-q2")).toBeDefined();
  });
});

// ── Integration: observe → orient → decide chain ─────────────────────────

describe("OODA integration: observe → orient → decide", () => {
  const orgBaseline = {
    entity_id: "org-int",
    entity_type: "org" as const,
    avg_requests_per_hour: 10,
    typical_risk_level: "NONE" as const,
    active_hours: [9, 10, 11, 12, 13, 14, 15, 16, 17],
    block_count: 0,
    lockout_until: null,
    last_updated: Date.now(),
    sample_count: 20,
  };

  const policy = {
    org_id: "org-int",
    warn_before_block: true,
    redact_low_risk: false,
    max_requests_per_minute: 60,
    lockout_after_n_blocks: 5,
    lockout_duration_minutes: 60,
  };

  it("clean message with no CUI → ALLOW with NONE effective_risk", () => {
    resetRateTracker();
    const ctx = {
      request_id: "int-1",
      org_id: "org-int",
      user_id: "user-1",
      session_id: "sess-1",
      messages: [{ role: "user", content: "What is the weather today?" }],
      provider: "openai",
      upstream_key: "sk-test",
      upstream_url: "http://localhost",
      stream: false as boolean | undefined,
      rest: {} as Record<string, unknown>,
    };
    const now = new Date();
    now.setHours(10, 0, 0, 0);
    const obs = observe(ctx, now.getTime());
    const scan = scanMessages(ctx.messages as Array<{ role: string; content: unknown }>);
    const ori = orient(obs, scan, orgBaseline);
    const dec = decide(ori, orgBaseline, policy, false, false, obs.org_requests_per_min);
    expect(dec.action).toBe("ALLOW");
    expect(ori.effective_risk).toBe("NONE");
  });

  it("CUI-marked message → BLOCK, CMMC framework detected", () => {
    resetRateTracker();
    const ctx = {
      request_id: "int-2",
      org_id: "org-int",
      user_id: "user-1",
      session_id: "sess-1",
      messages: [{ role: "user", content: "CUI//SP-EXPT This is a technical data package" }],
      provider: "openai",
      upstream_key: "sk-test",
      upstream_url: "http://localhost",
      stream: false as boolean | undefined,
      rest: {} as Record<string, unknown>,
    };
    const obs = observe(ctx, Date.now());
    const scan = scanMessages(ctx.messages as Array<{ role: string; content: unknown }>);
    const ori = orient(obs, scan, orgBaseline);
    const dec = decide(ori, orgBaseline, policy, false, false, obs.org_requests_per_min);
    expect(dec.action).toBe("BLOCK");
    expect(ori.frameworks).toContain("CMMC");
    expect(scan.risk_level).toBe("CRITICAL");
  });

  it("getBaseline creates empty baseline for new org", () => {
    const baseline = getBaseline("org-brand-new", "org");
    expect(baseline.entity_id).toBe("org-brand-new");
    expect(baseline.block_count).toBe(0);
    expect(baseline.sample_count).toBe(0);
    expect(baseline.typical_risk_level).toBe("NONE");
  });
});
