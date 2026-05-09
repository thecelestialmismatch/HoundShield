# HoundShield — Mossad-Level Security Hardening
## Full Codebase Audit + Remediation Plan
### Audited: 2026-05-08

---

## THREAT MODEL

HoundShield handles CUI (Controlled Unclassified Information) for DoD contractors.
A breach doesn't just kill the product — it creates **mandatory breach notifications, GDPR exposure, CMMC audit failure, personal founder liability, and potential criminal exposure** under DFARS.
"Built with AI" and "still in beta" are not legal defenses.

Security posture target: **CMMC Level 2 self-attestation by design**.

---

## CRITICAL FINDINGS (Fix Before Go-Live)

---

### CRIT-01 — RLS Policies Allow ALL Users to Read ALL Data
**File:** `supabase/migrations/001_initial_schema.sql`
**Severity:** CRITICAL — Data breach waiting to happen

**Current code (broken):**
```sql
create policy "Service role full access" on compliance_events for all using (true);
create policy "Service role full access" on quarantine_queue for all using (true);
-- same pattern on all 6 tables
```

**Why this is broken:** `using (true)` without a role qualifier applies to ALL roles including `anon`. Any unauthenticated user hitting these tables through the Supabase JS client can read all compliance events from all users. The policy name says "Service role" but the SQL does not enforce that.

**Fix — run this migration in Supabase:**
```sql
-- Migration: 010_fix_rls_user_isolation.sql

-- Drop the broken "full access for all" policies
drop policy if exists "Service role full access" on compliance_events;
drop policy if exists "Service role full access" on quarantine_queue;
drop policy if exists "Service role full access" on policy_rules;
drop policy if exists "Service role full access" on audit_reports;
drop policy if exists "Service role full access" on hitl_approvals;
drop policy if exists "Service role full access" on seed_anchors;

-- compliance_events: users see only their own rows
create policy "Users see own events"
  on compliance_events for select
  to authenticated
  using (user_id = auth.uid()::text);

create policy "Service write events"
  on compliance_events for all
  to service_role
  using (true);

-- quarantine_queue: service role only (never exposed to end users directly)
create policy "Service only quarantine"
  on quarantine_queue for all
  to service_role
  using (true);

-- policy_rules: users can read active rules for their tenant; service role writes
create policy "Users read active rules"
  on policy_rules for select
  to authenticated
  using (is_active = true);

create policy "Service manage rules"
  on policy_rules for all
  to service_role
  using (true);

-- audit_reports: users see only reports for their own events
create policy "Users read own reports"
  on audit_reports for select
  to authenticated
  using (true); -- TODO: add user_id column to audit_reports in next migration

create policy "Service manage reports"
  on audit_reports for all
  to service_role
  using (true);

-- hitl_approvals: requestor + service only
create policy "Users see own hitl requests"
  on hitl_approvals for select
  to authenticated
  using (requested_by = auth.uid()::text);

create policy "Service manage hitl"
  on hitl_approvals for all
  to service_role
  using (true);

-- seed_anchors: read-only for authenticated, service manages
create policy "Users read anchors"
  on seed_anchors for select
  to authenticated
  using (true);

create policy "Service manage anchors"
  on seed_anchors for all
  to service_role
  using (true);
```

**Verification:**
```sql
-- Must return 0 rows (no blanket anon access)
select tablename, policyname, roles, cmd, qual
from pg_policies
where schemaname = 'public'
  and (roles = '{}' or 'anon' = any(roles))
  and qual = 'true';
```

---

### CRIT-02 — CORS Opens to All Origins in Demo Mode
**File:** `middleware.ts`, lines 134–145
**Severity:** CRITICAL — CSRF attack vector

**Current code:**
```typescript
const isDemo = !appUrl || appUrl === 'http://localhost:3000';
if (isDemo) {
  response.headers.set('Access-Control-Allow-Origin', requestOrigin || '*');
}
```

