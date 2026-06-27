# Scaling & Resilience — HoundShield

How the app stays up when a very large number of people hit it at once, what is
already handled, and the honest upgrade path for true planet-scale.

## The scenario that actually breaks databases

The expensive case is **not** a million *different* reads. It is a million
*identical* reads arriving in the same instant — every visitor loading the same
homepage stat, every uptime monitor polling the same health endpoint, every
dashboard asking for the same global number. Unprotected, each one becomes a
round trip to Postgres and the database falls over.

The fix is to collapse identical work. We do this at three layers.

## Layer 1 — Static generation + CDN (already in place)

Every public marketing page (`/`, `/pricing`, `/features`, `/blog`, …) is
statically prerendered at build time and served from Vercel's edge CDN. These
pages never touch the database under load — a million views is a million cache
hits at the edge, zero origin work. Confirm with `npm run build`: pages marked
`○ (Static)` are CDN-served.

## Layer 2 — Single-flight stale-while-revalidate cache (`lib/cache/swr-cache.ts`)

For dynamic reads that *are* shared across users, `cached()` collapses the herd:

- **Single-flight** — while one fetch for a key is in flight, every other caller
  for that key awaits the *same* promise. A million concurrent callers trigger
  exactly one origin call. This is the core stampede guard.
- **TTL** — a fresh value is served from memory with zero origin work.
- **Stale-while-revalidate** — past the TTL but within the stale window, the last
  value is served instantly while a single background refresh runs, so latency
  never spikes on expiry.
- **Circuit breaker** — after N consecutive origin failures the circuit opens for
  a cooldown; during it the last good value is served instead of an error storm,
  giving the origin room to recover.

It is applied to `/api/health` (polled relentlessly by status pages and uptime
monitors) and is the standard wrapper for any new shared read:

```ts
import { cached } from "@/lib/cache/swr-cache";

const value = await cached("global:stat", () => db.expensiveRead(), {
  ttlMs: 30_000,   // fresh window
  staleMs: 300_000 // serve-stale-while-revalidating window
});
```

Behaviour is locked by `lib/cache/__tests__/swr-cache.test.ts`, including a
1,000-concurrent-caller test that asserts exactly one origin call.

## Layer 3 — Pooled database access (already in place)

All Supabase access goes through the `@supabase/ssr` clients, which talk to
Supabase's **PostgREST** API over HTTPS, not raw Postgres connections. PostgREST
pools connections server-side, so a flood of serverless invocations does not
exhaust Postgres's connection limit — the classic serverless-plus-Postgres
failure mode. We never open direct `pg` connections from request handlers.

Rate limiting lives in `middleware.ts` (sliding-window, LRU-bounded) so a single
abusive client cannot monopolise the origin: 60 req/min default, 15 for `/api/scan`,
120 for `/api/gateway`.

## The honest boundary: true planet-scale

The in-process cache is per warm instance. On serverless that means one cache per
instance — combined with single-flight it still cuts origin load by orders of
magnitude under a thundering herd, but it is not a *shared* tier. For sustained
global scale, back the **same `cached()` interface** with a shared store —
callers do not change:

| Need | Drop-in | Notes |
|------|---------|-------|
| Shared cache / rate limits across instances | **Upstash Redis** (serverless) | Swap the Map in `swr-cache.ts` for Redis GET/SETEX; keep single-flight via a short lock key. |
| Edge request collapsing before origin | **Cloudflare Workers + Cache API** | Terminate polls at the edge; only misses reach Vercel. |
| Write spikes (audit log) | **Cloudflare Queues / SQS** | Enqueue writes, drain asynchronously — never write Postgres synchronously on the scan path. |
| Read-heavy Postgres | **Supabase read replicas** | Point cached reads at a replica. |

These require the operator's Cloudflare / Upstash accounts and credentials; they
are infrastructure decisions, not code changes. The application is already shaped
to accept them without touching call sites.

## Load test before a big launch

```bash
# k6 — 10k virtual users for 10 min against staging; gate on p99 < 50ms
k6 run --vus 10000 --duration 10m load/health.js
```

The single-flight cache is what makes the health/stat endpoints pass this without
the origin seeing 10k× the traffic.
