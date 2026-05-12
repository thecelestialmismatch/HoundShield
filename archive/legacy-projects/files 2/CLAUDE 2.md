# CLAUDE.md — houndshield Project Brain
**Last Updated:** April 2026 | **Version:** 1.0

> READ THIS BEFORE EVERY SESSION. NO EXCEPTIONS.
> If you haven't read this file, you don't know the project.

---

## IDENTITY

**Product:** houndshield — AI compliance firewall for defense contractors and regulated enterprises
**Formerly:** Kaelus.ai (all references renamed to houndshield)
**Domain:** houndshield.com
**GitHub:** https://github.com/thecelestialmismatch/Kaelus.Online.git
**Phase:** Month 1 — Foundation (Supabase migration, rebrand, P0 features)

---

## BRAIN AI — QUERY BEFORE ASKING ME

Before asking any question about architecture, compliance, competitors, or strategy:

```bash
# Compliance question
npx ts-node brain/query.ts compliance

# Competitor question
npx ts-node brain/query.ts competitors

# Market data
npx ts-node brain/query.ts market

# GTM / partnerships
npx ts-node brain/query.ts gtm

# Codebase state
npx ts-node brain/query.ts codebase
```

If the Brain AI doesn't have the answer, update it: `npx ts-node brain/update.ts`

---

## STACK

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 15, React 19, TypeScript strict | Tailwind only, no inline styles |
| Backend | Node.js + Next.js API routes (TypeScript strict) | No `any` types — ever |
| Database | PostgreSQL 16 (self-hosted Docker) | NOT Supabase — CUI incompatible |
| Auth | Keycloak (self-hosted Docker) | NOT Supabase Auth — replaced |
| Detection | Microsoft Presidio (Python sidecar) | Runs locally, no external API |
| Payments | Stripe | Price IDs only from env vars |
| Email | Resend | |
| Proxy | Node.js http-proxy (TypeScript) | <10ms P99 latency requirement |
| State | Zustand (frontend) | No Redux |
| Testing | Vitest (unit), Playwright (e2e) | 80%+ coverage required |
| CI/CD | GitHub Actions | lint → typecheck → test → build |
| Deployment | Docker Compose (SMB), Helm (Enterprise), Vercel (SaaS dashboard) | |

---

## CODING RULES (non-negotiable)

1. **TypeScript strict mode everywhere.** No `any`. Ever. If you feel like using `any`, find the right type.
2. **No Supabase for CUI data.** Use PostgreSQL direct connection. Supabase Auth is replaced by Keycloak.
3. **FIPS 140-2 crypto only.** AES-256 at rest. TLS 1.3 in transit. OpenSSL FIPS module in all containers.
4. **No secrets in code.** Env vars only. `.env.local` is gitignored. If you see a secret in code, fix it before touching anything else.
5. **80%+ test coverage on all new code.** Write tests before marking a feature done.
6. **Pre-commit hook is mandatory.** It runs `tsc --noEmit` + ESLint + full test suite. If it fails, the commit is blocked. Fix the failures.
7. **Proxy latency.** Any change to the proxy interception path must be benchmarked. Must maintain <10ms P99.
8. **Components < 500 lines.** If a component exceeds 500 lines, split it.
9. **Every Postgres table has Row Security policies.** No table without RLS equivalent.
10. **Auto-commit after every verified change:** `git add . && git commit -m "feat: [description]" && git push origin main`

---

## DIRECTORY MAP

