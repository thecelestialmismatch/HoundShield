# HoundShield — AI Compliance Firewall

> **The only AI intercept proxy that never sends your CUI to a third-party cloud.**  
> Built for the 80,000 defense contractors who need CMMC Level 2 before November 2026.  
> Local-first. Audit-ready. C3PAO-accepted.

[![Deploy Status](https://img.shields.io/badge/deploy-Vercel-black)](https://houndshield.com)
[![License](https://img.shields.io/badge/license-Proprietary-red)](LICENSE)
[![CMMC Level 2](https://img.shields.io/badge/CMMC-Level%202-blue)](https://houndshield.com/features)
[![Node](https://img.shields.io/badge/node-%3E%3D18-green)](package.json)

---

## What This Is

HoundShield is an **OpenAI-compatible HTTPS proxy** that intercepts every AI prompt your team sends before it reaches any LLM provider. It scans for CUI, PII, PHI, trade secrets, CAGE codes, and clearance data in under 10ms using 16 pattern classifiers, then logs a tamper-evident SHA-256 signed audit record mapping to the exact NIST SP 800-171 Rev 2 control affected.

**The 10-second pitch for a C3PAO:**

> "Every cloud-based DLP tool — Nightfall, Strac, Purview — sends your CUI to their servers to scan it. Under DFARS 7012, that's a potential CUI spill in its own right. HoundShield scans locally. Prompts never leave your network. The PDF we generate maps directly to AC.L2-3.1.3 and AU.L2-3.3.1. Your assessor accepts it."

**What makes the architecture actually defensible:**

```
Employee → AI Tool → [HoundShield Proxy — runs on YOUR server] → OpenAI/Claude/Gemini
                              ↓
                    Scan (16 patterns, <10ms)
                              ↓
                    Block | Quarantine | Allow
                              ↓
                    SHA-256 signed audit log
                              ↓
                    PDF report (C3PAO-ready)
```

The proxy is a Node.js HTTPS intercept server that lives inside your Docker container on your infrastructure. **Your AI prompts are processed on your hardware. Nothing is transmitted to HoundShield servers for scanning.**

---

## Architecture

```
compliance-firewall-agent/          # Next.js 15 web dashboard + API routes
├── app/
│   ├── page.tsx                    # Landing page (Jordan pain copy)
│   ├── pricing/page.tsx            # 5-tier pricing
│   ├── partner/page.tsx            # C3PAO partner onboarding
│   ├── command-center/             # Dashboard (dark mode, SSR-disabled)
│   └── api/
│       ├── stripe/
│       │   ├── checkout/route.ts   # Stripe checkout (4 paid tiers)
│       │   └── webhook/route.ts    # Stripe webhook (⚠️ URL needs update)
│       ├── brain/query/route.ts    # Brain AI (OpenRouter — needs key)
│       └── gateway/intercept/      # Cloud gateway endpoint (SaaS tiers)
├── lib/
│   ├── brain-ai/                   # BM25 knowledge graph + CMMC Q&A
│   ├── gateway/                    # Core AI interception engine
│   └── classifier/                 # 16-pattern CUI/PII/IP/PHI detector

proxy/                              # THE ACTUAL PRODUCT (on-prem tier)
├── server.ts                       # HTTPS intercept proxy (DO NOT modify)
├── scanner.ts                      # Pattern scanner (DO NOT modify)
└── patterns/index.ts               # 16 patterns (extend only, never replace)

supabase/
└── migrations/                     # 001-004 (003+004 not yet pushed to prod)
```

### Deployment Tiers

| Tier | How It Works | Data Leaves Network? |
|------|-------------|---------------------|
| **Starter / Pro / Growth** | Cloud proxy via `proxy.houndshield.com` | **YES — scanned by HoundShield cloud** |
| **Enterprise** | Self-hosted Docker — your server, your network | **NO — local only** |
| **Agency/MSP** | White-label multi-tenant (choice of above) | Depends on client tier |

> ⚠️ **CRITICAL**: For CMMC Level 2 compliance, only the Enterprise (on-prem) tier satisfies the "nothing leaves your network" requirement. The Pro/Growth cloud proxy is appropriate for HIPAA, SOC 2, and non-CUI workloads. **This distinction must be communicated explicitly in every sales conversation.**

---

## Quick Start (Enterprise / On-Prem)

### Prerequisites
- Docker 24+
- Node.js 18+
- A machine on your internal network (Windows, Linux, macOS)

### 1. Deploy the proxy

```bash
docker pull houndshield/proxy:latest

docker run -d \
  --name houndshield-proxy \
  -p 8443:8443 \
  -e HS_API_KEY=your_api_key_here \
  -e HS_ORG_ID=your_org_id \
  -v /var/houndshield/logs:/app/logs \
  houndshield/proxy:latest
```

### 2. Point your AI tools at the proxy

```bash
# In your .env or system environment
OPENAI_BASE_URL=https://localhost:8443
```

```python
# Python / OpenAI SDK
import openai
client = openai.OpenAI(
    base_url="https://localhost:8443",
    api_key=os.environ["OPENAI_API_KEY"]
)
```

```javascript
// Node.js / TypeScript
const client = new OpenAI({
  baseURL: "https://localhost:8443",
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: { "X-HoundShield-Org": "your_org_id" }
});
```

```json
// For ChatGPT Enterprise / API-compatible tools:
// Change the base URL in your tool settings
// proxy.houndshield.com → localhost:8443
```

### 3. Verify a CUI block fires

```bash
# Test scan — type a fake CAGE code
curl -X POST https://localhost:8443/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "X-HoundShield-Org: test" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Review contract W52P1J-24-C-0001"}]}'

# Expected: 403 with block event logged
# Check: docker logs houndshield-proxy | grep BLOCK
```

### 4. Download your first C3PAO-ready PDF

Log into your dashboard at `app.houndshield.com` → Shield Reports → Export PDF.

The PDF includes:
- Block event timestamp
- Matched pattern (e.g., `CAGE_CODE_PATTERN`)
- NIST 800-171 Rev 2 control reference (e.g., `AC.L2-3.1.3`)
- SPRS score impact (+N points)
- SHA-256 integrity hash

---

## Detection Patterns (16 Active)

| Pattern | Category | NIST Control |
|---------|----------|--------------|
| `CUI_CATEGORY_MARKING` | CUI | AC.L2-3.1.3 |
| `CAGE_CODE` | CUI | AC.L2-3.1.3 |
| `CONTRACT_NUMBER` | CUI | AC.L2-3.1.3 |
| `CLEARANCE_LEVEL` | CUI | AC.L2-3.1.3, AT.L2-3.2.1 |
| `ITAR_CONTROLLED` | CUI | AC.L2-3.1.3 |
| `SSN` | PII | MP.L2-3.8.1 |
| `EIN` | PII | MP.L2-3.8.1 |
| `CREDIT_CARD` | PCI | MP.L2-3.8.1 |
| `MEDICAL_RECORD_NUMBER` | PHI | MP.L2-3.8.1 |
| `DEA_NUMBER` | PHI | MP.L2-3.8.1 |
| `API_KEY_AWS` | Secrets | AC.L2-3.1.5 |
| `API_KEY_GITHUB` | Secrets | AC.L2-3.1.5 |
| `API_KEY_STRIPE` | Secrets | AC.L2-3.1.5 |
| `PRIVATE_KEY_PEM` | Secrets | AC.L2-3.1.5 |
| `IP_RANGE_INTERNAL` | Network | CA.L2-3.12.1 |
| `CLASSIFIED_MARKING` | CUI | AC.L2-3.1.3 |

**To add a pattern:**

```typescript
// proxy/patterns/index.ts — EXTEND ONLY, never replace existing
export const CUSTOM_PATTERN: DetectionPattern = {
  id: 'CUSTOM_ID',
  name: 'Custom Pattern Name',
  regex: /your-pattern-here/gi,
  category: 'CUI',
  nistControl: 'AC.L2-3.1.3',
  severity: 'HIGH',
  blockAction: 'QUARANTINE', // or 'BLOCK' | 'LOG'
};
```

> **Rule**: Never modify `scanner.ts` or existing entries in `patterns/index.ts`. Only append new patterns. Regex changes require running `compliance-specialist` agent before commit.

---

## SPRS Score Engine

HoundShield maps all 110 NIST SP 800-171 Rev 2 controls to your actual AI usage. SPRS scores range from -203 to +110. Most unprotected defense contractors score -68.

```
Score impact per control:
  AC.L2-3.1.3  (AI CUI flow control):  +5 points
  AU.L2-3.3.1  (AI audit logging):     +3 points
  SI.L2-3.14.1 (CUI flaw detection):   +3 points
  
  HoundShield direct SPRS impact:      +11 to +15 points
  Typical starting score:              -68
  After HoundShield Enterprise:        -53 to -57
```

SPRS score is **self-reported in the DoD SPRS portal**. HoundShield generates the evidence artifact; your ISSO signs and submits.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Web app | Next.js 15, React 19, TypeScript strict |
| Styling | Tailwind CSS, custom design tokens |
| Auth | Supabase Auth |
| Database | Supabase Postgres |
| Payments | Stripe (4 paid tiers) |
| Email | Resend |
| Analytics | PostHog |
| Errors | Sentry |
| Proxy | Node.js 18, HTTPS intercept |
| Scanning | Gemini Flash (primary), regex fallback |
| Deploy | Vercel (web), Docker (proxy) |
| Branch | `claude/flamboyant-davinci-f8e8c3` (active) |

---

## Integration Status

| Service | Status | Required Action |
|---------|--------|-----------------|
| Supabase Auth + DB | ✅ Live | Run migrations 003+004: `npx supabase db push` |
| Stripe Checkout | ✅ Wired | Set 8 price ID env vars in Vercel |
| Stripe Webhook | ⚠️ **BROKEN** | Fix URL → `https://houndshield.com/api/stripe/webhook` + set `STRIPE_WEBHOOK_SECRET` |
| OpenRouter / Brain AI | ❌ **DOWN** | Set `OPENROUTER_API_KEY` in Vercel — Brain AI shows error in prod |
| Resend Email | ✅ Live | — |
| PostHog | ✅ Live | — |
| Sentry | ✅ Live | — |
| Vercel Deploy | ✅ Auto | Branch: `claude/flamboyant-davinci-f8e8c3` |

### Required Environment Variables (Vercel)

```bash
# Stripe (all 8 required for checkout to work)
STRIPE_PRO_MONTHLY_PRICE_ID=
STRIPE_PRO_ANNUAL_PRICE_ID=
STRIPE_GROWTH_MONTHLY_PRICE_ID=
STRIPE_GROWTH_ANNUAL_PRICE_ID=
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=
STRIPE_ENTERPRISE_ANNUAL_PRICE_ID=
STRIPE_AGENCY_MONTHLY_PRICE_ID=
STRIPE_AGENCY_ANNUAL_PRICE_ID=
STRIPE_WEBHOOK_SECRET=          # ← P0: checkout confirmation broken without this

# AI
OPENROUTER_API_KEY=              # ← P0: Brain AI down in prod without this

# Supabase (already set — verify)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Local Development

```bash
# 1. Clone
git clone https://github.com/thecelestialmismatch/HoundShield.git
cd HoundShield

# 2. Install web app
cd compliance-firewall-agent
npm install
cp .env.example .env.local   # Fill in env vars

# 3. Run migrations
npx supabase db push

# 4. Start dev server
npm run dev                  # http://localhost:3000

# 5. In separate terminal — run proxy
cd ../proxy
npm install
npm run dev                  # http://localhost:8443

# 6. Build check (REQUIRED before any commit)
npm run build               # Must pass. Zero exceptions.
```

### Pre-commit Requirements

```bash
npm run build      # Must pass
npm run test       # Must pass (>80% coverage gate)
npm run lint       # Zero errors
```

The pre-commit hook enforces these. If tests fail: fix the tests. Never disable the hook.

---

## Testing

```bash
# Unit tests
npm run test

# Specific scanner tests
npm run test -- proxy/scanner.test.ts

# E2E (Playwright)
npm run test:e2e

# Coverage report
npm run test:coverage   # Gate: >80%
```

**Critical test scenarios (must never break):**

1. `scanner.test.ts` — CAGE code blocked
2. `scanner.test.ts` — Contract number blocked
3. `scanner.test.ts` — Clearance level blocked
4. `scanner.test.ts` — Clean prompt passes through
5. `gateway.test.ts` — Audit log SHA-256 integrity verified
6. `gateway.test.ts` — PDF report generated for block event
7. `stripe.test.ts` — Webhook signature verified
8. `stripe.test.ts` — Plan upgrade updates Supabase role

---

## Known Issues / P0 Bugs (Fix Before Any Sales Demo)

| Priority | Issue | Impact | Fix |
|----------|-------|--------|-----|
| P0 | Stripe webhook URL wrong | Payments not confirmed in DB | Update to `houndshield.com/api/stripe/webhook` in Stripe dashboard |
| P0 | `STRIPE_WEBHOOK_SECRET` missing | Webhook signature fails → no plan upgrades | Set in Vercel env vars |
| P0 | `OPENROUTER_API_KEY` missing | Brain AI error shown on prod dashboard | Set in Vercel env vars |
| P0 | Migrations 003+004 not in prod | Auth and scan features broken for new users | `npx supabase db push` |
| P1 | "500+ Teams" social proof on pricing page | Fabricated metric destroys trust with security buyers | Remove or replace with real number |
| P1 | Architecture ambiguity | "Local only" headline contradicts cloud proxy in docs | Add explicit tier comparison table explaining which tiers are local |

---

## Pricing

| Plan | Monthly | Annual | Scans | Seats | Key Feature |
|------|---------|--------|-------|-------|-------------|
| Starter | Free | Free | None (CMMC assessment only) | 1 | SPRS calculator, gap analysis |
| **Pro** | **$199/mo** | **$1,910/yr** | 50K | 10 | AI gateway + CMMC suite |
| **Growth** | **$499/mo** | **$4,790/yr** | Unlimited | 25 | PDF reports + C3PAO coordination |
| Enterprise | $999/mo | $9,590/yr | Unlimited | Unlimited | On-prem/air-gapped |
| Agency/MSP | $2,499/mo | $23,990/yr | Unlimited | Unlimited | Multi-tenant + white-label |

> **Note on monthly vs. annual display**: Website displays annual pricing prominently (~$159/mo). Internal planning uses monthly figures. The source of truth is Stripe price IDs. Confirm these match before demos.

---

## Security

- Prompt content is processed locally (Enterprise) or in transit via TLS 1.3 (SaaS tiers)
- Audit logs are append-only with SHA-256 integrity hashing (tamper-evident)
- No prompt content is stored long-term; only metadata (timestamp, matched pattern, control ref, SPRS impact)
- License key verification is a single HTTPS call containing **no prompt content**
- Enterprise tier: zero outbound traffic except license check (verifiable via `tcpdump`)

**To verify zero-exfiltration (Enterprise):**

```bash
# Run while a CUI block fires
sudo tcpdump -i any -n host NOT 0.0.0.0 and not arp

# Expected: only traffic to license.houndshield.com
# Should see: ZERO traffic to openai.com, anthropic.com, etc.
```

---

## Compliance Coverage

| Framework | Controls Covered | Evidence Generated |
|-----------|-----------------|-------------------|
| CMMC Level 2 | AC.L2-3.1.3, AU.L2-3.3.1, SI.L2-3.14.1 (+ 8 others) | PDF report, SHA-256 log |
| NIST SP 800-171 Rev 2 | 110/110 mapped (11 directly satisfied) | SPRS score + gap report |
| HIPAA | 18 PHI identifiers | Block event log |
| SOC 2 Type II | Append-only audit trail, read-only auditor access | Log export |

---

## Contributing

This is a solo-founder proprietary project. No external contributions accepted.

**Internal development rules:**
1. Read `tasks/todo.md` before writing a single line
2. Check `tasks/lessons.md` for known failure modes
3. One task at a time. Mark `in_progress` before starting.
4. `npm run build` must pass before commit. Zero exceptions.
5. Never push to `main`. Active branch: `claude/flamboyant-davinci-f8e8c3`
6. Never `vercel --prod` without founder approval

---

## CMMC Compliance Context

**Why this product exists:**

CMMC Level 2 (mandatory for ~80,000 DoD contractors by November 10, 2026) includes three AI-specific controls:

- **AC.L2-3.1.3** — Control the flow of CUI. Sending a CUI document to ChatGPT violates this.
- **AU.L2-3.3.1** — Audit all actions on systems processing CUI. AI tool usage must be logged.
- **SI.L2-3.14.1** — Identify and correct information system flaws. CUI leaks via AI are flaws.

Every cloud DLP tool (Nightfall, Strac, Microsoft Purview standard) scans prompts on their servers. Under DFARS 252.204-7012, transmitting CUI to a third-party cloud for scanning is in the same risk category as sending it to ChatGPT. HoundShield's Enterprise tier eliminates this by processing everything locally.

**The exact quote for sales calls:**

> "Every cloud-based AI DLP tool sends your CUI to their servers to scan it. That's itself a potential DFARS 7012 CUI spill. HoundShield Enterprise scans locally. Nothing leaves your network. This is verifiable with tcpdump."

---

## Support

- Docs: [houndshield.com/docs](https://houndshield.com/docs)
- Demo: [houndshield.com/demo](https://houndshield.com/demo)
- Partners: [houndshield.com/partners](https://houndshield.com/partners)
- Email: founders@houndshield.com
- Emergency (prod outage): Sentry → PagerDuty

---

*Last updated: 2026-05-16*  
*Repo: [github.com/thecelestialmismatch/HoundShield](https://github.com/thecelestialmismatch/HoundShield)*
