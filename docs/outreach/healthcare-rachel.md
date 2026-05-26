# Healthcare Outreach — Rachel (Privacy Officer / CISO)

> **Stage 1 milestone (June 25, 2026):** 3 paid $499 gap reports closed (any vertical).
> **Why healthcare leads:** 30–90-day median cycle (vs 90–180 days for defense),
> no FedRAMP requirement on the vendor, larger TAM (~6K hospitals + tens of
> thousands of physician groups in the US), and a documented pain trigger.
> **Pain trigger:** 81% of healthcare data policy violations involve regulated
> data (Netskope Threat Labs, May 2025). ChatGPT is NOT HIPAA-compliant without
> a BAA — only ChatGPT Enterprise / API has one.

---

## Buyer persona — "Rachel H."

| | |
|---|---|
| **Title** | Privacy Officer, CISO, or Director of Compliance |
| **Org size** | 50–300-person physician group, clinic, or specialty practice |
| **Buying authority** | $299–$799/mo subscription, $499 one-time PO |
| **Procurement friction** | $499 PO almost always bypasses procurement; subscription requires MSA review |
| **What keeps Rachel up** | A nurse pasting PHI into ChatGPT, that prompt being logged on OpenAI's servers, OCR auditor finding it in a breach investigation 12 months later, $50K–$1.5M per-violation fine |
| **Words Rachel uses** | "BAA," "minimum necessary," "PHI," "covered entity," "OCR," "breach notification," "HITRUST" |
| **Words Rachel does NOT use** | "CUI," "SPRS," "C3PAO," "DFARS" — never mention these |

---

## Sourcing — 25-name initial target list

**Where to find Rachel:**

1. **LinkedIn Sales Navigator:**
   - Title: `Privacy Officer` OR `Chief Privacy Officer` OR `HIPAA Privacy Officer` OR `Director of Compliance`
   - Industry: Hospital & Health Care, Medical Practice
   - Headcount: 51–200
   - Geography: US
   - Excluded titles: `Sales`, `Marketing`, `Account Manager`
2. **HCCA (Health Care Compliance Association) member directory:**
   <https://www.hcca-info.org/> — members publicly searchable
3. **Definitive Healthcare:** physician group + ambulatory surgery center lists (paid tool — may already be in inbox via outbound vendor)
4. **State medical society chapters:** California Medical Association, Texas Medical Association, etc — privacy officer rosters often public

**Disqualification rules:**
- ❌ Hospital system > 500 beds (procurement cycle too long for Stage 1)
- ❌ Already on Epic + Microsoft 365 E5 (likely have Purview + Copilot Studio path)
- ❌ HIPAA business associate (we sell to the covered entity, not the BA)
- ❌ Single-doctor practice (too small for the $299/mo Starter even at Stage 2)

---

## 25-name research stub

| # | Org | Contact | Title | Email | LinkedIn | Org size | Last touch | Stage | Notes |
|---|-----|---------|-------|-------|----------|----------|------------|-------|-------|
| 1 | _(TBD)_ | | | | | | — | Not contacted | |
| 2 | … | | | | | | | | |
| … | | | | | | | | | |
| 25 | … | | | | | | | | |

Stage definitions identical to `rpo-target-list.md` kanban states.

---

## Cold-email template (Rachel)

```
Subject: How does your group handle nurses pasting patient data into ChatGPT?

Hi [first name],

[your role at HoundShield]. Quick question — not selling yet.

Netskope's May 2025 threat report said 81% of healthcare data policy violations
they tracked involved regulated data going to GenAI tools. Most of that was
ChatGPT (free tier), no BAA, no audit trail, no way to prove minimum-necessary.

For a [org-size]-person [practice type] like [org name], how are you handling
the AI tool gap right now? Policy memo? Blocked at the firewall? Or live with
it because no good option exists?

If you'd be open to seeing what a 14-day audit of your team's actual AI usage
looks like — we run a local proxy inside your network (Docker, your
infrastructure, no PHI leaves your boundary), then deliver a SHA-256-signed
PDF showing every event mapped to the HIPAA Security Rule. $499 one-time, no
subscription, no MSA.

Worth a 20-minute call to see the sample report? I can send it as a PDF first
if that's easier.

— [your name]
   [your role], HoundShield
   info@houndshield.com
   houndshield.com/security

P.S. The hosted demo at proxy.houndshield.com is NOT a BAA-eligible path —
that's a separate non-PHI trial endpoint. Mode B (Docker, inside your network)
is the only PHI-safe deployment. Full statement: houndshield.com/security
```

---

## What we DON'T say to Rachel

- "CMMC" / "DFARS 7012" / "CUI" / "C3PAO" / "DIB" — wrong vocabulary
- "We compete with Microsoft Purview" — Rachel may already have it; reframe as "we work alongside Purview, catching what their Copilot data-loss rules don't see in third-party AI tools"
- "Free trial" — too cheap signals low quality; offer the $499 paid report as the first touch
- "Defense contractor positioning" — irrelevant, and a healthcare buyer reading defense-only copy bounces

---

## Discovery call agenda (20 min)

1. **(2 min) Confirm pain.** "How many of your clinical staff actively use ChatGPT or Copilot in a typical week? Estimate is fine."
2. **(5 min) Show the audit report.** Open a sample PDF live (not a deck). Walk through one HIPAA event, one PHI block, one false-positive case.
3. **(5 min) Show the deployment.** Open the Docker run command. "30 minutes to deploy. PHI never leaves your boundary. Here's the data-path diagram from houndshield.com/security."
4. **(3 min) Confirm path-to-PO.** "Is $499 something you can approve directly, or does it need a PO/SOW? If PO, send us your standard form."
5. **(5 min) Calendar the kickoff.** Confirm the install date + the 14-day end date. Send the calendar invite live on the call.

**Demo always ends with the PDF on screen.** Same rule as defense.

---

## Stage 1 success criteria for healthcare lane

By 2026-06-25 (any combination across verticals adds up to the 3-report milestone):
- ≥ 1 paid $499 gap report closed with a Rachel-profile buyer
- ≥ 10 discovery calls booked
- ≥ 25 cold emails sent (=100% of the list above)

If by 2026-06-15 we have < 5 discovery calls booked from healthcare, the problem
is volume not message — push to 50 names in the list, not a new email template.

---

## Out of scope

- HIPAA BAA execution (Stage 2 — see `~/.claude/plans/stage-2-subscription-surface.md` item F)
- HITRUST certification (Stage 3+)
- Hospital systems > 500 beds (procurement too slow for Stage 1)
- Medical device manufacturers (FDA path, different doctrine)
- Health insurers (different buyer, different sale)
- Telehealth platforms (BA path, different sale)