**Why this is broken:** If `NEXT_PUBLIC_APP_URL` is unset or misconfigured in production, every deployment runs in "demo mode" with `*` CORS on the gateway API. Any website can make cross-origin POST requests to `/api/gateway/intercept` on behalf of authenticated users.

**Fix:**
```typescript
// middleware.ts — replace the gateway CORS block

if (pathname.startsWith('/api/gateway')) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const requestOrigin = request.headers.get('origin') ?? '';

  // NEVER fall back to wildcard — fail closed
  const allowedOrigins = new Set([
    appUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean));

  if (allowedOrigins.has(requestOrigin)) {
    response.headers.set('Access-Control-Allow-Origin', requestOrigin);
    response.headers.set('Vary', 'Origin');
  } else if (!requestOrigin) {
    // Server-to-server call (no Origin header) — allow
    // Do NOT set ACAO header
  } else {
    // Unknown origin — block explicitly
    return new NextResponse(null, { status: 403 });
  }

  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, x-api-key, x-user-id, x-destination-url'
  );

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }
}
```

**Environment guard (add to startup check):**
```typescript
// lib/startup-check.ts
if (!process.env.NEXT_PUBLIC_APP_URL && process.env.NODE_ENV === 'production') {
  throw new Error('CRITICAL: NEXT_PUBLIC_APP_URL must be set in production. CORS will be broken.');
}
```

---

### CRIT-03 — TypeScript Build Errors Silently Ignored
**File:** `next.config.js`, lines 28–30
**Severity:** HIGH — Security bugs masked by build config

**Current code:**
```javascript
typescript: {
  ignoreBuildErrors: true,
}
```

**Why this is a security risk:** Type errors in API routes, auth flows, and data handlers can be runtime security bugs. Ignoring them means a `user_id: any` that should be `user_id: string` passes the build — and your auth check silently accepts anything.

**Fix:** Remove both flags. Fix the underlying TS errors instead.
```javascript
// next.config.js — DELETE these two blocks
// eslint: { ignoreDuringBuilds: true }    ← DELETE
// typescript: { ignoreBuildErrors: true } ← DELETE
```

Run `npm run build` after and fix every error. Most will be trivial. The ones that aren't are the ones hiding bugs.

---

### CRIT-04 — CSP Script-Src Has 'unsafe-eval' + 'unsafe-inline'
**File:** `next.config.js`, lines 62–70
**Severity:** HIGH — XSS protection defeated

**Current CSP:**
```
script-src 'self' 'unsafe-eval' 'unsafe-inline'
```

**Why this is broken:** `'unsafe-eval'` enables `eval()`, `new Function()`, and similar — the core XSS vectors. `'unsafe-inline'` enables inline script tags. Together they make your CSP nearly worthless against XSS.

**Fix (use nonces for Next.js):**
```typescript
// middleware.ts — generate nonce and inject into CSP

import { v4 as uuidv4 } from 'uuid';

// At the top of middleware():
const nonce = Buffer.from(uuidv4()).toString('base64');

// Replace the CSP header in next.config.js with nonce-based policy:
const csp = [
  "default-src 'self'",
  `script-src 'self' 'nonce-${nonce}'`,  // nonce only, no unsafe-*
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",  // inline styles OK for Tailwind
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

response.headers.set('Content-Security-Policy', csp);
response.headers.set('x-nonce', nonce);
```

For Next.js 15 specifically, use the built-in nonce support via `generateBuildId` and pass the nonce through RSC context.

---

### CRIT-05 — Admin Routes Protected Only in UI (No Server-Side Check)
**Severity:** HIGH — Business logic bypass

