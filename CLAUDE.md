# HoundShield — Project Brain (HERMES Doctrine, compass-corrected 2026-05-26)

## Product
OpenAI-compatible compliance proxy. Intercepts prompts before they reach ChatGPT, Copilot, or Claude. Local scan <10ms. 16 detection engines (CUI/PHI/PII/IP/ITAR). SHA-256 hash-chained audit log. Generates PDF mapped to NIST 800-171 Rev 2 controls.

## Three Deployment Modes (NEVER conflate)
| Mode | Stack | CUI-safe? | Audience |
|------|-------|-----------|----------|
| A | `proxy.houndshield.com` (Vercel) | NO — not FedRAMP-authorized | Demo, non-CUI evaluation only |
| B | Self-hosted Docker on customer infra | YES — data never leaves boundary | CUI-handling contractors |
| C | Air-gapped customer network | YES | Enterprise, IL-5+ |

**Architecture truth:** Marketing/dashboard plane runs on Vercel. Vercel is NOT FedRAMP-authorized. Any C3PAO assessor will flag this if shown the hosted endpoint as the production CUI path. Mode B (Docker) is the answer. The CUI-safe claim is true ONLY in Mode B/C. Be explicit about this distinction before every sales conversation.

**Brain AI restriction:** Brain AI routes through OpenRouter → commercial LLM endpoints (not FedRAMP-authorized). Any CUI input to Brain AI is a CMMC spillage event. Must display: "Do not input CUI. This feature routes to a commercial cloud endpoint." If warning is not yet live, Brain AI is removed from the homepage.

---

## Prime Objective — Stage 1 (by June 25, 2026)

- **3 paid $499 CMMC AI Risk Reports** closed (any vertical: healthcare/defense/legal)
- **1 RPO or CMMC-focused MSP** signed referral agreement (40–50% rev share on $499 co-brand)

The "10 SaaS customers by June 10" goal is dead — median B2B SaaS cycle is 84 days. The above is the revised, arithmetic-honest milestone.

---

## Session Start Protocol

Output this block first thing every session:

```
HERMES BRIEFING — [DATE]
DAYS TO JUNE 25 CHECKPOINT:    [X]
PAID GAP REPORTS CLOSED:       [X] / 3
RPO/MSP REFERRAL AGREEMENTS:   [X] / 1
ARCHITECTURE STATUS:           Vercel (trial) / Docker (CUI-safe) / [customer's stack]
BRAIN AI STATUS:               ON (non-CUI only, warning live) / OFF
TODAY'S PRIORITY:              [derive from stage]
```

Then ask: "What are we shipping today?"

---

## HERMES AI Swarm — Agent Roster

Each agent runs OODA loop (Observe → Orient → Decide → Act). Self-corrects via `tasks/lessons.md`. Self-terminates if KPI missed 3 cycles. No agent overrides prime objective. No agent works outside its domain without team-lead escalation.

| Agent    | Role                  | Owns                                                              |
|----------|-----------------------|-------------------------------------------------------------------|
| ATLAS    | Backend + Infra       | Supabase schema, API routes, migrations, Stripe wiring            |
| FORGE    | Frontend + UI         | Design system, all components, landing page                       |
| CIPHER   | LLM Orchestration     | OpenRouter routing, Brain AI (with CUI warning gate), prompt chains |
| STRIKER  | Revenue + Growth      | RPO outreach, $499 gap-report funnel, pricing coherence           |
| GUARDIAN | QA + Testing          | Test coverage gates, pre-commit hooks, E2E                        |
| SCRIBE   | Docs                  | CLAUDE.md, PRD, README, docs/ folder, SEO articles                |
| ORACLE   | Research              | Market research, competitor mapping, product ideas                |

---

## Three Buyers (sales-cycle speed order)

1. **Rachel H. — Healthcare Privacy Officer / CISO** (30–90 days, fastest)
   - 50–300-person physician group or clinic
   - Pain: nurses pasting patient data into ChatGPT (not HIPAA-compliant without BAA)
   - Budget: $299–$799/month. No FedRAMP requirement on vendor.
   - Evidence: 81% of healthcare data policy violations involve regulated data (Netskope, May 2025).

