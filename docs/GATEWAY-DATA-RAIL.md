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

## Follow-up this change EXPOSED — now FIXED (migration 029)

`createSeedAnchor` (`lib/audit/seed-anchor.ts`) builds the hash chain by reading
the newest anchor and then inserting one that points at it:

```
select content_hash … order by created_at desc limit 1   ← read previous
insert … previous_hash = <that>                          ← write next
```

That read-then-write was **not serialized**. Two blocked prompts landing
concurrently could read the same `previous_hash` and write two anchors claiming
the same parent — a forked chain, which is exactly what a verifier is supposed
to treat as tampering.

Fixed by making the fork unrepresentable in the database rather than by locking
in the application. Migration `029_seed_anchor_chain_integrity.sql` adds two
partial unique indexes on `seed_anchors`:

| Index | Guarantee |
|---|---|
| `(entity_type, previous_hash) where previous_hash is not null` | At most one anchor per parent |
| `(entity_type) where previous_hash is null` | Exactly one genesis per chain |

The writer that loses the race gets a `23505`, re-reads the tip and re-links
against it. Because the guarantee lives in the schema, a writer that bypasses
`createSeedAnchor` still cannot fork the chain. The hash input format is
unchanged and no historical row was touched, so existing anchors remain
byte-identical and verifiable.

Two ceilings this leaves in place, both deliberate:

- **One chain per `entity_type`, not per tenant.** `seed_anchors` has no
  `user_id` and `verifySeedChain(entityType)` takes no user, so every tenant
  contends on the same tip. Per-tenant chains would need a `user_id` column and
  a re-link of every historical `previous_hash` — a rewrite of the audit
  history, which is not something to do casually to tamper-evidence data.
- **Retries are bounded at 10.** Only one writer wins each round, so that bound
  is the supported simultaneous-burst width for a single chain. Beyond it,
  `logComplianceEvent` still records the event and logs the anchor failure —
  a gap in evidence, never a forged link.

The pre-flight queries in the migration header must return zero rows before it
is applied; the index creation fails loudly if the chain is already forked.

Latency note while you are in there: an ALLOWED request costs one insert. A
BLOCKED or QUARANTINED request costs four round trips (event insert, anchor
read, anchor insert, seed_hash update). `X-HoundShield-Scan-Ms` is captured
*before* any of it, so the sub-10ms scan claim is unaffected and still
measurable — but total request time for a blocked prompt is higher than it was.

## What this does NOT do

It does not, on its own, make the audit log tamper-evident. Anchoring writes the
chain; *verifying* it is a separate question, and the content-integrity half of
that verification had never executed — see
[AUDIT-CHAIN-INTEGRITY.md](./AUDIT-CHAIN-INTEGRITY.md) for what the chain proves
after migration 030, and what it still does not.

It does not put data on a dashboard that has no traffic behind it. There is
still no seeded fallback anywhere in `lib/dashboard/overview-telemetry.ts`, and
`app/__tests__/operator-dashboard-honesty.test.ts` fails the build if one
appears. An operator who has never routed a prompt still sees empty panels and
the activation checklist — that state is now *reachable past*, which it was not
before, rather than *disguised*.
