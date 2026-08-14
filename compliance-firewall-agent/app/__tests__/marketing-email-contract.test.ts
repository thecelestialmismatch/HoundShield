import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  canSendMarketing,
  marketingBlockReason,
  marketingFooter,
  marketingHeaders,
  postalAddress,
  unsubscribeToken,
  unsubscribeUrl,
  verifyUnsubscribeToken,
} from "@/lib/legal/marketing-email";

/**
 * CAN-SPAM contract for marketing email — 15 U.S.C. §7704.
 *
 * The three onboarding emails had no unsubscribe link, no postal address, and
 * nowhere to record an opt-out. Penalties are assessed per message, and the
 * drip goes live the moment the deployment topology is fixed, so "not sending
 * yet" is a timing accident rather than a defence.
 */

const ROOT = process.cwd();
const TEMPLATES = join(ROOT, "lib", "email", "templates");

/**
 * Which templates are commercial, and which are relationship messages.
 *
 * TRANSACTIONAL is an EXPLICIT allow-list so that a NEW template is treated as
 * marketing by default and caught by the coverage test below. An allow-list of
 * marketing templates would fail open — someone adds `promo.ts`, nothing
 * notices, and the first send is the violation.
 *
 * `upgrade` sits in the transactional list on the evidence of its own content,
 * not its filename: subject "…receipt inside", body "Payment confirmed" and a
 * link to the invoice in the billing portal. That is a message confirming a
 * commercial transaction the recipient already agreed to — §7702(17)(A)(iii) —
 * and adding "unsubscribe" to a payment receipt would invite someone to opt out
 * of mail we are obliged to send.
 */
const TRANSACTIONAL = new Set([
  "report-order.ts", // $499 order confirmation + fulfilment instructions
  "canceled.ts", // account status change
  "partner-welcome.ts", // acknowledges an application the recipient submitted
  "upgrade.ts", // payment receipt
]);

function templateFiles(): string[] {
  return readdirSync(TEMPLATES).filter((f) => f.endsWith(".ts"));
}

const ENV = ["MARKETING_POSTAL_ADDRESS", "UNSUBSCRIBE_SECRET", "SUPABASE_SERVICE_ROLE_KEY"] as const;
let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(ENV.map((k) => [k, process.env[k]]));
});
afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

function configured() {
  process.env.MARKETING_POSTAL_ADDRESS = "HoundShield, 1 Example St, Wilmington DE 19801";
  process.env.UNSUBSCRIBE_SECRET = "test-unsubscribe-secret";
}

describe("marketing sending fails CLOSED without the statutory elements", () => {
  it("refuses to send with no postal address", () => {
    delete process.env.MARKETING_POSTAL_ADDRESS;
    process.env.UNSUBSCRIBE_SECRET = "x";
    expect(postalAddress()).toBeNull();
    expect(canSendMarketing("user-1")).toBe(false);
    // §7704(a)(5) — the address is not optional, so neither is the refusal.
    expect(marketingBlockReason()).toMatch(/postal address/i);
  });

  it("refuses to send when unsubscribe links cannot be signed", () => {
    process.env.MARKETING_POSTAL_ADDRESS = "somewhere";
    delete process.env.UNSUBSCRIBE_SECRET;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(canSendMarketing("user-1")).toBe(false);
    expect(marketingBlockReason()).toMatch(/unsubscribe/i);
  });

  it("produces no footer and no headers when it cannot send", () => {
    // A caller that ignores canSendMarketing() still cannot build a
    // non-compliant message — the pieces simply do not exist.
    delete process.env.MARKETING_POSTAL_ADDRESS;
    expect(marketingFooter("user-1")).toBeNull();
    expect(marketingHeaders("user-1")).toBeNull();
  });

  it("sends once both elements are present", () => {
    configured();
    expect(canSendMarketing("user-1")).toBe(true);
    expect(marketingBlockReason()).toBeNull();
  });
});

