# Customer Status Intelligence & Consent-Gated Brain AI

_Shipped 2026-07-05. Branch: `claude/do-everything-ooda-1ijxav`._

Gives every signed-in customer a clear "where you stand → next step → how to fix"
readout — on the dashboard and, with explicit permission, from Brain AI — while
guaranteeing no customer's data can leak to another and no compliance data ever
reaches a commercial LLM.

## What a customer sees

- **After login (`/console`)** — a Customer Status panel: their journey stage,
  SPRS score, assessment completion, open-gap count, report-order reference, a
  single prioritized **next step**, their **highest-impact gaps with fixes**, and
  what's **still needed**.
- **In Brain AI (chat)** — asking "where do I stand?", "what's my next step?", or
  "where did I go wrong?" returns the same readout **only after** they turn on
  Brain AI data access. Until then, Brain AI **asks permission** and reveals nothing.
- **In Settings** — a "Brain AI data access" card that states exactly what Brain AI
  can and cannot use, with an off-by-default, revocable toggle.

## Architecture

```
lib/customer/status.ts         Pure engine: buildCustomerStatus() + buildStatusAnswer()
lib/customer/client-status.ts  Client-only: computes the SPRS slice from localStorage
lib/brain-ai/status-intent.ts  isStatusQuestion() + consent-gated answer composition
app/api/customer/status/route  GET account-level status (own-data, RLS)
app/api/brain/consent/route    GET/POST consent (own-row, default off)
app/api/chat/route.ts          Step 1c: consent-gated status answer, before FAQ/LLM
components/dashboard/CustomerStatusPanel.tsx   After-login panel
components/brain/BrainDataConsent.tsx          Consent card (settings + chat)
supabase/migrations/022_brain_ai_data_consent.sql   profiles.brain_ai_data_consent
```

One engine (`buildCustomerStatus`) drives the panel AND Brain AI, so the "next
step" logic can never diverge between what the customer reads and what the AI says.

### Journey-stage precedence (single next step)

1. `not_started` — no assessment → start the self-assessment
2. `assessing` — assessment incomplete → finish it
3. `report_pending` — paid $499 report not delivered → deploy the proxy (Mode B)
4. `remediating` — open control gaps → fix the highest-impact one
5. `report_delivered` / `monitoring` — all clear → keep evidence current

When SPRS isn't visible (the server account-only view), the stage is driven by
order state — it never falsely claims a paying customer "hasn't started".

## Privacy & legal model (the guarantees)

1. **Ask permission.** `profiles.brain_ai_data_consent` defaults to `false`
   (migration 022). Brain AI accesses nothing about the customer until they opt in,
   and the toggle is revocable — the auditable timestamp is `brain_ai_consent_updated_at`.
2. **Own-data-only.** Every account read is RLS-scoped to `auth.uid()`
   (migration 020 for report orders, migration 003 for profiles). No endpoint accepts
   a customer id from the client, so one customer's data can never surface for another.
3. **No compliance data to the commercial LLM.** Status answers are built
   **deterministically** by `buildStatusAnswer()` — the request never reaches
   OpenRouter. Assessment data is computed in the browser and, under consent, only
   the user's own SPRS *summary* (control ids, counts, remediation steps) is merged
   server-side; prompt content, CUI, and PHI are never sent to any AI.
4. **Fail closed.** Anonymous visitors, demo mode, and any error all resolve to
   "no consent" → Brain AI asks permission rather than guessing.

## Tests

- `lib/customer/__tests__/status.test.ts` — every stage branch + the answer formatter
- `lib/brain-ai/__tests__/status-intent.test.ts` — intent detection + the consent gate
- `app/api/brain/consent/__tests__/route.test.ts` — read/grant/revoke, auth, own-row
- `app/api/customer/status/__tests__/route.test.ts` — account status, auth, own-data

Leak tests assert the raw email and Stripe ids never appear in any serialized view,
and that the consent-required path is returned whenever consent is off.