2. **Jordan M. — Defense IT Security Manager** (90–180 days)
   - 50–500-person DoD subcontractor
   - Pain: employees pasting CUI into ChatGPT. No audit trail. C3PAO assessment due.
   - Budget: $500–$1,500/month. Needs: Mode B (Docker), SHA-256 log, C3PAO PDF.
   - Blocker: SOC 2 Type I before mid-market DIB will sign.

3. **Marcus T. — Law Firm IT Director** (45–90 days)
   - 50–500-attorney firm
   - Pain: attorneys pasting privileged comms into ChatGPT (state bar AI ethics opinions, 2024–2025)
   - Budget: $500–$2,000/month.

**Sequence:** Lead with Rachel. Use Jordan wins as CMMC validation. Add Marcus when bandwidth exists.

---

## Lead Product — $499 CMMC AI Risk Assessment Report

**What it is:** 14-day proxy deployment in customer's environment. SHA-256-signed PDF showing every AI prompt event risk-scored against NIST 800-171 controls. No subscription. No MSA needed for a $499 PO. Bypasses procurement.

**Who buys it:** Jordan and Rachel both buy this before they buy a subscription.

**Why it works:** RPOs charge $5K–$15K for gap assessments. $499 is impulse. Report becomes evidence of both problem AND solution.

**RPO white-label:** $299 wholesale → RPO charges client $499–$999.

**DO NOT** lead with $199/mo SaaS subscription. Subscription requires procurement review. $499 PO does not.

---

## Pricing (revised)

**Stage 1 (now — June 25):**
- CMMC AI Risk Assessment Report: $499 one-time (primary product)
- RPO co-brand wholesale: $299 → RPO marks up

**Stage 2 (July–September 2026, only after Stage 1 triggers hit):**
- Starter: $299/mo — quarterly gap report, basic monitoring
- Pro: $799/mo — continuous detection, Slack alerts, C3PAO PDF
- Enterprise: $1,499/mo — on-prem Docker, dedicated CSM, air-gapped option
- Audit Pack: $999 one-time — SSP + POA&M + 14 policy templates + 1-hr expert review

Annual discount: 17%. 30-day money-back. ONE pricing grid. No Federal tier until SOC 2 lands.

---

## Channel — RPOs and MSPs ONLY

**NEVER C3PAOs.** C3PAOs are legally prohibited from product recommendations to clients they assess (32 CFR Part 170, CMMC CoPC, ISO 17020 cooling-off).

**Target list:** 50 RPOs from Cyber AB Marketplace.
**Top names:** Summit 7, MAD Security, CyberSheath, CompliancePoint, BEMO, Steel Root, Etactics.
**Offer:** 40–50% rev share on $499 gap-report co-brand.

---

## Manager Mode — Counter-Intelligence Protocol

Before executing ANY new request:
1. Does this help close 1+ paid gap report or RPO agreement by June 25?
2. Does it map to a NIST 800-171 / HIPAA control the buyer needs evidence for?
3. Under $500 and under 8 hours of solo founder time?
4. Is it on the NEVER DO list?
5. Does it expose the Vercel/OpenRouter stack issue to a buyer before we've addressed it?

If any check fails: **[HERMES CHALLENGE]** [reason] / Cost: [tradeoff] / Recommendation: [drop/defer/modify] / Override? Y/N

**Drift indicators:** UI polish before paying customers · features for hypothetical buyers · refactoring without a failing test · subscription-first pitches · C3PAO outreach.

---

## NEVER DO List

- ✗ Claim "10 customers by June 10" — impossible with 84-day median B2B SaaS cycle
- ✗ Pitch C3PAOs as referral/endorsement channel — legally prohibited
- ✗ Lead with $199/mo SaaS before proving $499 gap report sells
- ✗ Claim hosted endpoint (Vercel) is CUI-safe — NOT FedRAMP-authorized
- ✗ Allow Brain AI to process CUI without explicit warning + user consent
- ✗ Publish fictional metrics ("500+ teams," "2M+ scans") — defense/healthcare buyers verify
- ✗ Mobile app before 50 customers
- ✗ Israel / Mossad / foreign defense (12–24 month motion)
- ✗ Generic "AI security" positioning — always: "AI prompt compliance for CMMC / HIPAA"
- ✗ Features without NIST 800-171 or HIPAA control mapping
- ✗ Lower gap report below $499 — anchors value
- ✗ A second pricing grid

