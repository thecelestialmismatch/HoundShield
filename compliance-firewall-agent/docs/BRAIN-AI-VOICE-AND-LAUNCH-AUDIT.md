# Brain AI Human-Voice + Launch-Audit Reality Map (2026-06-26)

## 1. Brain AI now answers like a human expert

Three layers, enforced at the boundary so the result is guaranteed regardless of model:

1. **Voice (system prompt)** — `components/GlobalChat.tsx` and `app/api/chat/route.ts` instruct:
   warm, direct, precise; no filler openers ("Certainly!", "Of course!", "Great question!");
   flowing complete sentences; lists spoken in prose ("First… Second… And third…"), never a
   dash/star/bullet; no markdown of any kind; adapt to the asker's vertical (healthcare/PHI,
   defense/CUI/CMMC, legal/privilege); lead with the answer; never refuse what it can do.
2. **Output sanitizer** — `lib/brain-ai/format-answer.ts → cleanAnswer()` strips markdown emphasis,
   `#` headings, `>` quotes, code fences, and **horizontal rules (`---`/`***`/`___`)**, converts any
   stray `-`/`*` bullet to `•`, and rewrites links — while **preserving real hyphens** (`800-171`,
   `−203 to +110`). Applied to FAQ answers (server) and the assembled streamed text (client).
3. **Input sanitizer** — `lib/brain-ai/sanitize-input.ts → sanitizeChatInput()` caps length (4000),
   strips script/HTML, neutralizes markup before the message reaches the LLM/FAQ matcher.

4. **User-awareness (NEW)** — `lib/brain-ai/user-context.ts → buildUserContextPrompt()` turns a
   signed-in user's profile (first name, company, role, tier) into a personalization block appended
   to the LLM system prompt, so Brain addresses them by name and tailors depth. The profile is
   derived from the **Supabase session server-side** (never a client-sent id, per `api.md`),
   best-effort and LLM-path-only — anonymous public-widget visitors are unchanged, and any
   error/demo-mode yields no personalization.

Provider: `lib/agent/provider.ts` runs the chat on **OpenRouter or NVIDIA NIM** (whichever key is set).
Brain AI keeps its "do not input CUI" warning — both are commercial cloud endpoints.

5. **Leak-free, human fallback (NEW)** — when no LLM key is set (or the provider returns an
   empty stream), Brain no longer dumps internal config at the user. The old keyless reply
   read *"set OPENROUTER_API_KEY in your Vercel environment variables…"* — it exposed env-var
   names and the hosting provider, and felt robotic. It now answers warmly and points to what
   it can actually help with; the operator hint (set a provider key) goes to **server logs only**
   (`console.warn` in `app/api/chat/route.ts`). Casual check-ins ("how are you?", "how am i?",
   "what's up", "thanks") also match new conversational FAQ entries, so they get a human reply
   even with no key — instead of dropping to the fallback. (`lib/brain-ai/faq.ts`)

Tests: `format-answer.test.ts` (11), `sanitize-input.test.ts` (6), `provider.test.ts` (8),
`user-context.test.ts` (7), `faq.test.ts` (8 — conversational match + asserts no env-var/Vercel leak).

## 2. The PART-2 template vs. what is actually live

The launch brief is a generic Pages-Router/Prisma/Upstash template. This repo is **Next.js 15 App
Router + Supabase**. Below is the honest status — applied with judgment, not blindly (several template
snippets would have *regressed* shipped work).

| Item | Status | Where |
|---|---|---|
| A1 Logo hover animation | ✅ Live (idle "breathe" + cursor-reactive hover, every surface) | `globals.css` `.logo-img`/`.logo-on-dark`; `Logo.tsx` |
| A2 Unified `<Logo/>` | ✅ Live (`components/Logo.tsx`, shared) — template's `next/router` version is Pages-Router and would break | — |
| B1 Hero palette → tokens | ✅ Live (83 `--hs-*` design tokens) | `globals.css`, `tailwind.config.js` |
| B2 Contrast | ✅ Tokens darkened for AA in prior sweeps | `globals.css` |
| C1 No markdown artifacts | ✅ Live (sanitizer + prompt, this PR adds `---` rule + human voice) | §1 |
| C2 OpenRouter + NVIDIA | ✅ Live | `lib/agent/provider.ts` |
| C3 User-aware answers | ✅ Live — vertical-adaptive prompt + **session-derived** name/company/role/tier injected into the system prompt for signed-in users (anonymous widget unchanged) | `lib/brain-ai/user-context.ts`, `app/api/chat` |
| D1 Broken links | ✅ Footer/nav audited; sitemap-driven | — |
| D2 Signup flow | ✅ `/signup` (email + OAuth) exists | `app/signup` |
| E1 Rate limiting | ✅ Live (sliding-window middleware, per-route caps) — Upstash is a different infra choice, not adopted | `middleware.ts` |
| E2/E4 Caching/CDN | ✅ Vercel edge + `Cache-Control` on static routes (sample PDF, security.txt) | — |
| E3 DB indexes | ✅ Present across migrations | `supabase/migrations` |
| E5 k6 load test | ⏳ Real gap — script not in repo (founder/ops, needs a target host) | — |
| F1 SEO metadata | ✅ Live (metadataBase, OG, Twitter, canonical, robots meta) | `app/layout.tsx` |
| F2/F3 sitemap/robots | ✅ Live | `app/sitemap.ts`, `app/robots.ts` |
| F4 JSON-LD | ✅ Live (SoftwareApplication + Organization + FAQ) | `components/seo/JsonLd.tsx` |
| F5 llms.txt | ✅ Live | `public/llms.txt` |
| F6 Backlinks/directories | ⏳ Off-page GTM execution (founder) | `docs/gtm/` |
| G1 Security headers | ✅ Live (HSTS, CSP, X-Frame, nosniff, Referrer, Permissions) | `middleware.ts`, `next.config.js` |
| G2 Exposed keys | ✅ None — verified `grep` clean | — |
| G3 Input sanitization | ✅ **Added this PR** | `lib/brain-ai/sanitize-input.ts` |
| Monitoring | ✅ Sentry + PostHog live | `sentry.*.config.ts`, `PostHogProvider` |

**Genuinely remaining (founder / ops, cannot be coded here):** env keys (OPENROUTER/NVIDIA, Stripe,
Supabase) + DNS (SPF/DKIM/DMARC), a k6 load-test run against a target host, off-page SEO/backlinks,
and the Supabase Auth leaked-password toggle. None are blocked by code.
