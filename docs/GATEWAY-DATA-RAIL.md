# The Gateway Data Rail

**Status:** fixed 2026-08-04. Guarded by `app/__tests__/dashboard-data-rail.test.ts`.

This is the chain that has to be unbroken for a signed-in customer's Command
Center to contain anything at all. Every link was broken at once, and each break
was invisible on its own — which is why an empty dashboard read as a UI problem
for weeks when it was a plumbing problem.

```
Settings mints a real key          app/command-center/(tools)/settings/GatewayKeys.tsx
        ↓                          POST /api/gateway/keys           → api_keys
the key authenticates the gateway  lib/gateway/api-key.ts  resolveApiKey()
        ↓
the gateway RECORDS the decision   POST /api/v1/chat/completions
        ↓                          lib/audit/record-decision.ts     → compliance_events
the dashboard reads it back        GET /api/dashboard/overview (scoped to the session)
        ↓
the overview draws it              components/dashboard/OperatorOverview.tsx
```

## What was broken

### 1. No customer could obtain a working key

`generateApiKey()` had been implemented in `lib/gateway/api-key.ts` since the
audit-C2 fix. The `api_keys` table had existed since migration 019. The gateway
had resolved keys against it, fail-closed, ever since.

**Nothing ever called `generateApiKey()`.** There was no route and no UI, so
`api_keys` held zero rows.

Worse, `/command-center/settings` displayed a string derived from the signed-in
user's id behind Reveal and Copy buttons, captioned *"Include this key in the
`x-api-key` header of your gateway requests."* `resolveApiKey` hashes an
incoming key and looks the hash up; that value's hash was never stored, so the
gateway answered **401** to every request made with it. A customer following the
product's own instructions, exactly, could not send one prompt through.

**Fixed by:** `app/api/gateway/keys/route.ts` (GET / POST / DELETE) and
`app/command-center/(tools)/settings/GatewayKeys.tsx`. The raw key is returned
once, from POST, and is unrecoverable afterwards — only its SHA-256 hash and a
non-secret display prefix are stored.

### 2. The gateway recorded nothing

`POST /api/v1/chat/completions` — the OpenAI-compatible proxy that *is* the
product, the URL customers point their client at — scanned every prompt, decided
ALLOWED / BLOCKED / QUARANTINED, returned `X-HoundShield-Request-Id` documented
as an *"opaque request identifier for audit lookup"* … and wrote nothing.

There was never a row to look up. `compliance_events` could not receive one no
matter how much a customer used the product. Two consequences:

- the dashboard's "no traffic yet" state was **permanent**, not a phase;
- the **SHA-256 hash-chained audit log did not exist** on the only rail that
  carries real traffic — the artifact HoundShield is sold on, and the input to
  the $499 CMMC AI Risk Assessment Report.

**Fixed by:** `recordGatewayDecision()`, called after the decision and before
either the denial response or the upstream forward.

### 3. The one path that did record, double-counted

`/api/gateway/intercept` → `interceptLLMRequest` called `handleQuarantine`,
which inserted a `compliance_events` row, and then called `logComplianceEvent`,
which inserted a second row for the same prompt. Every quarantined request
counted **twice** in every total, chart, and audit export.

**Fixed by:** `handleQuarantine(request, classification, eventId)` — it now
attaches a review-queue entry to an already-recorded event instead of minting a
rival one. Both rails funnel through `recordGatewayDecision`.

## Design decisions worth keeping

**Every decision is recorded, including ALLOWED.** "Nothing was detected" is
itself the evidence an assessor asks for. A log containing only violations
cannot demonstrate that the control was operating.

**The record is awaited, not fire-and-forget.** This runs on Vercel Fluid
Compute, where the instance may be frozen the moment the response returns, so a
detached insert is a coin flip. One insert, against a scan already paid for and
an upstream LLM call measured in hundreds of milliseconds, is not the latency
that matters — an unrecorded interception is.

**The record is written *before* the prompt is forwarded.** If it moved below
the early returns, BLOCKED and QUARANTINED — the two decisions that matter most
to an assessor — would silently stop being logged while ALLOWED kept working.

**An audit failure degrades; it never throws.** A proxy that 500s a customer's
production AI traffic because the audit database blipped is a worse outage than
a gap in the log, and the safety decision is already made and enforced before
the write. So the response carries `X-HoundShield-Audit: recorded | degraded`
and the customer can tell the two apart. This is deliberately the opposite of
the fail-closed policy everywhere else in the codebase.

**The prompt is hashed, never stored.** Only `handleQuarantine` persists
content, only encrypted (AES-256-CBC), and only when a human must review it.

## Verifying it end to end

1. Sign in → **Settings → Gateway API keys → Create gateway key**.
2. Copy the key (it is shown once).
3. Send a prompt that must be blocked:

```bash
curl https://proxy.houndshield.com/v1/chat/completions \
  -H "Authorization: Bearer hs_live_..." \
  -H "x-provider-api-key: $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"My SSN is 123-45-6789"}]}'
```

Expect `403`, `X-HoundShield-Action: BLOCKED`, and `X-HoundShield-Audit:
recorded`.

4. Open `/command-center/overview`. The event is in **Live events**, the totals,
   the provider breakdown, and **Detections by engine**.

Requires an active plan above `free` (`canAccessGateway`) and Supabase
configured — a keyless deployment answers `503` from the key route rather than
pretending.

## What this does NOT do

It does not put data on a dashboard that has no traffic behind it. There is
still no seeded fallback anywhere in `lib/dashboard/overview-telemetry.ts`, and
`app/__tests__/operator-dashboard-honesty.test.ts` fails the build if one
appears. An operator who has never routed a prompt still sees empty panels and
the activation checklist — that state is now *reachable past*, which it was not
before, rather than *disguised*.
