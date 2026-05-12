# Hound Shield — Sprint Roadmap
*Kill-gated. Each sprint has explicit pass/fail criteria. If kill-gate fails → stop, diagnose, don't proceed.*

---

## SPRINT 0 — Unblock + Brain AI v3 (NOW)

**Goal:** End-to-end demo works. Stripe takes money. Supabase doesn't 500.

| Task | Owner | Status |
|------|-------|--------|
| Fix `STRIPE_WEBHOOK_SECRET` in production | Founder | BLOCKER |
| Push Supabase migrations 003+004 (`npx supabase db push`) | Founder | BLOCKER |
| Brain AI v3 deployed (claude-sonnet-4-6 / claude-opus-4-7) | Done ✓ | — |
| Docker Compose one-liner (15-min deploy) | Engineering | P0 |
| Open-source proxy + scanner pushed to GitHub | Engineering | P0 |

**Kill-gate:** signup → dashboard → scan a prompt → PDF downloads. All in one session. If any step breaks, sprint 0 is not done.

---

## SPRINT 1 — CMMC Beachhead Launch (Weeks 1–2)

**Goal:** 2 active pilots (non-paying OK). Jordan has deployed it and is using it.

**Engineering:**
- [ ] Docker Compose: `docker compose up houndshield` → running in 15 min on any Linux box
- [ ] CMMC onboarding flow: 5-step wizard (proxy setup → first scan → review dashboard → export PDF → share with C3PAO)
- [ ] Brain AI in dashboard: "3 things to fix before your assessment" based on scan history

**Distribution:**
- [ ] Post to r/CMMC: "I built a free, open-source AI prompt scanner for CMMC Level 2 — here's the Docker setup"
- [ ] LinkedIn: message 20 ISSOs directly (search "ISSO" + "defense" + company 50-500)
- [ ] C3PAO outreach: email 3 assessor firms — offer free co-marketing (they recommend us, we give their clients 3 months free)
- [ ] Star GitHub repo: 50 stars = enough social proof for Jordan to trust it

**Kill-gate:** 2 pilots actively scanning prompts. If 0 after week 2, do not proceed — talk to 10 ISSOs about why.

---

## SPRINT 2 — Conversion (Weeks 3–4)

**Goal:** 1 paying contract ≥ $199/mo.

**Engineering:**
- [ ] PDF report: C3PAO assessor template (maps findings to CMMC controls + SPRS impact)
- [ ] Email sequence: pilot → paid (day 1, day 7, day 14)
- [ ] License key validation (local check, no prompt data transmitted)

**Sales:**
- [ ] Demo call with each pilot: "Here's your audit PDF. Would this pass your C3PAO assessment?"
- [ ] Case study draft from pilot 1 (anonymous OK — "50-person aerospace subcontractor")
- [ ] Pricing conversation: "It's $199/mo. Less than one hour of your attorney's time reviewing a compliance incident."

**Kill-gate:** 1 paying customer. If 0 after week 4, kill the sprint approach and run a 10-customer interview sprint instead.

---

## SPRINT 3 — $10K MRR Path (Weeks 5–6)

**Goal:** 5 paying customers. YC application window open.

**Engineering:**
- [ ] Multi-user dashboard (each engineer gets their own scan history)
- [ ] Slack alert integration (Growth tier): notify ISSO when engineer triggers a CUI block

**Distribution:**
- [ ] Case study #1 published (LinkedIn + r/CMMC)
- [ ] C3PAO partner program live: co-branded landing page per assessor firm
- [ ] HN "Show HN: open-source AI prompt firewall for CMMC Level 2"

**Kill-gate:** 5 paying customers OR kill and reassess. If 5 customers, begin YC S26 application.

---

## POST-$10K MRR — Phase 2 (Do not start early)

These are explicitly gated. Starting before $10K MRR = off-plan per Manager Mode.

- HIPAA/SOC2 framework expansion
- HIPAAAgent + SOC2Agent in Brain AI
- Multi-tenant dashboard (MSP/Agency tier)
- SSO (Okta, Azure AD)
- Slack/Teams integration for alerts
- SIEM webhooks (Splunk, Sentinel)

---

## METRICS DASHBOARD (check weekly)

| Metric | Now | Sprint 0 | Sprint 1 | Sprint 2 | Sprint 3 |
|--------|-----|----------|----------|----------|----------|
| MRR | $0 | $0 | $0 | $199 | $2K+ |
| Active pilots | 0 | 0 | 2 | 2 | 5 |
| GitHub stars | — | 0 | 50 | 100 | 300 |
| Stripe working | No | Yes | Yes | Yes | Yes |
| Docker working | No | Yes | Yes | Yes | Yes |
| PDF download | ? | Yes | Yes | Yes | Yes |

---

## MANAGER MODE ENFORCEMENT

Before any task, ask:
1. Is this in Sprint 0, 1, 2, or 3?
2. Does it move a kill-gate metric?
3. Am I building for CMMC or expanding too early?

If the answer to #3 is "expanding" → stop. Document in tasks/todo.md as backlog. Return to sprint.
