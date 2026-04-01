<div align="center">
  <picture>
    <img alt="Kaelus.Online — AI Compliance Firewall" src="assets/kaelus-banner.png" width="100%">
  </picture>
</div>

<br />

<div align="center">
  <h1>Kaelus.Online</h1>
  <p><strong>One AI firewall. Every prompt. All frameworks simultaneously.</strong></p>
  <p>Stop ChatGPT, Copilot, and Claude from leaking your secrets — while passing SOC 2, HIPAA, and CMMC Level 2 audits in a single deployment.</p>
</div>

<br />

<div align="center">

[![Live](https://img.shields.io/badge/Live-kaelus.online-6366f1?style=flat-square&logo=vercel)](https://kaelus.online)
[![License](https://img.shields.io/badge/License-MIT-black?style=flat-square)](LICENSE)
[![Latency](https://img.shields.io/badge/Latency-%3C10ms-emerald?style=flat-square&logo=lightning)](https://kaelus.online)
[![Frameworks](https://img.shields.io/badge/Frameworks-SOC2_|_HIPAA_|_CMMC_L2-black?style=flat-square)](https://kaelus.online)
[![Stack](https://img.shields.io/badge/Stack-Next.js_15_|_Supabase_|_Stripe-black?style=flat-square)](https://kaelus.online)
[![Status](https://img.shields.io/badge/Status-Production-brightgreen?style=flat-square)](https://kaelus.online)

</div>

---

## What Is Kaelus?

Every time your team asks ChatGPT to debug code, draft a proposal, or summarize a document — they may be leaking **API keys, patient records, defense contract numbers, or trade secrets** to a third-party AI.

**Kaelus is a drop-in proxy.** It sits between your team and every AI provider. One URL change. Nothing else changes for your users. Every prompt is scanned, classified, and either allowed or blocked — in under 10 milliseconds.

```
BEFORE:  Your Team → OpenAI / Claude / Copilot
AFTER:   Your Team → Kaelus Firewall → OpenAI / Claude / Copilot
                          ↓
                   Blocked, Redacted, or Logged
```

One deployment covers three frameworks at once: **SOC 2, HIPAA, and CMMC Level 2**.

---

## Why Kaelus?

| Problem | Legacy DLP | Kaelus |
|---|---|---|
| AI prompt leaks | Not designed for LLMs | Intercepts every prompt |
| Multi-framework compliance | Separate tools | One firewall, all three |
| Deployment complexity | Weeks, network rerouting | 15 minutes, one URL change |
| False positives | High (regex only) | Low (16-engine AI detection) |
| Latency overhead | 100–500ms | <10ms |
| SPRS score visibility | Manual spreadsheet | Live dashboard |

---

## Key Features

### One Proxy. Three Frameworks.
Point any OpenAI-compatible client at `https://kaelus.online/api/gateway/intercept` and immediately enforce SOC 2, HIPAA, and CMMC Level 2 simultaneously — no infrastructure changes, no agent installs, no user training.

### 16-Engine Detection Matrix
Parallel scanning across 16 risk categories in a single pass:

| Category | Examples |
|---|---|
| Controlled Unclassified Info (CUI) | FOUO markings, CUI headers |
| CAGE Codes & Contract Numbers | Defense procurement identifiers |
| Security Clearance Levels | SECRET, TOP SECRET references |
| Protected Health Information | Patient names, diagnoses, SSNs |
| API Keys & Credentials | `sk-`, AWS keys, JWT tokens |
| Source Code & Algorithms | Proprietary logic, database schemas |
| PII | Full names, addresses, DOBs |
| Financial Instruments | Card numbers, IBAN, routing |
| Intellectual Property | Patent filings, trade secrets |
| M&A Documentation | Deal terms, target companies |
| Legal Privilege | Attorney-client communications |
| Export Controlled Data | ITAR/EAR classifications |
| Biometric Data | Facial recognition, fingerprint refs |
| Geolocation Intelligence | Military coordinates |
| Network Infrastructure | Internal IPs, firewall rules |
| Authentication Tokens | OAuth flows, session tokens |

### Live SPRS Score Dashboard
Defense contractors get a real-time NIST 800-171 Rev 2 score across all 110 controls. Watch your score improve as you close gaps. Export as a CFO-ready PDF for C3PAO assessments.

### Cryptographic Audit Trail
Every intercept event is SHA-256 hashed and appended to an immutable ledger. Tamper-evident. Instant audit export. Zero-modification guarantee.

### AES-256 Quarantine Vault
High-risk prompts are encrypted at rest and isolated. Human-in-the-loop review. No plaintext sensitive data ever touches your database.

### Sub-10ms Latency
Zero-copy stream scanning with 500-character windows and 256-character overlap. Your team never notices the firewall is there.

---

## Quick Start

### Option 1: Use the Cloud (Recommended)

**15 minutes. Zero infrastructure.**

1. Sign up at [kaelus.online](https://kaelus.online)
2. Copy your gateway URL from the dashboard
3. Replace `baseURL` in your AI SDK

```typescript
// Before — unprotected
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// After — Kaelus protected (one line change)
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://kaelus.online/api/gateway/intercept",
});
```

That's it. Every prompt from your team now passes through Kaelus.

### Option 2: Self-Host

```bash
git clone https://github.com/thecelestialmismatch/Kaelus.Online.git
cd Kaelus.Online/compliance-firewall-agent

npm install
cp .env.example .env.local
# Fill required values (see table below)
npm run dev
```

Dashboard and gateway start at `http://localhost:3000`.

### Environment Variables

| Variable | Where to get it | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | Yes |
| `OPENROUTER_API_KEY` | [OpenRouter](https://openrouter.ai/keys) | Yes |
| `STRIPE_SECRET_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) | Billing only |
| `RESEND_API_KEY` | [Resend](https://resend.com/api-keys) | Emails only |
| `NEXT_PUBLIC_APP_URL` | Your deployment URL | Yes |

---

## Integration Examples

Works with every OpenAI-compatible client — no SDK changes needed, just the `baseURL`.

### Python

```python
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["OPENAI_API_KEY"],
    base_url="https://kaelus.online/api/gateway/intercept",
)

# All your existing code works exactly the same
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Help me with this code..."}]
)
```

### Node.js / TypeScript

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://kaelus.online/api/gateway/intercept",
});

// Works with Claude, GPT-4, Llama — any OpenAI-compatible model
```

### cURL

```bash
curl https://kaelus.online/api/gateway/intercept/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Hello"}]}'
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Your AI Clients                    │
│         (ChatGPT plugins, Copilot, SDKs)            │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS / OpenAI-compatible API
┌──────────────────────▼──────────────────────────────┐
│              Kaelus Gateway (Edge Runtime)           │
│  ┌─────────────────────────────────────────────┐    │
│  │          16-Engine Detection Matrix          │    │
│  │  CUI · PHI · PII · Credentials · ITAR · IP  │    │
│  └─────────────────┬───────────────────────────┘    │
│                    │                                  │
│  ┌─────────────────▼───────────────────────────┐    │
│  │              ReAct Agent Loop               │    │
│  │   Context analysis · False-positive filter  │    │
│  └───────┬─────────────────────────┬───────────┘    │
│          │ ALLOW                   │ BLOCK           │
└──────────┼─────────────────────────┼────────────────┘
           │                         │
┌──────────▼──────────┐   ┌──────────▼──────────────┐
│   AI Provider API   │   │   AES-256 Quarantine     │
│   (OpenAI, etc.)    │   │   SHA-256 Audit Ledger   │
└─────────────────────┘   └─────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────┐
│              Kaelus Dashboard (Next.js 15)           │
│  SPRS Score · Compliance Events · PDF Reports        │
│  Team Management · API Keys · Audit Export           │
└─────────────────────────────────────────────────────┘
```

**Stack:**
- **Frontend:** Next.js 15, React 19, Tailwind CSS, Framer Motion, Recharts
- **Backend:** Next.js API routes (Edge Runtime), Supabase PostgreSQL with RLS
- **AI:** OpenRouter (Claude, GPT-4, Llama via one API key)
- **Auth:** Supabase Auth (Google, GitHub, Microsoft OAuth)
- **Billing:** Stripe with 5-tier subscription management
- **Email:** Resend for transactional notifications

---

## Pricing

| Tier | Price | AI Scans | Users | Compliance |
|---|---|---|---|---|
| **Starter** | Free | 1,000/mo | 1 | Dashboard only |
| **Pro** | $199/mo | 50,000/mo | 10 | SOC 2 + HIPAA |
| **Growth** | $499/mo | 250,000/mo | 25 | + CMMC L2 + PDF Reports |
| **Enterprise** | $999/mo | Unlimited | Unlimited | + White-label + On-prem |
| **Agency/MSP** | $2,499/mo | Unlimited | Multi-tenant | Full platform resale |

All paid plans include a **14-day free trial**. No credit card required on Starter.

---

## Compliance Coverage

### SOC 2 Type II
Continuous monitoring of all AI traffic with cryptographic audit trail. Instant evidence export for auditors. Controls mapped to AICPA Trust Service Criteria.

### HIPAA
Automatic PHI detection and redaction before any AI provider receives the request. HIPAA-compliant logging. Business Associate Agreement available on Growth+.

### CMMC Level 2 (NIST 800-171 Rev 2)
All 110 controls tracked. Live SPRS score calculation using DoD methodology v1.2.1. Automated evidence collection. C3PAO assessment coordination on Enterprise.

---

## Verticals

| Vertical | Primary Use Case |
|---|---|
| Defense Contractors | CMMC compliance, CUI protection, CAGE code detection |
| Healthcare | HIPAA PHI firewall, EHR prompt sanitization |
| Technology | SOC 2 evidence automation, credential leak prevention |
| Legal & Finance | Privilege protection, PCI-DSS enforcement |
| Government | ITAR/EAR export control, classified data blocking |
| Five Eyes | Multi-jurisdiction compliance for allied nations |

---

## Roadmap

- [x] AI gateway proxy (OpenAI-compatible)
- [x] 16-engine CUI/PHI/PII detection
- [x] SPRS score calculator (110 controls)
- [x] Cryptographic audit ledger (SHA-256)
- [x] AES-256 quarantine vault
- [x] PDF compliance reports
- [x] Stripe billing (5 tiers)
- [x] Multi-framework dashboard (SOC 2, HIPAA, CMMC)
- [ ] Slack / Teams native integration
- [ ] SIEM connector (Splunk, Sentinel)
- [ ] On-prem Docker deployment
- [ ] Blockchain-anchored audit trail
- [ ] Browser extension (Chrome, Edge)
- [ ] Mobile app (iOS, Android)

---

## Security

We treat security issues seriously. **Do not open a public GitHub issue for vulnerabilities.**

Contact: `info@kaelus.online`

See [SECURITY.md](SECURITY.md) for our responsible disclosure policy.

---

## License

[MIT](LICENSE) — free to self-host, fork, and modify. Commercial use requires a paid plan for the cloud service.

---

<div align="center">
  <strong>Built for the 80,000+ defense contractors facing CMMC enforcement in November 2026.</strong>
  <br /><br />
  <a href="https://kaelus.online">Website</a> &nbsp;|&nbsp;
  <a href="https://kaelus.online/docs">Docs</a> &nbsp;|&nbsp;
  <a href="https://kaelus.online/pricing">Pricing</a> &nbsp;|&nbsp;
  <a href="https://kaelus.online/features">Features</a> &nbsp;|&nbsp;
  <a href="mailto:info@kaelus.online">Contact</a>
  <br /><br />
  <i>Engineering uncompromising security for the next generation of artificial intelligence.</i>
</div>