describe("the footer carries what the statute requires", () => {
  beforeEach(configured);

  it("contains an unsubscribe link and the postal address", () => {
    const footer = marketingFooter("user-1")!;
    expect(footer).toContain("/api/email/unsubscribe");
    expect(footer).toContain("Wilmington DE 19801");
    expect(footer).toMatch(/unsubscribe/i);
  });

  it("says the opt-out does not stop transactional mail", () => {
    // Otherwise a recipient reasonably believes unsubscribing also stops
    // receipts and security notices — which we must keep sending.
    expect(marketingFooter("user-1")!).toMatch(/receipts|security notices/i);
  });

  it("emits RFC 8058 one-click headers", () => {
    // Required by Gmail/Yahoo bulk-sender rules since Feb 2024 — without it
    // the mail is filtered regardless of CAN-SPAM compliance.
    const headers = marketingHeaders("user-1")!;
    expect(headers["List-Unsubscribe"]).toMatch(/^<https?:\/\/.+>$/);
    expect(headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });
});

describe("unsubscribe tokens are not forgeable", () => {
  beforeEach(configured);

  it("verifies a token it issued", () => {
    const token = unsubscribeToken("user-1")!;
    expect(verifyUnsubscribeToken("user-1", token)).toBe(true);
  });

  it("rejects another user's token", () => {
    // The endpoint is unauthenticated by necessity (§7704(a)(3) forbids extra
    // obligations), so the token is the only thing standing between a stranger
    // and unsubscribing someone else.
    const token = unsubscribeToken("user-1")!;
    expect(verifyUnsubscribeToken("user-2", token)).toBe(false);
  });

  it("rejects an empty, truncated or altered token", () => {
    const token = unsubscribeToken("user-1")!;
    expect(verifyUnsubscribeToken("user-1", "")).toBe(false);
    expect(verifyUnsubscribeToken("user-1", token.slice(0, -1))).toBe(false);
    const altered = (token[0] === "a" ? "b" : "a") + token.slice(1);
    expect(verifyUnsubscribeToken("user-1", altered)).toBe(false);
  });

  it("does not reuse the database credential as the signing key", () => {
    // A leaked token must not narrow the search space for the service-role key.
    delete process.env.UNSUBSCRIBE_SECRET;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key-value";
    const token = unsubscribeToken("user-1")!;
    expect(token).toBeTruthy();
    expect("service-role-key-value").not.toContain(token);
    expect(token).not.toContain("service-role-key-value");
  });

  it("builds a URL on the canonical host", () => {
    expect(unsubscribeUrl("user-1")).toContain("/api/email/unsubscribe?u=user-1&t=");
  });
});

describe("every marketing template is covered by the send-path footer", () => {
  it("classifies every template as marketing or transactional", () => {
    // A new template lands in the marketing set by default. Failing here is the
    // point: it forces a deliberate decision instead of a silent exemption.
    const unclassified = templateFiles().filter(
      (f) => !TRANSACTIONAL.has(f) && !["day3.ts", "day7.ts", "day14.ts"].includes(f),
    );
    expect(
      unclassified,
      `new email template(s) — classify in TRANSACTIONAL, or confirm the send path appends marketingFooter():\n${unclassified.join("\n")}`,
    ).toEqual([]);
  });

  it("no template hardcodes its own unsubscribe link or address", () => {
    // Seven copies of a legal notice is how six of them go stale — the same
    // failure as the 29 copies of the base URL.
    for (const f of templateFiles()) {
      const src = readFileSync(join(TEMPLATES, f), "utf8");
      expect(src, `${f} builds its own unsubscribe link`).not.toMatch(/api\/email\/unsubscribe/);
    }
  });

  it("the drip send path gates on CAN-SPAM and appends the footer", () => {
    const drip = readFileSync(join(ROOT, "app", "api", "cron", "email-drip", "route.ts"), "utf8");
    expect(drip).toMatch(/marketingBlockReason\(\)/);
    expect(drip).toMatch(/canSendMarketing\(/);
    expect(drip).toMatch(/\+ footer/);
    expect(drip).toMatch(/headers,/);
    // And honours a recorded opt-out.
    expect(drip).toMatch(/marketing_opt_out_at/);
  });

  it("the opt-out column the drip filters on exists in a migration", () => {
    const migrations = join(ROOT, "supabase", "migrations");
    const ddl = readdirSync(migrations)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => readFileSync(join(migrations, f), "utf8"))
      .join("\n");
    expect(ddl).toMatch(/add column if not exists marketing_opt_out_at/i);
  });
});
