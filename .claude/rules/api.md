---
paths:
  - "compliance-firewall-agent/app/api/**"
  - "compliance-firewall-agent/lib/gateway/**"
  - "compliance-firewall-agent/lib/classifier/**"
---

# API Rules — Kaelus.Online

## Auth (CRITICAL — every route)
```ts
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```
Never use client-sent user IDs — always from session token.

## Stripe Webhook (CRITICAL)
- `stripe.webhooks.constructEvent()` with RAW body (not parsed JSON)
- Required: `STRIPE_WEBHOOK_SECRET` env var
- Handle: `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`

## Response Format
```ts
// Success
return NextResponse.json({ success: true, data: result })
// Error
return NextResponse.json({ success: false, error: message }, { status: 4xx })
```

## Compliance Engine (NEVER degrade)
- Stream scanner: 500-char window, 256-char overlap, <10ms latency
- CUI classifier: minimum 16 patterns — never reduce
- SPRS scoring: all 110 NIST 800-171 Rev 2 controls required
- Audit trail: SHA-256, append-only, atomic writes