```
compliance-firewall-agent/
├── app/
│   ├── api/
│   │   ├── gateway/intercept/route.ts    # Main proxy interception endpoint
│   │   ├── gateway/stream/route.ts       # Streaming proxy
│   │   ├── compliance/score/route.ts     # CMMC scoring API
│   │   ├── reports/generate/route.ts     # Compliance report generation
│   │   ├── stripe/checkout/route.ts      # Stripe checkout
│   │   ├── stripe/webhook/route.ts       # Stripe webhook
│   │   └── auth/                         # Keycloak OIDC callbacks
│   ├── command-center/
│   │   ├── page.tsx                      # Main dashboard (keep under 500 lines)
│   │   ├── layout.tsx                    # Sidebar + nav
│   │   └── shield/                       # CMMC assessment pages
│   ├── login/page.tsx
│   └── signup/page.tsx
├── lib/
│   ├── gateway/
│   │   ├── proxy.ts                      # HTTP(S) forward proxy core
│   │   ├── scanner.ts                    # Calls Presidio sidecar
│   │   └── policy.ts                     # Policy engine (block/redact/flag)
│   ├── shieldready/
│   │   ├── controls.ts                   # 110 CMMC practices mapped
│   │   └── scoring.ts                    # Compliance score calculation
│   ├── auth/
│   │   └── keycloak.ts                   # Keycloak OIDC client
│   ├── audit/
│   │   └── log.ts                        # Tamper-evident audit logger
│   └── db/
│       └── client.ts                     # PostgreSQL client (not Supabase)
├── db/
│   ├── schema.sql                        # Complete database schema
│   └── migrations/                       # Numbered migration files
├── brain/                                # Brain AI knowledge graph
├── .claude/                              # Agent team configuration
├── docker-compose.yml                    # Production deployment
├── docker-compose.dev.yml               # Development overrides
├── Dockerfile                            # Main container
├── presidio/
│   ├── Dockerfile                        # Presidio sidecar
│   └── custom_entities.py               # CUI/ITAR entity types
├── helm/                                 # Kubernetes Helm chart
├── tasks/
│   ├── todo.md                           # Current work items (check this first)
│   └── lessons.md                        # Lessons learned (check this too)
└── CLAUDE.md                             # This file
```

---

## NPM COMMANDS

```bash
npm run dev          # Start development server
npm run build        # Production build (run before declaring done)
npm run test         # Run Vitest test suite
npm run test:e2e     # Run Playwright e2e tests
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run db:migrate   # Run pending database migrations
npm run db:seed      # Seed development database
npm run brain:query  # Query the Brain AI
npm run brain:update # Update Brain AI after session
```

---

## ENV VARS

```
# Database (PostgreSQL — NOT Supabase)
DATABASE_URL=postgresql://houndshield:password@localhost:5432/houndshield

# Auth (Keycloak — NOT Supabase Auth)
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=houndshield
KEYCLOAK_CLIENT_ID=houndshield-app
KEYCLOAK_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STARTER_MONTHLY_PRICE_ID=
STRIPE_STARTER_ANNUAL_PRICE_ID=
STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=
STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Presidio sidecar
PRESIDIO_SOCKET_PATH=/tmp/presidio.sock

# Email
RESEND_API_KEY=

# Encryption (FIPS 140-2 AES-256 key — 32 bytes hex)
ENCRYPTION_KEY=

# License validation (outbound only — no prompt data)
HOUNDSHIELD_LICENSE_KEY=
```

If any of these are empty: STOP. Fill them in before building features.

---

## SESSION PROTOCOL

### Start of Session
1. Read `tasks/todo.md` — find the current task
2. Read `tasks/lessons.md` — internalize the last 5 lessons
3. Query Brain AI for relevant domain
4. Report status in under 10 lines
5. Ask ONE question if needed, then start

### End of Session
1. Update `tasks/todo.md` — mark completed, update next task
2. Update relevant Brain AI domain if new intel gathered
3. Commit everything: `git add . && git commit -m "chore: session sync — [summary]" && git push`
4. Report: Done this session / Next session starts with

### Manager Check (DEVIATION DETECTION)
At every session start, the team-lead agent checks:
- Is the current task in `tasks/todo.md`?
- Is the current task in the PRD?
- Is the current task in the roadmap for the current month?
If NO to any of these: STOP and ask the founder: **"This isn't in the current plan. Are you sure this is the right move right now?"**

---

## COMPLIANCE CONTEXT (do not re-read the Brain AI to find this)

**Primary compliance target:** CMMC Level 2 (110 practices, 14 domains)
**Most important practices for houndshield:** AC.1.001, AC.1.002, AC.3.017, AU.2.041, AU.2.042, AU.3.045, SC.3.177, SC.3.187, SI.1.210, SI.1.211
**Core claim to C3PAO:** houndshield satisfies boundary protection (SC.3.187) by ensuring all AI traffic passes through a local proxy before exiting the CUI boundary.
**DO NOT claim:** Full CMMC compliance from houndshield alone. We cover the AI governance slice. Customer still needs the other 100 practices addressed by their MSP/RPO.

---

## AUTO-COMMIT RULE

After every verified change (tests pass, build passes, feature works):
```bash
git add .
git commit -m "[type]: [description] — [what was tested]"
git push origin main
```

Types: `feat` (new feature), `fix` (bug fix), `chore` (maintenance), `test` (tests), `docs` (documentation), `refactor` (refactoring)

Never commit with `--no-verify`. The pre-commit hook is mandatory.