**Pattern to audit:**
```typescript
// WRONG — UI check only:
if (profile.role !== 'admin') return <Redirect to="/command-center" />

// RIGHT — server-side enforcement:
// In every admin API route:
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

if (profile?.role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**Action:** Grep every file in `app/api/` for admin-only operations. Every one must have a server-side role check using the Supabase service client, not just the UI guard.

```bash
grep -r "role.*admin\|admin.*role" app/api/ --include="*.ts"
# If result is empty → no admin route protection at all
```

---

## HIGH FINDINGS

---

### HIGH-01 — Stripe Webhook Uses `console.log` for Sensitive Events
**File:** `app/api/stripe/webhook/route.ts`
**Severity:** HIGH — PII in logs (user IDs, subscription IDs, tier)

The webhook logs `userId`, `subscriptionId`, and `tier` via `console.log`. In Vercel, these go to a log drain visible to anyone with Vercel project access.

**Fix:** Replace all `console.log`/`console.error` in webhook with a structured logger that redacts PII:
```typescript
// lib/logger.ts
import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [new transports.Console()],
});

// In webhook: replace console.log with
logger.info('stripe.webhook.checkout_completed', {
  tier,
  subscriptionId: subscriptionId.slice(0, 8) + '...', // truncate
  // NEVER log userId in plain text
});
```

---

### HIGH-02 — Rate Limiter is In-Memory (Bypassable Across Instances)
**File:** `middleware.ts`
**Severity:** HIGH — Rate limiting ineffective on Vercel (multiple instances)

The `rateLimitMap` is process-local. On Vercel, each function instance has its own map. An attacker with 60 IPs can hit 60 req/min × N instances = effectively unlimited.

**Fix:** Use Upstash Redis or Vercel KV for distributed rate limiting:
```typescript
// Install: npm install @upstash/ratelimit @upstash/redis
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  prefix: 'houndshield:rl',
});

// In middleware:
const { success, limit, remaining, reset } = await ratelimit.limit(ip);
if (!success) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

---

### HIGH-03 — Missing CSRF Protection on State-Changing API Routes
**Severity:** HIGH — Session riding attack

Non-gateway API routes (checkout, reports, scan) have no CSRF token validation. If a user is logged in and visits a malicious site, the site can POST to your API using the user's session cookie.

**Fix:** Add SameSite=Strict to Supabase session cookies (already configured via Supabase SSR — verify) + add a custom CSRF header check:
```typescript
// middleware.ts — add to state-changing POST routes
if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
  const csrfHeader = request.headers.get('x-csrf-token');
  const origin = request.headers.get('origin');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  
  // For browser-initiated requests, origin must match app URL
  if (origin && !origin.startsWith(appUrl)) {
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
  }
}
```

---

### HIGH-04 — Supabase Service Role Key Exposure Risk
**File:** `lib/supabase/client.ts` (createServiceClient)
**Severity:** HIGH — If imported in client component, key leaks to browser

**Audit:**
```bash
grep -r "createServiceClient\|SUPABASE_SERVICE_ROLE_KEY" app/ components/ \
  --include="*.tsx" --include="*.ts" | grep -v "api/"
# Any result here is a critical key leak
```

**Fix:** `createServiceClient()` must only be called in:
- `app/api/**/*.ts` (API routes, server-side only)
- `supabase/migrations/` (SQL only)
- Never in `components/`, `app/(pages)/**`, or any file with `"use client"`

Add a lint rule:
```javascript
// eslint.config.js
rules: {
  'no-restricted-imports': ['error', {
    name: '@/lib/supabase/client',
    importNames: ['createServiceClient'],
    message: 'createServiceClient is server-only. Use createBrowserClient in components.',
  }],
}
```

---

## MEDIUM FINDINGS

---

### MED-01 — quarantine_queue Stores Encrypted Prompts Without Key Rotation
**File:** `supabase/migrations/001_initial_schema.sql`

The `prompt_content_encrypted` and `encryption_iv` columns exist — good. But:
- Where is the ENCRYPTION_KEY stored and rotated?
- Is AES-256-GCM used (authenticated encryption) or just AES-256-CBC (malleable)?
- IV is stored as text — is it being reused?

