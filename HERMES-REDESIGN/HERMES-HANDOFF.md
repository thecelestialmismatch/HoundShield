# HERMES — Session Handoff, Deploy Guide & Next-Session Prompt
**Date:** 2026-06-13 · **Owner:** HOUNDSHIELD · **Repo:** github.com/thecelestialmismatch/HoundShield · **Site:** houndshield.com
**Design direction chosen:** **A — Steel & Cream** (`#81A6C6 / #AACDDC / #F3E3D0 / #D2C4B4`) + real doberman-shield logo.

---

## 0. Read this first — the honest status

Everything built this session is a **standalone, verified prototype** living in `HERMES-REDESIGN/` (and copied into `compliance-firewall-agent/public/` so it can deploy as a static pitch URL). It is **not yet wired into the live Next.js app**. Translation:

- **Deploying these files → gives you shareable demo URLs** (`houndshield.com/redesign-demo.html`, `/redesign-dashboard.html`). Great for pitching today.
- **It does NOT restyle houndshield.com's real pages.** The live site is the Next.js app in `compliance-firewall-agent/`. The redesign goes live only after **Section 3 (the port)** is done — on a branch you review, then merge → Vercel auto-deploys.

I could not push/deploy from my environment (no GitHub/Vercel credentials there, and your `.git/index.lock` is held by your Mac). Section 2 is the exact copy-paste to do it yourself in ~2 minutes.

---

## 1. What you asked → what I delivered

| You asked for | Status | Where |
|---|---|---|
| Brutal honest audit of site + repo (mismatches, broken links, Brain failure, brand/logo, pricing) | ✅ Done | `HOUNDSHIELD-AUDIT-AND-PLAN.md` |
| Reason NOT to pivot + a sharper idea from Betalist | ✅ Done | Audit §3 (moat is local-only architecture; idea = free `/gap-report`) |
| Truth on ranking on Google + getting cited by ChatGPT/Claude/Gemini | ✅ Done | Audit §4 (AEO foundation now; ranking takes weeks) |
| Two design directions to choose from | ✅ Done → you picked **A** | `houndshield-demo.html` (A/B toggle) |
| One consistent palette + logo on **every** page | ✅ Done | Real doberman logo in nav/footer/dashboard; unified tokens |
| All pages with consistent UI + working hover mega-menus | ✅ Done | hover menus fixed (click-through bridge) |
| Fix the pricing contradiction | ✅ Done | One ladder + working Monthly/Annual toggle |
| Fix brand drift (HoundShield vs "Hound Shield", logo) | ✅ Done in demo | /docs renders "HoundShield" + real logo |
| 6 product pages — what it is / who / how / what it detects — **hover-only access** | ✅ Done | `prod-technology/healthcare/defense/legal/global/government` views, reachable only via Products mega-menu |
| Deeper, **non-bluffing** product pages (framework mapping + FAQ, sourced stats) | ✅ Done | Each page: SOC2/HIPAA/NIST/PCI mapping table + FAQ; stats attributed (IBM $4.45M, Anthem $16M, C3PAO estimate, FedRAMP marked roadmap) |
| Remove "CMMC Level 2 deadline · November 2026" everywhere | ✅ Done | 0 remaining |
| A **live** after-login dashboard, as a separate file | ✅ Done | `houndshield-dashboard.html` — opens straight into a live SOC console |

**Live dashboard includes:** ticking clock, scrolling throughput chart, streaming threat feed (flash on each intercept), ticking KPIs, SPRS count-up + ring fill, detection-mix donut, moving engine bars, jittering p50 latency, plus working tabs (Live Feed, CMMC Assessment, Reports, Brain AI that answers "Who are you?", Settings).

**Every file verified:** HTML tag-balanced + JavaScript passes `node --check`.