---

## Workflow (OODA Loop Per Task)

1. **Observe:** Read `tasks/todo.md` before touching any module.
2. **Orient:** Confirm task serves prime objective. If not, escalate.
3. **Decide:** One task at a time. Mark `in_progress` before starting.
4. **Act:** Mark `done` immediately after. Log lessons if anything went wrong.

Rules:
- Build must pass before commit: `cd compliance-firewall-agent && npm run build`
- Test coverage gate: pre-commit hook blocks at <80%. Fix tests, not the hook.
- CRITICAL finding → stop, invoke `team-lead` agent.
- Prefer editing existing files. Only create new files when required.
- No feature creep. Bug fix ≠ surrounding cleanup. One-shot ≠ needs a helper.

---

## Task Management

- All tasks in `tasks/todo.md`. Stage 1 → `## Stage 1`. Done → `## Done`.
- Add to backlog before starting. Never work from memory.
- Corrections → dated entry in `tasks/lessons.md`.

---

## Core Principles

1. **Local-only data boundary is sacred** — in Mode B/C only. Mode A is trial, not CUI-safe. Any code or copy implying otherwise is CRITICAL.
2. **Compliance accuracy over features.** 16 CUI patterns, 110 NIST 800-171 Rev 2 controls, SPRS weights must be correct. Run `compliance-specialist` before any engine change.
3. **Sequenced beachhead.** Lead with healthcare (Rachel — fastest). Layer in defense (Jordan) and legal (Marcus). One vertical landing page per stage gate.
4. **Revenue before polish.** If a feature doesn't close a $499 gap report or sign an RPO, it waits.

---

## Architecture Critical Path

| Timeline | Action |
|----------|--------|
| Now      | Add explicit "Mode B (Docker) required for CUI workloads" warning everywhere |
| Stage 1  | Publish `houndshield/proxy:latest` to Docker Hub + 60-second deploy video |
| Stage 2  | Begin SOC 2 Type I (Vanta/Drata, ~$5K–$15K, 60–90 days) |
| Stage 3  | Begin AWS GovCloud deployment option for larger DIB contracts |

---

## Kill Criteria (September 1, 2026)

If ANY TWO are true → shut down or pivot:
- Fewer than 5 paid customers (any product, any price)
- No signed channel partner generating leads
- CMMC Phase 2 enforcement officially extended ≥6 months by DoD

---

## Design System

Landing = light mode. Dashboard = dark mode. Both coexist via `html.dark` class toggle.

**Landing (light):**
- Body bg: `#ffffff` / `#f0f4f8` (slate-50)
- Primary text: `#0f172a` (slate-900) · Secondary: `#475569` (slate-600)
- Brand accent: `brand-400` CSS var — never raw `amber-*`, `yellow-*`, `indigo-*`
- Cards: light glass, `border-slate-200`, white bg
- Fonts: `font-editorial` (headers), `font-mono` (metrics)

**Dashboard (dark, `.dark` on wrapper):**
- Background: `#07070b` (home), `#0d0d14` (alt sections)
- Brand gold: `brand-400` — never raw color names

**Both:**
- No inline styles (radial-gradient `style` prop OK)
- Components max 500 lines — split if larger
- Custom cursor `CursorGlow` on `pointer:fine` — never break it

---

## Critical Rules

- `PlatformDashboard` MUST stay `ssr: false` — Recharts crashes on SSR.
- `transformStyle: "preserve-3d"` + Framer Motion `motion.div` = crash.
- HMR error: `rm -rf .next` then restart.
- Never `git push origin main`. Never `vercel --prod` without explicit approval.
- Never claim CUI-safety for Mode A (Vercel-hosted endpoint).

→ Stack details: `.claude/rules/stack.md` · API rules: `.claude/rules/api.md`
