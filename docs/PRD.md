# HoundShield — Product Requirements Document
**Version:** 2.0 | **Date:** May 2026 | **Status:** ACTIVE

> **MANAGER PROTOCOL:** This PRD is source of truth. Building anything not in this doc requires explicit approval.
> Every session starts with: "Does what I'm about to build serve Jordan and live in the PRD?"

---

## Mission

Intercept every AI prompt before it leaves the customer's network. Give DoD contractors a tamper-proof audit trail their C3PAO will accept — in 15 minutes, not 6 months.

---

## ICP — Ideal Customer Profile

**Primary: Jordan**
- Title: IT Security Manager / IT Director
- Company: 50-250 person DoD contractor (Tier 2 DIB)
- Situation: CMMC Level 2 deadline November 2026. Engineers actively using ChatGPT, Copilot, Claude. Zero visibility into what's being sent. C3PAO assessment scheduled in next 6 months.
- Pain: "I know my engineers are sending stuff to AI tools. I can't prove they're not leaking CUI. My assessor is going to ask and I have no answer."
- Budget: $199-$999/mo — below the threshold requiring CFO approval
- Decision: Makes it herself or gets 1 sign-off from IT Director / CISO
- Success: "I can show my C3PAO the audit log and SPRS score without scrambling."

**Secondary: MSP/C3PAO Partners**
- Resell HoundShield to their DIB client base
- Need white-label pricing and partner portal
- Path: Agency tier ($2,499/mo) or rev-share arrangement

---

## Pricing (Canonical — Never Deviate)

| Tier       | Price         | Users    | Key Limits                          |
|------------|---------------|----------|-------------------------------------|
| Free       | $0            | 1        | 100 prompts/day, no PDF export      |
| Pro        | $199/mo       | 1-10     | Unlimited scans, PDF export, 1 framework |
| Growth     | $499/mo       | 11-50    | All frameworks, SPRS live score, API access |
| Enterprise | $999/mo       | 51-250   | SSO, SIEM integration, custom patterns |
| Agency     | $2,499/mo     | Unlimited | White-label, partner portal, rev-share |

Annual billing: 20% discount (2 months free).
14-day free trial on all paid tiers.
Checkout: Stripe. Webhook: `https://houndshield.com/api/stripe/webhook`.

---

## v1 — What Ships Now (Sprint 1 Complete)

### Core Proxy (SHIPPED — DO NOT TOUCH)
- HTTPS proxy intercepts OpenAI-compatible requests
- 16 detection engines: CUI, PII, PHI, secrets, CAGE codes, clearances, IP markers
- <10ms scan latency (stream window: 500 chars, 256-char overlap)
- Tamper-proof SHA-256 signed audit logs
- Append-only log storage

### Compliance Engine (SHIPPED — DO NOT TOUCH)
- CMMC Level 2: all 110 NIST SP 800-171 Rev 2 controls mapped
- HIPAA: 18 PHI identifiers
- SOC 2: access control monitoring
- SPRS score calculation (-203 to 110 range)

### Dashboard (SHIPPED)
- `/command-center` — real-time scan feed, blocked prompt log
- `/command-center/shield/reports` — PDF C3PAO report export
- `/command-center/settings` — API key config, proxy URL display
- Supabase auth (email + OAuth)

### Landing + Marketing (SHIPPED)
- Homepage, Features, Pricing, About, Contact, Blog, Docs
- Light-mode design (white bg, slate-900 text, brand-400 accent)
- SEO metadata, JSON-LD structured data

---

## v1.1 — Next 2 Weeks (Sprint 2)

Priority order (revenue first):

1. **Onboarding email sequence** — 5 emails over 7 days. Day 0: proxy URL. Day 1: first scan. Day 3: SPRS score. Day 5: PDF export. Day 7: upgrade nudge.
2. **SPRS estimate on signup** — "Your current estimated SPRS: -68" before any scans, based on industry baseline. Gives Jordan a number to care about immediately.
3. **C3PAO partner portal** — `/partners` page. Form to join referral program. 20% rev share. Tracked via Stripe referral codes.
4. **Guided setup wizard** — 3-step modal after signup: (1) copy proxy URL (2) paste in one tool (3) see first scan. Reduces time-to-value from 15 min → 3 min.

Out of scope for Sprint 2: SIEM integrations, mobile app, blockchain anchoring, SSO (Enterprise feature), multi-tenant dashboard.

---

## Success Metrics

| Metric                     | Day 14  | Day 30   |
|----------------------------|---------|----------|
| Paying customers           | 10      | 25       |
| MRR                        | $1,990  | $5,000+  |
| Free → Paid conversion     | >8%     | >12%     |
| Time-to-first-scan         | <15 min | <5 min   |
| PDF exports generated      | 25      | 100+     |
| C3PAO partner signups      | 3       | 10       |

---

## What We Are NOT Building (Before $10K MRR)

- SIEM integrations (Splunk, Sentinel, Elastic) — Enterprise upsell, post $10K MRR
- Mobile app — not how Jordan works
- Blockchain log anchoring — nice to have, not a C3PAO requirement
- Self-hosted on-prem version — too much support burden pre-scale
- Multi-framework simultaneous enforcement for Free tier — keeps upgrade path clear
- AI model fine-tuning or custom LLM — we are a proxy, not a model provider

---

## Architecture Constraints (Never Violate)

1. **Local-only data boundary.** Prompt content never leaves the customer's network. Only: license key hash + prompt count + scan result metadata go to HoundShield servers.
2. **Proxy-first.** No browser extension, no agent to install, no code changes required. One env var.
3. **OpenAI-compatible API.** Works with any tool that accepts `OPENAI_BASE_URL` override.
4. **16 patterns minimum.** CUI classifier never shrinks. Only extends.