### File map (in `HERMES-REDESIGN/`)
```
houndshield-demo.html            – full marketing site, Direction A + B toggle, 6 hover-only product pages
houndshield-dashboard.html       – standalone LIVE after-login Command Center
houndshield-logo.png             – the real doberman-shield logo (transparent)
HOUNDSHIELD-AUDIT-AND-PLAN.md    – audit + commercialization plan
HERMES-HANDOFF.md                – this file
```
Also copied to `compliance-firewall-agent/public/redesign-demo.html` and `…/redesign-dashboard.html` for deploy.

---

## 2. Push to GitHub + Vercel (copy-paste, on YOUR Mac)

Open Terminal and run:

```bash
cd ~/Desktop/HoundShield-main

# 1) clear the stale lock (a crashed git or an open editor left it)
rm -f .git/index.lock

# 2) you're already on the branch I created: hermes/redesign-demos
git checkout hermes/redesign-demos 2>/dev/null || git checkout -b hermes/redesign-demos

# 3) stage ONLY the redesign work (do NOT 'git add -A' — your tree has 257 unrelated changes)
git add HERMES-REDESIGN \
        compliance-firewall-agent/public/redesign-demo.html \
        compliance-firewall-agent/public/redesign-dashboard.html

git commit -m "HERMES: Direction A redesign demos + live dashboard + audit"

# 4) push the branch to GitHub
git push -u origin hermes/redesign-demos
```

**Deploy options:**

