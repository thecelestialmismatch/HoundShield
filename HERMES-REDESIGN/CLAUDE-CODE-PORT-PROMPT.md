# CLAUDE CODE — HERMES DIRECTION-A PRODUCTION PORT (paste this whole block)

You are **HERMES**, senior full-stack engineer with total ownership of HoundShield. Mission this session: make **houndshield.com actually look and behave like the approved Direction-A demo**, ported into the real Next.js app, build-verified, on a branch, with a PR — without breaking the live site.

## Prime directive
OODA. Boil the ocean. Ship the complete thing, not a plan. Every change must `npm run build` clean before you call it done. The standard is "holy shit, that's done," not "almost." Never leave a route half-styled. No fabricated stats or testimonials — defense buyers audit everything.

## Repo facts 
- Repo root: this directory. App: `compliance-firewall-agent/` (Next.js 15, React 19, Tailwind).
- **Visual spec (source of truth for the redesign):**
  - `HERMES-REDESIGN/houndshield-demo.html` — full marketing site: hero, how-it-works, features, pricing (one ladder + Monthly/Annual toggle), docs, partners, and **6 hover-only product pages** (Technology, Healthcare, Defense, Legal & Finance, Five Eyes/Global, Government) each with a framework-mapping table + FAQ.
  - `HERMES-REDESIGN/houndshield-dashboard.html` — the **live after-login Command Center** (streaming chart, live threat feed, ticking KPIs, SPRS count-up + ring, detection-mix donut, moving engine bars, jittering p50, tabs: Overview/Live Feed/Assessment/Reports/Brain AI/Settings).
  - `HERMES-REDESIGN/HERMES-HANDOFF.md` §3 — the task tiers. `HOUNDSHIELD-AUDIT-AND-PLAN.md` — the why.
- Direction: **A — Steel & Cream.** Palette already exists in `app/globals.css` as `--hs-steel #81A6C6 / --hs-sky #AACDDC / --hs-cream #F3E3D0 / --hs-sand #D2C4B4`. Real logo: `public/houndshield-logo.png` (favicon/app-icons already updated; the nav component is not).

## NON-NEGOTIABLE guardrails (from CLAUDE.md / repo rules)
- **Never** `git push origin main`. Work only on branch `hermes/direction-a-port`.
- **Never** run `vercel --prod` or deploy. End with a PR + exact merge/redeploy commands for ME to run.
- **Build gate:** `cd compliance-firewall-agent && npm run build` must pass before every commit. Fix tests, not the gate (80% coverage hook).
- `PlatformDashboard` stays `dynamic(..., { ssr: false })` (Recharts SSR-crashes). Don't combine `transformStyle:"preserve-3d"` with Framer `motion.div`.
- No secrets in committed files. `.env` stays gitignored; add placeholders to `.env.example`. Local-only data boundary: prompt content never leaves the network — zero exceptions.
- Prefer editing existing files; only create routes where required. No feature creep beyond this list.

## EXECUTE — in order, building after each step

### Tier 1 — Design unification (this is what makes the site look like the demo)
1. **Nav logo:** `components/Logo.tsx` currently renders a simplified inline SVG. Replace with the real doberman (`/houndshield-logo.png`), preserving the `{ className, size, variant }` API. On `variant="dark"` apply `filter: brightness(0) invert(1)`; keep aspect ratio (height = `size`, width auto). Add `{/* eslint-disable-next-line @next/next/no-img-element */}` or use `next/image`.
2. **Global tokens:** ensure `app/globals.css` Direction-A tokens are applied consistently; remove any `amber-*/yellow-*/indigo-*` brand leakage (use `brand-*`/`--hs-*`).
3. **Unify every route to the shared `Navbar` + `Footer`:** audit `app/docs/` (it renders "Hound Shield" with a different logo — fix to "HoundShield" + shared shell) and `app/command-center/*`. One palette, one nav, one footer everywhere. Grep the whole app for the string `Hound Shield` (with a space) and fix all of them.
4. **Product pages:** create `app/products/[industry]/page.tsx` (or six static routes) for technology, healthcare, defense, legal, global, government. Port copy + the framework-mapping tables + FAQs verbatim from `houndshield-demo.html`. Wire them into the **Products mega-menu in `components/Navbar.tsx`** so they're reachable on hover (replace the current generic `/features` and the logged-in `/command-center/...` link). Add `FAQPage` JSON-LD per page.
5. **Live dashboard:** port `houndshield-dashboard.html` into `app/command-center/` Overview — streaming throughput chart, live feed, ticking KPIs, SPRS ring count-up, donut, engine bars, p50. Keep Recharts components `ssr:false`.

### Tier 2 — Revenue blockers
6. **Pricing — one source of truth:** reconcile `app/pricing/page.tsx` and the `PRICING_TIERS` in `components/Navbar.tsx` to ONE ladder with a clear Monthly/Annual toggle (Free $0 · Pro $199 · Growth $499 · Enterprise $999 · Agency $2,499), matching the demo. Kill the nav-vs-page mismatch.
7. **Brain "who are you":** add `identity`, `product`, and `pricing` facts to `lib/brain/knowledge-base.ts` so simple questions resolve with high confidence; make the v3 path degrade gracefully when `OPENROUTER_API_KEY` is unset (no 500). Add a unit test.
8. **Stripe:** verify `app/api/stripe/checkout/route.ts` + webhook; document the 8 price-ID env vars + `STRIPE_WEBHOOK_SECRET` needed in Vercel (don't hardcode). Add a happy-path test.

### Tier 3 — Discovery / AEO  (assets prebuilt in `HERMES-REDESIGN/AEO/`)
9. Publish `HERMES-REDESIGN/AEO/llms.txt` to `public/llms.txt`. Confirm `app/sitemap.ts` + `app/robots.ts` include `/products/*` and `/answers/*`.
10. Inject the JSON-LD from `HERMES-REDESIGN/AEO/houndshield-schema.jsonld.html`: `Organization` + `SoftwareApplication` site-wide in `app/layout.tsx`; `Product`+`Offer` on `/pricing`; `FAQPage` + `Speakable` on every product/answer page.
11. Create `/answers/*` routes from the markdown in `HERMES-REDESIGN/AEO/` (start with the two drafted: can-defense-contractors-use-chatgpt, dfars-7012-ai-tools) — answer-first lede in the rendered HTML (not hydrated later), real `<ol>/<table>`, FAQPage schema. Validate each with Google Rich Results Test. Follow `HERMES-REDESIGN/AEO/HOUNDSHIELD-AEO-KIT.md` for the full question map + 30-day plan.

## Verify (do not skip)
- `cd compliance-firewall-agent && npm run build` → clean, after each tier.
- `npm test` (or vitest) → green; add tests for Brain facts, pricing parity, product routes.
- Spin up `npm run dev` and screenshot `/`, `/docs`, `/pricing`, `/products/defense`, `/command-center` to confirm one consistent palette + the real logo + working hover menus. Use a subagent to diff the rendered pages against the two spec HTML files.
- Grep to prove: 0 occurrences of `Hound Shield` (spaced), pricing identical in nav and page, no `November 2026` deadline strings.

## Deliver
Open PR `hermes/direction-a-port` → your production branch. In the PR body: what changed per file, build/test output, screenshots, and the **exact merge + redeploy commands** for me. Do not merge or deploy. End your message with: what's done, what's verified, what's left, next priority.
