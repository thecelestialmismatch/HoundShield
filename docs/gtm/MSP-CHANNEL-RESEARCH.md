# MSP / RPO Channel — Buyer Research

**Compiled 2026-08-15.** Sources are listed inline and at the foot; every claim
here is either a cited third-party finding or a statement about this repository
that can be checked with the command given. Where something is a judgement call
rather than a finding, it says so.

> **CMMC Phase 2 status — paused (verified 2026-08-15).** The Department of War
> suspended Phase 2 enforcement on **2026-07-13** pending a Reform Task Force
> review (RFI closed 2026-08-14; report due on or about 2026-09-13). The
> 10 November 2026 date has **not** been replaced and remains the date to be
> ready for. DFARS 252.204-7012, all 110 NIST SP 800-171 Rev 2 controls and the
> annual SPRS self-assessment are unaffected.
>
> Canonical source: `compliance-firewall-agent/lib/compliance/cmmc-status.ts`.

---

## BOTTOM LINE

The channel plan in `CLAUDE.md` sells MSPs a **$499 one-time co-branded report
at $299 wholesale**. The published MSP buying model is **per-seat or per-device
recurring, multi-tenant, deployed through RMM, billed monthly**. Those are not
the same product, and the gap is not a pricing tweak — it is three missing
product capabilities. The report is a good *direct* product and a poor *channel*
product.

---

## 1. What MSPs actually buy

Four independent sources converge on the same shape:

| Requirement | Source | HoundShield today |
|---|---|---|
| Simple per-user/per-month pricing, with room for a $2–3/user upcharge | [Kitecyber](https://www.kitecyber.com/msp-dlp-solution/) | ❌ one-time $499 report |
| **Published** per-device pricing, no custom quoting | [ShadowLock](https://shadowlock.io/blog/best-ai-governance-tools-for-msps/) | ⚠️ price is published, but not per-seat |
| True multi-tenant console, per-client isolation | [ShadowLock](https://shadowlock.io/blog/best-ai-governance-tools-for-msps/), [LogMeIn](https://www.logmein.com/blog/why-multi-tenant-user-management-is-essential-for-todays-msps) | ✅ **exists** — see below |
| RMM-driven deployment | [ShadowLock](https://shadowlock.io/blog/best-ai-governance-tools-for-msps/), [ConnectWise](https://www.connectwise.com/blog/best-msp-rmm-software) | ❌ Docker/manual proxy install |
| PSA integration for billing + ticketing | [Worksent](https://worksent.com/blog/rmm-psa-integrations-guide/) | ❌ none |
| Monthly billing, add/remove seats without penalty | [Kitecyber](https://www.kitecyber.com/msp-dlp-solution/) | ❌ one-time |
| Target 60–70% gross margin on managed DLP | [Kitecyber](https://www.kitecyber.com/msp-dlp-solution/) | ⚠️ depends on the rev-share conflict below |

**The multi-tenant console already exists** and is the strongest asset in this
channel — an earlier draft of this document wrongly listed it as missing. Verify
with `find compliance-firewall-agent/app/partner -name page.tsx`:

```
app/partner/page.tsx              partner dashboard
app/partner/clients/page.tsx      client list
app/partner/clients/[orgId]/      per-client drill-down
app/partner/billing/page.tsx      partner billing
app/partner/deploy/page.tsx       deploy keys
```

That is per-client isolation, aggregate view, billing and provisioning — the
capability the sources rank first. It has never been shown to a partner,
because production has not deployed since #288.

**The two remaining blockers, in dependency order:**

1. **Recurring per-seat SKU.** A one-time report is a *project*, not a *managed
   service*. MSPs price managed services monthly because that is what their own
   contracts and PSA billing are built on. This is now the gate.
2. **RMM deployment path.** "Change one URL" is a great demo and a poor fleet
   rollout. Deployment must be scriptable from ConnectWise/Datto/NinjaOne.

**Judgement, not finding:** (1) is largely a Stripe price-object and entitlement
change on top of a portal that already models clients and billing, which makes
it far cheaper than it looked. (2) can be served initially by a documented
silent-install script rather than a per-RMM integration.

### ⚠️ Blocking inconsistency — the partner offer contradicts itself

The live partner page and the strategy doc quote **different revenue shares**:

| Surface | Offer | Location |
|---|---|---|
| Public partner page | **20% revenue share** | `app/partners/page.tsx:61` |
| Brain doc / channel strategy | **40–50% revenue share** | `CLAUDE.md:108` |

A partner who reads the page and then hears the strategy number in a call — or
the reverse — is being quoted two prices for the same deal. Reconcile before any
outreach. **Deliberately not resolved here:** which number is correct is a
margin decision belonging to the founder, and picking one silently would set
channel economics by side effect. Note only that 20% sits below the 60–70%
gross-margin expectation the sources describe for managed DLP, so the lower
number is the likelier obstacle to a partner saying yes.

## 2. What this means for the current plan

The `CLAUDE.md` channel priority — "RPO/MSP partnerships (primary — fastest path
to volume)" — is **not supported by this research as currently specified**. The
offer on the table does not fit the buying model, so a 40–50% rev-share on a
$499 one-time report is unlikely to move a serious MSP regardless of how many
are contacted.

Two of the three named-target categories still hold, with a correction:

- **RPOs** (Summit 7, MAD Security, CyberSheath, Steel Root…) are *consultancies*,
  not MSPs. For them the one-time report **is** the right shape — it slots into
  an assessment engagement they already bill for. Summit 7 published its own
  analysis of the Phase 2 suspension ([Summit 7](https://summit7.us/blog/cmmc-phase-2-suspended-with-60-day-review-what-happens-next)),
  so the topic is live for them right now.
- **MSPs** need a recurring per-seat SKU on top of the portal that already
  exists. This is a **pricing and packaging change, not a build** — which moves
  the MSP channel from "next quarter" to "reachable now", provided the
  revenue-share conflict above is settled first.

Collapsing "RPO/MSP" into one channel is the error. They are two channels
selling two different shapes — a one-time engagement artifact and a recurring
managed service — off one codebase that can already serve both.

**The C3PAO exclusion in `CLAUDE.md` remains correct** — 32 CFR Part 170 and the
ISO 17020 cooling-off provisions bar an assessor from recommending products to
clients it assesses. Nothing in the Phase 2 pause changes that.

## 3. The pitch that survives the pause

The deadline lever is gone; the liability lever is not, and it is stronger
because it is live today rather than in November:

- DFARS 252.204-7012, NIST SP 800-171 Rev 2 and the annual SPRS self-assessment
  all remain fully in force and enforceable
  ([Crowell & Moring](https://www.crowell.com/en/insights/client-alerts/department-of-war-immediately-suspends-cmmc-phase-ii-requirements-launches-60-day-reform-review),
  [WilmerHale](https://www.wilmerhale.com/en/insights/client-alerts/20260720-pentagon-suspends-cmmc-phase-2-requirements-and-launches-review-of-cybersecurity-certification-program)).
- With C3PAO verification paused, the SPRS score is **the contractor's own
  representation to the government** — which is precisely what DOJ prosecutes
  under the Civil Cyber-Fraud Initiative. `lib/compliance/cmmc-status.ts` carries
  the settled-case detail (MORSECORP $4.6M; LOGZONE $507,144).
- Pasting CUI into a commercial AI assistant is a spillage event regardless of
  device ownership ([GreyPike](https://greypike.com/ai-tools-cui-data-spillage-government-contractors)).
- Primes are still issuing flowdown compliance demands to suppliers
  ([Strikegraph](https://www.strikegraph.com/blog/cmmc-phase-2-deadline-november-2026)).

**Never sell the November date as a live certification requirement.** A buyer
checks that in one search, and the deal and the reference both go.

## 4. Competitive read

Honest version, correcting an over-claim in the existing competitive map:

- **Nightfall** is quote-based, priced on users/apps/data volume, and reviewers
  note most functionality is agentless with only exfiltration needing an agent
  ([Vendr](https://www.vendr.com/marketplace/nightfall), [G2](https://www.g2.com/products/nightfall-ai/reviews)).
  It is a *cloud* product; the local-scanning distinction is real.
- **Polymer** targets mid-market/enterprise at somewhat higher entry than
  Nightfall ([AI Tools](https://ai.toolsinfo.com/tool/polymer-dlp)) — note this
  contradicts the "$5/user/mo SMB" line in `CLAUDE.md`, which should be treated
  as unverified until re-sourced.
- **I could not verify** specific on-premise pricing or documented product
  complaints for these vendors. `CLAUDE.md` states Prompt Security shipped an
  on-prem SKU in 2026; that did not surface in this search and is **not
  confirmed here**. Do not repeat it to a buyer without a source.

The defensible claim is narrow and true: **local-by-default scanning with a
NIST-mapped evidence PDF, at published SMB pricing, for non-Microsoft shops.**
Everything wider than that invites a correction from a buyer who checks.

## 5. Recommendation

1. **Settle the 20% vs 40–50% revenue share before any partner outreach.**
   This is the one blocker that costs nothing to fix and poisons every
   conversation while it stands. Founder decision.
2. **Split the channel.** RPO/consultancy = the $499 report, sell now.
   MSP = the existing partner portal plus a recurring per-seat SKU. Stop
   treating them as one offer.
3. **Add the recurring SKU before opening the MSP program.** The portal can
   already model clients and billing; a one-time report cannot be resold as a
   managed service, and a partner who signs and then cannot bill monthly is a
   lost reference rather than a pipeline entry.
4. **Lead every defense conversation with FCA liability**, closing on November
   as the prep date — the framing already encoded in `FCA_PITCH`.
5. **Re-source or retire** the Polymer $5/user and Prompt Security on-prem
   claims before either appears on a customer-facing surface.
6. **Healthcare/legal remain the faster validation path** and carry no CMMC
   dependency at all — unchanged by the pause, and now comparatively more
   attractive because the defense urgency lever weakened.

## Sources

- [Kitecyber — 27 Secrets MSPs Can Follow To Add DLP](https://www.kitecyber.com/msp-dlp-solution/)
- [ShadowLock — Best AI Governance Tools for MSPs 2026](https://shadowlock.io/blog/best-ai-governance-tools-for-msps/)
- [ConnectWise — Best RMM software for MSPs 2026](https://www.connectwise.com/blog/best-msp-rmm-software)
- [LogMeIn — Why multi-tenant user management is essential](https://www.logmein.com/blog/why-multi-tenant-user-management-is-essential-for-todays-msps)
- [Worksent — RMM + PSA Integrations Guide](https://worksent.com/blog/rmm-psa-integrations-guide/)
- [Crowell & Moring — DoW Suspends CMMC Phase II](https://www.crowell.com/en/insights/client-alerts/department-of-war-immediately-suspends-cmmc-phase-ii-requirements-launches-60-day-reform-review)
- [WilmerHale — Pentagon Suspends CMMC Phase 2](https://www.wilmerhale.com/en/insights/client-alerts/20260720-pentagon-suspends-cmmc-phase-2-requirements-and-launches-review-of-cybersecurity-certification-program)
- [Summit 7 — CMMC Phase 2 Suspended, What Happens Next](https://summit7.us/blog/cmmc-phase-2-suspended-with-60-day-review-what-happens-next)
- [GreyPike — ChatGPT Isn't Cleared: AI Tools, CUI, Spillage](https://greypike.com/ai-tools-cui-data-spillage-government-contractors)
- [Strikegraph — CMMC Phase 2 deadline Nov 2026](https://www.strikegraph.com/blog/cmmc-phase-2-deadline-november-2026)
- [Vendr — Nightfall pricing](https://www.vendr.com/marketplace/nightfall)
- [G2 — Nightfall AI reviews](https://www.g2.com/products/nightfall-ai/reviews)
- [AI Tools — Polymer DLP pricing](https://ai.toolsinfo.com/tool/polymer-dlp)
