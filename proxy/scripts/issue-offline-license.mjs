#!/usr/bin/env node
/**
 * Issue a signed offline licence for an air-gapped (Mode C) HoundShield proxy.
 *
 * Mode C customers cannot reach houndshield.com — that is the entire point of
 * the deployment. Before this existed, the proxy inferred entitlement from that
 * unreachability, which meant anyone could mint an unlimited Pro licence by
 * blocking a hostname. `proxy/license.ts` no longer does that, so this is how a
 * genuinely disconnected install gets a working, expiring, revocable licence.
 *
 * The private key never leaves the machine you run this on. The proxy only ever
 * holds the PUBLIC half, so a customer who reads every environment variable in
 * their own container still cannot issue themselves a licence.
 *
 * ── Generate the signing pair (once, ever) ─────────────────────────────────
 *
 *   node scripts/issue-offline-license.mjs --new-keypair
 *
 * Writes `houndshield-license.key` (PRIVATE — back it up offline, never commit)
 * and prints the public key to paste into HOUNDSHIELD_LICENSE_PUBLIC_KEY.
 *
 * ── Issue a licence ───────────────────────────────────────────────────────
 *
 *   node scripts/issue-offline-license.mjs \
 *     --key      hs_live_the_customers_licence_key \
 *     --org      org_1234 \
 *     --plan     enterprise \
 *     --days     365 \
 *     --private  houndshield-license.key
 *
 * Prints the token for HOUNDSHIELD_OFFLINE_LICENSE. It is bound to that
 * customer's licence key, so it is useless to anyone who does not also hold it.
 */

import { generateKeyPairSync, createPrivateKey, sign, createHash } from "node:crypto";
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const VALID_PLANS = ["pro", "growth", "enterprise", "agency", "trial"];

function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || i === process.argv.length - 1) return fallback;
  return process.argv[i + 1];
}

function die(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

// ── --new-keypair ───────────────────────────────────────────────────────────

if (process.argv.includes("--new-keypair")) {
  const out = arg("out", "houndshield-license.key");
  if (existsSync(out)) {
    die(`${out} already exists. Refusing to overwrite a signing key — every licence ever issued with it would stop verifying.`);
  }

  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const privPem = privateKey.export({ type: "pkcs8", format: "pem" });
  const pubPem = publicKey.export({ type: "spki", format: "pem" });

  writeFileSync(out, privPem, { mode: 0o600 });

  console.log(`Private key written to ${out} (mode 0600).`);
  console.log("Back it up offline. It is not recoverable and not rotatable without reissuing every licence.\n");
  console.log("Set this on every proxy that must accept offline licences:\n");
  console.log("HOUNDSHIELD_LICENSE_PUBLIC_KEY=" + JSON.stringify(pubPem.toString()));
  process.exit(0);
}

// ── issue ───────────────────────────────────────────────────────────────────

const licenceKey = arg("key");
const org = arg("org");
const plan = arg("plan", "enterprise");
const days = Number(arg("days", "365"));
const privatePath = arg("private", "houndshield-license.key");

if (!licenceKey) die("--key is required (the customer's HOUNDSHIELD_LICENSE_KEY)");
if (!org) die("--org is required");
if (!VALID_PLANS.includes(plan)) die(`--plan must be one of: ${VALID_PLANS.join(", ")}`);
if (!Number.isFinite(days) || days <= 0) die("--days must be a positive number");
if (!existsSync(privatePath)) die(`${privatePath} not found. Run --new-keypair first.`);

const privateKey = createPrivateKey(readFileSync(privatePath, "utf8"));

const payload = {
  org_id: org,
  plan,
  // An offline licence that never expires is a permanent bearer credential.
  // Expiry is mandatory here for that reason, not merely defaulted.
  expires_at: new Date(Date.now() + days * 86_400_000).toISOString(),
  key_hash: createHash("sha256").update(licenceKey).digest("hex"),
};

const payloadB64 = b64url(JSON.stringify(payload));
// Ed25519 signs the message directly — the digest argument must be null.
const signature = b64url(sign(null, Buffer.from(payloadB64, "utf8"), privateKey));

console.log(`Offline licence for ${org} — plan ${plan}, expires ${payload.expires_at}\n`);
console.log("HOUNDSHIELD_OFFLINE_LICENSE=" + `${payloadB64}.${signature}`);
