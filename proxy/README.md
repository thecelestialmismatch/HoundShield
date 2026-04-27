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
  -e LICENSE_KEY=your-key \
  -e PROXY_TARGET=https://api.openai.com \
  ghcr.io/houndshield/proxy:latest
```

**Docker Compose**

```bash
curl -O https://raw.githubusercontent.com/houndshield/proxy/main/docker-compose.yml
docker compose up -d
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

| Feature | Plan |
|---------|------|
| Dashboard + analytics | Pro ($199/mo) |
| Brain AI compliance advisor | Pro+ |
| PDF report (C3PAO-ready evidence) | Growth ($499/mo) |
| Multi-tenant / MSP portal | Enterprise ($999+/mo) |

Get a free license key at [houndshield.com](https://houndshield.com) — free tier includes the proxy with up to 10,000 scans/day.

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