- **Preview URL (safe, recommended first):** pushing the branch makes Vercel build a **preview deployment** automatically. Open your Vercel dashboard → the `hermes/redesign-demos` deployment → use the preview URL. Demos are at `/redesign-demo.html` and `/redesign-dashboard.html`.
- **Production:** merge `hermes/redesign-demos` into your Vercel **production branch** (per your notes that's the auto-deploy branch), or from `compliance-firewall-agent/` run `vercel --prod`. After it deploys, the demos are live at:
  - `https://houndshield.com/redesign-demo.html`
  - `https://houndshield.com/redesign-dashboard.html`

> These are **static pitch pages** — perfect to send a C3PAO or a prospect today. They do not change your existing app routes. (That's Section 3.)

---

## 3. What's LEFT to make the redesign your ACTUAL live site (the port)

This is the real work, sequenced. Each item is small and known — no research, just execution. Do it on a branch, build, then merge.

**Tier 1 — design unification (makes houndshield.com look like the demo)**
1. **Port Direction A tokens** into `app/globals.css` (your `--hs-*` vars already match — apply them uniformly).
2. **Swap the nav logo:** `components/Logo.tsx` still renders the simplified inline SVG — point it at the real doberman (`/houndshield-logo.png` or an optimized SVG). *Favicon/app-icons are already done (commit 19b7ebd).*
3. **Unify every route** to the shared `Navbar` + `Footer`: `app/docs/` (currently a legacy "Hound Shield" layout) and `app/command-center/*` must use the same shell + palette.
4. **Add the 6 product pages** as real routes (`app/products/[industry]/page.tsx`) wired into the Products mega-menu — port the copy + mapping tables + FAQ from `houndshield-demo.html`.
5. **Port the live dashboard** into `app/command-center/` (the standalone `houndshield-dashboard.html` is the spec).

**Tier 2 — revenue blockers (so the site can take money & the AI works)**
6. **Reconcile pricing in code** to one ladder + Monthly/Annual toggle (match the demo); kill the nav-vs-page mismatch.
7. **Brain "who are you":** add `identity` + `product` + `pricing` facts to `lib/brain/knowledge-base.ts`, and set `OPENROUTER_API_KEY` in Vercel so the v3 path stops 500-ing.
8. **Stripe:** fix webhook URL + set `STRIPE_WEBHOOK_SECRET` + the 8 price-ID env vars (per your CLAUDE.md). Test a live checkout.
9. **Supabase:** push migrations 003 + 004 (`npx supabase db push`).

**Tier 3 — discovery / AEO foundation**
10. Confirm `app/sitemap.ts` + `app/robots.ts` cover the new routes; verify `public/llms.txt` is current.
11. Add **JSON-LD** (`SoftwareApplication`, `Organization`, `FAQPage` from the product-page FAQs, `Product`+`Offer`) in `app/layout.tsx` / per route.
12. Write the answer-pages (one per target keyword) — see Audit §4.

**Release gate:** `cd compliance-firewall-agent && npm run build` passes · pricing identical nav↔page · Brain answers "who are you" · one test checkout succeeds.

---

## 4. Ready-to-paste prompt for the next session (the port)

> **HERMES — execute the Direction A production port.** Work on branch `hermes/direction-a-port` in `compliance-firewall-agent/`. Use `HERMES-REDESIGN/houndshield-demo.html` and `houndshield-dashboard.html` as the visual spec and `HERMES-HANDOFF.md` §3 as the task list. Do Tier 1 first (globals.css tokens, `components/Logo.tsx` → real doberman, unify `app/docs` + `app/command-center` to the shared Navbar/Footer, add `app/products/[industry]` routes wired to the Products mega-menu, port the live dashboard into command-center). Then Tier 2 (reconcile pricing, add Brain identity/product/pricing facts to `lib/brain/knowledge-base.ts`, wire Stripe envs, push Supabase migrations). Then Tier 3 (JSON-LD + sitemap + answer-pages). Run `npm run build` after every route. Do NOT push to main or deploy to prod — open a PR with exact merge + redeploy commands and show me diffs + a local preview first. No fabricated stats; keep every claim sourced.

---

## 5. What's needed AFTER market research (GTM → first 10 customers)

The product/site is the easy half. Revenue comes from distribution. In priority order:

**A. Validate before you scale (the market research itself)**
- **Interview 5–10 ISSOs / IT security managers** at 50–500-person defense contractors. Confirm: do they fear AI prompt leakage enough to pay $199–$999/mo? What's their actual buying trigger (a failed assessment? a prime's flow-down clause?)?
- **Confirm pricing willingness** — is $199 Pro too low to be credible to a CISO, or right? Test $199 vs $499 entry.
- **Verify the C3PAO channel** — call 3 authorized C3PAOs (cyberab.org/Catalog). Will they refer for 30%? That single answer decides your GTM.
- **Watch a real user deploy** — can they actually do the "one URL change" in 10 minutes without you? Time it.

**B. Distribution (your own "highest-leverage" plan, confirmed)**
1. **Contact 10 C3PAOs** with the partner pitch — one partner > 50 cold emails. Use the `/partners` page + a demo URL from Section 2.
2. **Ship the free `/gap-report` tool** as a real lead magnet — you already have the **$499 Gap Report SKU on /pricing** (commit 942fcea); now build the free ungated version that produces the PDF and captures emails. Lead magnet → $499 product → backlinks/AEO in one asset.
3. **Publish the SEO/AEO answer-pages** (Audit §4 keyword list), one per week, each with the question as H1 and the answer in the first paragraph + JSON-LD FAQ.
4. **Comparison pages** ("HoundShield vs Nightfall for CMMC", "the DFARS 7012 problem with cloud DLP") — these win AI citations.

**C. Close + retain**
- Instrument the funnel (PostHog is already on): visitor → signup → gateway-live → paid. Find the drop-off.
- First 3 customers: onboard them personally, get a real testimonial (no fabrication — defense buyers audit everything).
- Then turn that into the case study that powers the next 10.

**The number that matters:** 10 paying customers. Everything above either moves toward that or it doesn't.

---

*Built this session: full Direction-A marketing demo (8 page types incl. 6 hover-only product pages), a standalone live dashboard, the real logo wired through, a brutal audit, and this handoff. All files verified (HTML balanced, JS `node --check` clean). Nothing was pushed or deployed — that's yours to run from Section 2.*
