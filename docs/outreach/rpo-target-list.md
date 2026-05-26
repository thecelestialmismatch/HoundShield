# RPO + MSP Outreach Target List (Stage 1)

> **Stage 1 milestone (June 25, 2026):** 1 signed RPO/MSP referral agreement.
> **Offer:** $499 CMMC AI Risk Report at $299 wholesale, 40–50% margin.
> **Channel rule:** NEVER C3PAOs — legally prohibited from product endorsement
> under 32 CFR Part 170 / CMMC CoPC / ISO 17020. RPOs and CMMC-focused MSPs only.

---

## Sourcing methodology

1. **Primary source — Cyber AB Marketplace RPO directory:**
   <https://cyberab.org/Catalog/Cyber-AB-Marketplace>
   - Filter: "Registered Practitioner Organization" only
   - Export to CSV → import here as additional rows
2. **Secondary source — LinkedIn Sales Navigator:**
   - Search: `("RPO" OR "Registered Practitioner") AND ("CMMC") AND ("managed services" OR "MSSP")`
   - Filter: US, 11–200 employees, founded ≥ 2018
3. **Tertiary source — defense IT Reddit + r/CMMC:**
   - Pull names mentioned 3+ times in vendor recommendation threads over the last 90 days

**Disqualification rules (apply BEFORE adding to list):**
- ❌ Firm is a C3PAO (check Cyber AB Marketplace assessor directory cross-reference)
- ❌ Firm has 0 listed DIB clients OR < 5 RP-credentialed staff
- ❌ Firm openly competes on identical AI/LLM compliance tooling (e.g. resells Nightfall, Strac, or Polymer as their primary AI DLP offering — unless they've publicly criticized cloud DLP for DFARS 7012)

---

## Launch cohort — 7 named seeds (from HERMES doctrine)

| # | Firm | Type | URL | Stage | Owner | Last touch | Notes |
|---|------|------|-----|-------|-------|------------|-------|
| 1 | Summit 7 | RPO + MSSP | summit7.us | Not contacted | STRIKER | — | Largest CMMC MSSP. High-profile. Send to founder, not BD inbox. |
| 2 | MAD Security | RPO | madsecurity.com | Not contacted | STRIKER | — | Strong RP bench. NIST 800-171 reputation. |
| 3 | CyberSheath | RPO | cybersheath.com | Not contacted | STRIKER | — | DFARS 7012 thought leadership. Likely pre-aware of AI gap. |
| 4 | CompliancePoint | RPO | compliancepoint.com | Not contacted | STRIKER | — | Multi-framework (CMMC + HIPAA + PCI). Healthcare overlap useful for Rachel pipeline. |
| 5 | BEMO | MSP | bemopro.com | Not contacted | STRIKER | — | Microsoft 365 specialist — counter-positioning vs GCC High Copilot. |
| 6 | Steel Root | RPO | steelroot.us | Not contacted | STRIKER | — | Smaller, faster mover. Higher likelihood of yes within 2 weeks. |
| 7 | Etactics | MSP + RPO | etactics.com | Not contacted | STRIKER | — | OH-based. Mid-market DIB focus. |

---

## Research stub — 43 more (founder fills from Cyber AB Marketplace export)

> Format: append rows below as you pull them. Keep the schema identical.
> Goal by 2026-06-01: 50 named firms with founder/BD contact identified.

| # | Firm | Type | URL | Stage | Owner | Last touch | Notes |
|---|------|------|-----|-------|-------|------------|-------|
| 8 | _(TBD)_ | _(RPO/MSP)_ | _(URL)_ | Not contacted | STRIKER | — | _(disqualification check + why this firm)_ |
| 9 | … | | | | | | |
| 10 | … | | | | | | |
| 50 | … | | | | | | |

---

## Stage definitions (kanban states)

- **Not contacted** — added to list, no email or LinkedIn touch yet
- **Sent — wave 1** — first cold-email sent (template below)
- **Sent — wave 2** — follow-up sent 5 business days after wave 1
- **Replied — interested** — booked 30-min discovery
- **Replied — declined** — no-thanks or non-fit (note reason in cell)
- **Booked — discovery** — call on calendar
- **Discovery done — proposal sent** — partner agreement draft sent
- **Signed** — Stage 1 trigger met

Owner is always STRIKER for outreach; ATLAS for any technical Q&A handoff.

---

## Cold-email template (paste into `app/api/outreach/...` or send manually for v1)

```
Subject: $299 wholesale on the $499 CMMC AI Risk Report (RPO/MSP only)

Hi [first name],

[firm name] is on a short list we've drawn from the Cyber AB Marketplace for the
launch cohort of HoundShield's partner program.

The offer in one line: co-brand our $499 CMMC AI Risk Report at $299 wholesale,
keep 40–50% margin. Your client gets a 14-day Mode B (Docker) deployment of our
proxy and a signed PDF mapped to all 110 NIST 800-171 Rev 2 controls. No
subscription, no MSA — a $499 PO bypasses procurement in most DIB orgs.

Why this matters now: 76,598 DIB contractors need CMMC Level 2; only ~1,042 are
certified as of Feb 2026. Most of them have an open AI tool usage gap
(SC.3.177 / AU.2.041) with nothing technical to show the assessor. We're the
local-only path.

Two things you should know up front:
1. We are NOT working with C3PAOs as a referral channel — 32 CFR Part 170
   prohibits it. RPOs and CMMC-focused MSPs only.
2. The hosted endpoint is NOT FedRAMP. Mode B (Docker, customer infrastructure)
   is the CUI-safe path. Full architecture statement: houndshield.com/security

Open to a 30-min walkthrough? I'll show the proxy, the PDF, and the partner
math. No deck.

— [your name]
   [your role], HoundShield
   partners@houndshield.com
```

---

## Tracking

Update this file every Friday. Move rows between states. Add new disqualifications to the rules above when patterns emerge. Do not delete contacted firms — historical record matters when re-engaging in Stage 2.

**Stage 1 success looks like:** ≥1 row in the "Signed" state by 2026-06-25.

---

## Out of scope

- C3PAO outreach (legally prohibited)
- Cyber AB itself (governance body, not a channel)
- Federal SI primes (Leidos / Booz / SAIC) — wrong buyer for $499 PO motion
- Tier-1 MSSPs (CrowdStrike / Mandiant) — they sell their own DLP, won't co-brand
- Generic IT MSPs without CMMC focus — they can't articulate the SC.3.177 gap