**Fix:** Use AES-256-GCM always. Each encryption generates a fresh 12-byte IV. Store IV as hex. Add key version column for rotation:
```sql
alter table quarantine_queue add column encryption_key_version integer not null default 1;
```

---

### MED-02 — Default Favicon Emoji Leaks Stack
**File:** `app/layout.tsx`
**Severity:** Low-medium — Fingerprinting

The shield emoji favicon `🛡️` is fine for branding but check that:
- No Next.js version headers are exposed (`poweredByHeader: false` is set ✓)
- No `X-Powered-By: Express` or similar from Docker layer
- `Server` response header is stripped

---

### MED-03 — Docker Non-Root User — Verify
**File:** `Dockerfile`
**Status:** Marked as done in session notes — verify it's actually `USER node` or equivalent before the `CMD` line.

---

## PRE-LAUNCH SECURITY CHECKLIST

Run this before flipping Stripe to live mode:

```bash
#!/bin/bash
# security-check.sh

echo "=== HoundShield Security Pre-Launch Check ==="

# 1. RLS verification
echo "[1] Checking for overly broad RLS policies..."
# Run in Supabase SQL:
# select tablename, policyname, qual from pg_policies
# where qual = 'true' and schemaname = 'public'
# Expected: only service_role policies

# 2. Env var presence
echo "[2] Checking env vars..."
REQUIRED_VARS=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  NEXT_PUBLIC_APP_URL
  ENCRYPTION_KEY
)
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "  MISSING: $var"
  else
    echo "  OK: $var"
  fi
done

# 3. Check for hardcoded secrets
echo "[3] Scanning for hardcoded secrets..."
grep -rn "sk_live\|sk_test\|supabase.*service_role\|AKIA" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules --exclude-dir=.next .
echo "  Above should be empty"

# 4. Service client in browser
echo "[4] Checking service client usage..."
grep -rn "createServiceClient" app/ components/ \
  --include="*.tsx" --include="*.ts" | grep -v "api/"
echo "  Above should be empty"

# 5. Admin routes
echo "[5] Checking admin route protection..."
grep -rn "admin\|role" app/api/ --include="*.ts" | grep -v "node_modules"

# 6. CORS
echo "[6] Checking CORS - APP_URL set?"
echo "  NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-MISSING}"

echo ""
echo "=== Fix all MISSING items before go-live ==="
```

---

## GDPR / Data Minimization

As a product handling CUI for DoD contractors, you may also handle EU user data (NATO contractors). Required:

1. **Data inventory:** What PII do you store? (email, name, company in `profiles`) — document it
2. **Retention policy:** `compliance_events` — how long kept? Add `expires_at` column + purge job
3. **Right to erasure:** Add a `DELETE /api/user/data` endpoint that cascades deletes user data
4. **Privacy policy:** Must explicitly list data stored, retention periods, and processor list (Supabase, Stripe, OpenRouter, Resend, Vercel)

---

## WHAT MOSSAD-LEVEL ACTUALLY MEANS

Defense intelligence services don't trust assumptions — they verify. Applied here:

1. **Zero-trust data access** — every query explicitly scopes to `auth.uid()`, no "full access" shortcuts
2. **Fail-closed defaults** — unknown origin = 403, missing env var = throw, ambiguous permission = deny
3. **Separation of duties** — service role key never leaves server, anon key is read-only public, no exceptions
4. **Audit trail integrity** — every write to `compliance_events` goes through the seed anchor chain
5. **Defense in depth** — RLS + middleware auth + server-side role check + input validation (Zod) — four layers, not one
6. **No silent failures** — every catch block logs + returns a typed error, never swallows
7. **Key rotation plan** — ENCRYPTION_KEY, Stripe keys, Supabase keys all documented with rotation procedure

The current codebase is well-structured. The gaps above are specific and fixable in a single sprint. Priority order: CRIT-01 (RLS) → CRIT-02 (CORS) → CRIT-03 (TS) → HIGH-01 (logging) → HIGH-02 (distributed rate limit).
