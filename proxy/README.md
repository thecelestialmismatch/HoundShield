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

Blocked prompts get a `403` with the detection category. Everything is logged locally (SHA-256 chained audit log). Nothing leaves your machine.

---

## Deploy in 5 minutes

**Docker (recommended)**

```bash
docker run -p 8080:8080 \
  -e HOUNDSHIELD_LICENSE_KEY=your-key \
  -e UPSTREAM_API_KEY=your-openai-or-anthropic-key \
  -e UPSTREAM_PROVIDER=openai \
  -v houndshield-data:/data \
  ghcr.io/thecelestialmismatch/houndshield-proxy:latest
```

**Docker Compose**

```bash
curl -O https://raw.githubusercontent.com/thecelestialmismatch/HoundShield/main/proxy/docker-compose.yml
HOUNDSHIELD_LICENSE_KEY=your-key UPSTREAM_API_KEY=your-key docker compose up -d
```

### Verify the image (recommended before any CUI deployment)

Every published image is signed with [cosign](https://docs.sigstore.dev/) using
keyless OIDC — no shared secret, no key rotation, the signature is bound to the
GitHub Actions workflow that built it.

```bash
cosign verify ghcr.io/thecelestialmismatch/houndshield-proxy:latest \
  --certificate-identity-regexp "https://github.com/thecelestialmismatch/HoundShield/.+" \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

A successful verification prints the certificate subject (the workflow path) and
the digest the signature covers. If verification fails, do not run the image —
contact security@houndshield.com.

The SBOM is also attached as a build attestation:

```bash
cosign download attestation \
  --predicate-type https://spdx.dev/Document \
  ghcr.io/thecelestialmismatch/houndshield-proxy:latest
```

**Configure your AI tools**

Change the base URL in your AI SDK or `.env`:

```bash
# Before
OPENAI_BASE_URL=https://api.openai.com

# After (route through HoundShield proxy)
OPENAI_BASE_URL=http://localhost:8080/openai
```

That's it. All traffic now scans through the proxy.

---

## Self-host from source

```bash
git clone https://github.com/houndshield/proxy
cd proxy
npm install
npm run build
LICENSE_KEY=your-key PROXY_TARGET=https://api.openai.com npm start
```

---

## What's open source

| Component | License | Description |
|-----------|---------|-------------|
| `proxy/server.ts` | MIT | HTTPS proxy server |
| `proxy/scanner.ts` | MIT | Pattern scanner engine |
| `proxy/patterns/index.ts` | MIT | 16 CMMC/HIPAA/PII detection patterns |
| `proxy/storage.ts` | MIT | Local audit log (SHA-256 chained) |
| `proxy/webhook.ts` | MIT | Webhook delivery for alerts |

---

## What requires a license

| Feature | Tier |
|---------|------|
| **CMMC AI Risk Assessment Report** (one-time PDF, NIST 800-171 mapping) | $499 one-time — lead product |
| Dashboard + analytics + Slack/email alerts | $299/mo Starter *(available July 2026)* |
| C3PAO-ready PDF reports, continuous detection, SIEM exports | $799/mo Pro *(available July 2026)* |
| Mode B/C deployment support, dedicated CSM, air-gapped option | $1,499/mo Enterprise *(available July 2026)* |

Get a license key at [houndshield.com/pricing](https://houndshield.com/pricing). Subscription tiers launch
in Stage 2 — until then, lead with the $499 one-time gap report.

Architecture honesty: the hosted endpoint `proxy.houndshield.com` is **Mode A** (Vercel-hosted, NOT FedRAMP-authorized, demo only).
For any CUI/PHI workload, run **Mode B** (this image, on your own infrastructure) or **Mode C** (air-gapped).
See [houndshield.com/security](https://houndshield.com/security) for the full deployment-mode table.

---

## Why local-only matters for CMMC

Cloud DLP services (Nightfall, Forcepoint, etc.) process your prompts on their servers. Under NIST SP 800-171 Rev 2 control **3.1.3 (AC.L2-3.1.3)**, CUI may only be processed on authorized systems. Sending CUI to a cloud DLP vendor's servers without a Data Processing Agreement and system authorization is itself a CMMC violation.

HoundShield runs entirely on your infrastructure. The proxy never transmits prompt content externally. Only your license key hash and aggregate scan counts go to our servers.

---

## Detection patterns

See [PATTERNS.md](./PATTERNS.md) for the full list of 16 detection patterns with NIST control mappings.

---

## Contributing

PRs welcome for:
- Additional CMMC/CUI detection patterns (see `patterns/index.ts`)
- Additional AI provider support (currently: OpenAI, Anthropic, Google, Azure OpenAI)
- Performance improvements to the scanner

Please do not open PRs that change how the audit log works — the immutability guarantee is load-bearing for CMMC compliance.

---

## License

MIT — proxy engine, scanner, patterns.

HoundShield dashboard and Brain AI: proprietary, hosted at houndshield.com.
