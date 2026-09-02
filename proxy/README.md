# houndshield-proxy

Open source AI compliance proxy for CMMC Level 2 defense contractors.

**Blocks CUI, PII, PHI, credentials, and classified markings before they reach AI services.** One proxy URL change. 16 detection engines. <10ms latency. All local — zero data leaves your network.

Hosted dashboard + Brain AI compliance advisor at [houndshield.com](https://houndshield.com).

---

## What it does

Every AI prompt (ChatGPT, Copilot, Claude, Gemini) passes through this proxy. The proxy scans for:

- **CUI** (Controlled Unclassified Information) — CMMC AC.L2-3.1.3
- **Classified markings** — TOP SECRET, SECRET, FOUO, NOFORN
- **PII** — SSN, passport, drivers license, financial account numbers
- **PHI** — medical record numbers, diagnosis codes, insurance IDs (HIPAA)
- **Credentials** — API keys, private keys, passwords, tokens
- **Intellectual property** — patent numbers, contract IDs, CAGE codes
- **Export controlled** — ITAR/EAR jurisdiction markers

Blocked prompts get a `403` with the detection category. Everything is logged
locally to a SHA-256 hash-chained audit log — every record carries the digest of
the record before it, so an edit, a deletion or a forged insert is detectable by
anyone who can run one command. Nothing leaves your machine.

---

## Deploy in 5 minutes

**Docker (recommended)**

```bash
docker run -p 127.0.0.1:8080:8080 \
  -e HOUNDSHIELD_LICENSE_KEY=your-key \
  -e HOUNDSHIELD_ADMIN_TOKEN=$(openssl rand -hex 32) \
  -e UPSTREAM_API_KEY=sk-your-openai-key \
  -e UPSTREAM_PROVIDER=openai \
  -v houndshield-data:/data \
  houndshield/proxy:latest
```

`UPSTREAM_PROVIDER` accepts `openai`, `anthropic`, `google`, or `openrouter`
(default `openai`). `UPSTREAM_API_KEY` is the provider key your team already
uses. The `/data` volume holds the local event log — keep it to retain your
audit trail across restarts.

**Bind to loopback.** The listener is plain HTTP, so `-p 8080:8080` (which binds
`0.0.0.0`) would put unencrypted, CUI-bearing prompts on your LAN — the exact
exposure this product exists to close. To serve other machines, put a
TLS-terminating reverse proxy in front and point it at `127.0.0.1:8080`.

**Set `HOUNDSHIELD_ADMIN_TOKEN`.** Leave it unset and it falls back to your
licence key, so one secret both licenses and administers the proxy: anyone
holding it can release quarantined CUI and rewrite your detection policy.

**Docker Compose**

```bash
curl -O https://raw.githubusercontent.com/thecelestialmismatch/houndshield/main/proxy/docker-compose.yml
HOUNDSHIELD_LICENSE_KEY=your-key UPSTREAM_API_KEY=sk-... docker compose up -d
```

**Configure your AI tools**

Change the base URL in your AI SDK or `.env`:

```bash
# Before
OPENAI_BASE_URL=https://api.openai.com/v1

# After (route through HoundShield proxy)
OPENAI_BASE_URL=http://localhost:8080/v1
```

The proxy serves `POST /v1/chat/completions`, so an OpenAI-compatible client
needs no change beyond the base URL. Confirm it is up with
`curl http://localhost:8080/health`.

That's it. All traffic now scans through the proxy.

---

## Verify your audit trail

The evidence is only worth what you can check. One command recomputes every
digest in the chain and reports the first record that fails:

```bash
curl -H "x-admin-token: $HOUNDSHIELD_ADMIN_TOKEN" \
     http://127.0.0.1:8080/v1/audit/verify
```

```json
{
  "success": true,
  "data": {
    "ok": true,
    "chained": 14203,
    "unverifiable": 0,
    "first_broken_id": null,
    "reason": null,
    "tip_hash": "9f2c…"
  }
}
```

The endpoint returns **409** and names the offending record if anything has been
altered, distinguishing a record edited in place (`BROKEN_ROW`) from one deleted
or reordered (`BROKEN_LINK`).

`tip_hash` is the digest of the newest record. Anchor it somewhere you do not
control — print it, email it, commit it — and the chain also proves nobody
rewound the log wholesale.

`unverifiable` counts records written before the chain existed. Those cannot be
retro-hashed: inventing digests for records whose integrity was never protected
would be manufacturing evidence. They are reported as outside the guarantee, not
as tampering.

---

## Air-gapped deployments (Mode C)

An air-gapped proxy cannot reach `houndshield.com`, and entitlement is **not**
inferred from that unreachability — blocking a hostname is not a licence. Use a
signed offline licence instead, verified locally with no network:

```bash
# Issued once by HoundShield, from the machine holding the signing key
node scripts/issue-offline-license.mjs --new-keypair
node scripts/issue-offline-license.mjs \
  --key hs_live_your_licence_key --org org_1234 --plan enterprise --days 365
```

Set the two values it prints on the proxy:

```
HOUNDSHIELD_LICENSE_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----...
HOUNDSHIELD_OFFLINE_LICENSE=eyJvcmdfaWQiOi...
```

The token is Ed25519-signed and bound to your licence key's hash, so it is
useless to anyone who does not also hold that key. It carries an expiry, and the
proxy refuses it once passed. The private signing key never leaves HoundShield.

Check which path a running proxy is on:

```bash
curl http://127.0.0.1:8080/health
# → { "licence_source": "offline-token", "licence_valid": true,
#     "audit_chain": "sha256-linked", "admin_credentials_separated": true, ... }
```

---

## Self-host from source

```bash
git clone https://github.com/thecelestialmismatch/houndshield
cd houndshield/proxy
npm install
npm run build
HOUNDSHIELD_LICENSE_KEY=your-key UPSTREAM_API_KEY=sk-... npm start
```

---

## What's open source

| Component | License | Description |
|-----------|---------|-------------|
| `proxy/server.ts` | MIT | OpenAI-compatible HTTP gateway (bind to loopback; terminate TLS in front) |
| `proxy/scanner.ts` | MIT | Pattern scanner engine |
| `proxy/patterns/index.ts` | MIT | 33 CMMC/HIPAA/PII detection patterns |
| `proxy/storage.ts` | MIT | Local audit log (SHA-256 chained) |
| `proxy/webhook.ts` | MIT | Webhook delivery for alerts |

---

## What requires a license

The proxy above is MIT and runs standalone. One paid product sits on top of it:

| Product | Price |
|---------|-------|
| **CMMC AI Risk Assessment Report** — run the proxy 14 days in your own environment, get a SHA-256-signed PDF risk-scoring every AI prompt event against NIST 800-171 | **$499 one-time** |

No subscription. See [houndshield.com/pricing](https://houndshield.com/pricing).

---

## Why local-only matters for CMMC

Cloud DLP services (Nightfall, Forcepoint, etc.) process your prompts on their servers. Under NIST SP 800-171 Rev 2 control **3.1.3 (AC.L2-3.1.3)**, CUI may only be processed on authorized systems. Sending CUI to a cloud DLP vendor's servers without a Data Processing Agreement and system authorization is itself a CMMC violation.

HoundShield runs entirely on your infrastructure. The proxy never transmits prompt content externally. Only your license key hash and aggregate scan counts go to our servers.

---

## Detection patterns

See [PATTERNS.md](./PATTERNS.md) for the full list of 33 detection patterns with NIST control mappings.

---

## Contributing

PRs welcome for:
- Additional CMMC/CUI detection patterns (see `patterns/index.ts`)
- Additional AI provider support (currently: OpenAI, Anthropic, Google, Azure OpenAI)
- Performance improvements to the scanner

Please do not open PRs that change how the audit log works — the tamper-evidence
guarantee is load-bearing for CMMC compliance, and `__tests__/storage-chain.test.ts`
is the suite that proves it by actually editing, deleting and forging records and
asserting each one is caught.

---

## License

MIT — proxy engine, scanner, patterns.

HoundShield dashboard and Brain AI: proprietary, hosted at houndshield.com.
