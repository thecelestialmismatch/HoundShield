# HoundShield — Launch Checklist (June 2026)

Supersedes the March checklist for go-live readiness. ✅ = done in code · 🔧 = manual step you must do · ⏳ = post-launch.

## Fixed in this PR ✅

- ✅ Doberman shield logo everywhere (component, favicon, apple icon, OG image, JSON-LD logo) — old cat-mask SVG deleted
- ✅ "HoundShield" one-word brand across 110+ files (was "Hound Shield" in UI copy, emails, API headers, SDK snippets — including the broken `Hound ShieldClient` class name and invalid `X-Hound Shield-Org` HTTP header)
- ✅ Every public page on the light-steel v3 design (blog, login, signup, auth, docs, demo, agents, partners, features, hipaa, changelog, about, contact, terms, privacy, forgot-password, error/loading/404 — 21 pages migrated off the dark theme)
- ✅ Pricing: prices were white-on-white (invisible) on light cards; now $159/mo headline with "$1,910/yr billed annually · save 20%" subtitle; thousands separators; light FAQ/table
- ✅ Brain AI answers "who are you", "hello", identity/pricing/install questions instantly — deterministic FAQ layer, zero API key required
- ✅ Homepage primary CTA pointed at `/sign-up` (404) → `/signup`
- ✅ `/roadmap` page created (footer linked to a 404)
- ✅ Footer duplicate React keys (4 links → `/features`) fixed
- ✅ Sitemap: removed phantom `/cmmc`, added `/how-it-works`, `/docs/quickstart`, `/roadmap`
- ✅ `og-image.png` + `logo.png` created (metadata referenced missing files → broken social cards)
- ✅ Build green · 409/409 tests green

## Manual steps before selling 🔧 (Vercel dashboard — ~30 minutes)

1. 🔧 Set `OPENROUTER_API_KEY` (Brain AI free-form LLM answers; FAQ works without it). **Rotate the key exposed in chat on 2026-06-06 first.**
2. 🔧 Set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (prod health reports `payments: missing_key` — checkout will fail)
3. 🔧 Set the 8 Stripe price-ID env vars (`STRIPE_{PRO,GROWTH,ENTERPRISE,AGENCY}_{MONTHLY,ANNUAL}_PRICE_ID`)
4. 🔧 Update Stripe webhook URL to `https://www.houndshield.com/api/stripe/webhook`
5. 🔧 Supabase prod is `demo_mode` per health check — confirm `NEXT_PUBLIC_SUPABASE_URL`/keys in Vercel and push pending migrations (`npx supabase db push`)
6. 🔧 Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` + submit sitemap in Google Search Console (site barely indexed)

## Demo-test runbook (run the day you start demos)

1. `curl https://www.houndshield.com/api/health` — all services `connected`/`operational`
2. Homepage → "Start free" → complete signup → land in command center
3. `/demo` → paste CUI sample → verify flags render
4. Brain AI bubble → "who are you" → identity answer; "pricing" → tier answer
5. `/pricing` → Pro → checkout reaches Stripe (test mode)
6. Dashboard → Shield → Reports → export PDF, open it
7. Mobile pass: repeat 1–4 at 375px width

## Post-launch ⏳

- ⏳ Record demo video (use docs/DEMO-SCRIPT.md)
- ⏳ C3PAO outreach wave (10 from marketplace.cmmcab.org)
- ⏳ npm audit hardening pass (15 vulns, 2 critical)
- ⏳ Tag `proxy-v0.1.0` to publish Mode B Docker image to GHCR
- ⏳ Lighthouse/Core Web Vitals pass
