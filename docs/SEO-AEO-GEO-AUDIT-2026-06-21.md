# HoundShield — SEO / AEO / GEO Audit & Improvement Report

**Date:** 2026-06-21
**Scope:** `compliance-firewall-agent/` (the public website at `https://houndshield.com`)
**Author:** HERMES engineering
**Branch:** `claude/website-seo-audit-improvements-6wujcj`

This report covers traditional search optimization (SEO), Answer Engine
Optimization (AEO — featured snippets, voice, People-Also-Ask), and Generative
Engine Optimization (GEO — being cited by ChatGPT, Claude, Perplexity, Gemini).
Everything below reflects what is actually in the codebase. Where a claim could
not be verified, it is labelled as a recommendation, not a fact.

---

## 1. Executive summary

The site is in **good** SEO/AEO/GEO health already — far better than a typical
early-stage SaaS. It ships structured data, a sitemap, a robots policy that
explicitly welcomes AI crawlers, an `llms.txt`, dedicated `/answers/*` pages
built for AI citation, and per-page metadata on the important routes.

The audit found **two real correctness problems** (both now fixed in this PR)
and a short list of lower-risk improvements that are recommended but not yet
done. Nothing found is an emergency; the fixes are about accuracy and squeezing
more out of the foundation that already exists.

**Fixed in this PR**

1. **Inflated detection-count claim** — public copy said "200+ detection
   patterns" while the product and the rest of the site consistently say
   **16 detection engines**. This is exactly the kind of unverified claim that
   undermines credibility with a security buyer (and an AI assessor). Corrected
   to "16 detection engines" in `llms.txt`, `/features` metadata, and the blog.
2. **No canonical host redirect** — `www.houndshield.com` and
   `houndshield.com` could both resolve and be indexed separately (duplicate
   content, split ranking signal). Added a permanent `www → non-www` 301 in
   `next.config.js`.

**Recommended next (not done — needs your input or external access)**

- Verify the Twitter/X handle `@houndshield` is real, or remove it.
- Populate `Organization.sameAs` with real LinkedIn / X / GitHub profiles.
- Add real OG images per page (currently one shared `og-image.png`).
- Add `aggregateRating` / `Review` schema **only if** you have genuine reviews.
- Confirm uptime/SLA numbers (`99.9% / 99.99%`) before they appear in copy.

---

## 2. What is already strong (keep it)

| Area | Status | Where |
|------|--------|-------|
| Title/description templates | ✅ Strong | `app/layout.tsx` |
| Open Graph + Twitter cards | ✅ Present | `app/layout.tsx` |
| `metadataBase` + canonical | ✅ Consistent (non-www) | `app/layout.tsx`, all `layout.tsx` |
| `SoftwareApplication` schema | ✅ With offers + features | `lib/seo/structured-data.ts` |
| `Organization` schema | ✅ With logo + contact | `lib/seo/structured-data.ts` |
| `FAQPage` schema (page-scoped) | ✅ Matches visible Q&A | `components/seo/FaqSection.tsx` |
| `HowTo` + `Breadcrumb` builders | ✅ Available | `lib/seo/structured-data.ts` |
| `sitemap.xml` | ✅ Dynamic, covers blog/products/answers | `app/sitemap.ts` |
| `robots.txt` | ✅ Blocks private routes, allows AI bots | `app/robots.ts` |
| `llms.txt` (GEO) | ✅ Present and detailed | `public/llms.txt` |
| Dedicated `/answers/*` pages (AEO) | ✅ Built for AI citation | `app/answers/[slug]` |
| AI-crawler allowlist | ✅ GPTBot, ClaudeBot, PerplexityBot, CCBot | `app/robots.ts` |
| Image optimization (AVIF/WebP) | ✅ Enabled | `next.config.js` |
| Security headers + CSP | ✅ Present | `next.config.js` |

This is a genuinely competitive baseline. Most of the work below is refinement.

---

## 3. Issues found

### 3.1 FIXED — Inflated / inconsistent detection-count claim (credibility risk)

**Severity: High (trust).** The site brand-consistently describes "**16
detection engines / 16 CUI patterns**" across the homepage, navbar, pricing
page, features grid, and dashboard. But three public surfaces overstated it as
"200+ patterns / 200+ CUI indicators":

- `public/llms.txt` (two lines) — read directly by ChatGPT/Perplexity/Claude.
- `app/features/layout.tsx` — the `/features` Open Graph description.
- `lib/blog/posts.ts` — a public blog post body.

For a compliance product sold to a skeptical security buyer (and increasingly
parsed by AI answer engines that cross-check claims), an unverifiable inflated
number is worse than a smaller honest one. All three were corrected to the
accurate **"16 detection engines."**

> Note: the other "200+" strings in the codebase (in
> `lib/gateway/providers/*`) refer to **OpenRouter's 200+ supported LLM
> models**, which is accurate — those were left unchanged.

### 3.2 FIXED — No `www → non-www` canonical redirect (duplicate content)

**Severity: Medium.** The entire codebase canonicalizes to **non-www**
(`https://houndshield.com`) — sitemap, robots, every `canonical` tag, the
structured data, and the existing HTTP→HTTPS redirect all agree. But there was
no redirect forcing `www.houndshield.com` to the canonical host. If DNS serves
both, Google can index both and split the ranking signal.

Added a permanent 301 host redirect in `next.config.js`:

```js
{
  source: '/:path*',
  has: [{ type: 'host', value: 'www.houndshield.com' }],
  destination: 'https://houndshield.com/:path*',
  permanent: true,
}
```

> **Action for you:** confirm in the Vercel/DNS dashboard that
> `www.houndshield.com` is attached to the project (otherwise the redirect
> never gets the chance to fire). Also note: `CLAUDE.md` states the canonical
> as `www.houndshield.com` — that contradicts the code, which uses non-www
> everywhere. The code is internally consistent, so we standardized on
> **non-www**. Update `CLAUDE.md` to match, or tell us if www should be
> canonical instead (that would be a larger change).

### 3.3 OPEN — Possibly-fake social signals

**Severity: Low–Medium (trust + Knowledge Panel).**

- `app/layout.tsx` sets `twitter.creator: "@houndshield"`. If that handle
  doesn't exist, it's a dead signal and a small credibility ding. **Verify or
  remove.**
- `lib/seo/structured-data.ts` → `organizationSchema()` has `sameAs: []`
  (empty). Populating this with real LinkedIn, X, and GitHub URLs is the single
  biggest lever for Google Knowledge Panel eligibility. **Add real profiles
  only.**

### 3.4 OPEN — One shared OG image for the whole site

**Severity: Low.** Every page shares `public/og-image.png`. Per-page OG images
(especially for `/pricing`, `/hipaa`, `/answers/*`, and blog posts) measurably
improve click-through from social and chat surfaces. Next.js supports
`opengraph-image.tsx` per route for auto-generated images. Recommended, not
required.

### 3.5 OPEN — `sitemap.ts` uses `new Date()` for every `lastModified`

**Severity: Low.** Static pages report "modified today" on every crawl, which
trains crawlers to distrust your `lastmod`. Use real per-page modified dates
(e.g., from git or a content front-matter field) so crawlers prioritize pages
that actually changed.

### 3.6 OPEN — `verification.google` renders an empty meta tag when unset

**Severity: Cosmetic.** `app/layout.tsx` sets
`verification.google: process.env.... ?? ""`, which emits
`<meta name="google-site-verification" content="">` when the env var is missing.
Harmless, but cleaner to omit the key entirely when there's no value. Set
`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in Vercel and submit the sitemap in
Google Search Console + Bing Webmaster Tools.

### 3.7 OPEN — AI-crawler allowlist is narrower than the site

**Severity: Low.** In `app/robots.ts`, the AI-bot rule explicitly allows only
`/ /blog/ /docs/ /features/ /pricing/ /hipaa/`. Because `/` is allowed and only
a few paths are disallowed, the high-value `/answers/*` and `/products/*` pages
are still crawlable — so this is not blocking anything today. But making the
intent explicit (adding `/answers/`, `/products/`, `/how-it-works/`,
`/about/`) is good hygiene for the pages you most want cited by AI engines.

---

## 4. AEO (Answer Engine Optimization) assessment

**Verdict: strong.** You already have the hard part — dedicated `/answers/*`
pages with `FAQPage`/`HowTo` schema and visible Q&A that matches the markup.

To improve:
- Keep every answer's first paragraph a **direct, ~40–55 word answer** to the
  question (this is what gets lifted into featured snippets and voice results).
- Expand the `/answers/*` set to cover the long-tail questions Jordan actually
  types: *"Does ChatGPT violate CMMC?"*, *"Is sending CUI to OpenAI a DFARS
  7012 violation?"*, *"What is SPRS and how do I improve my score?"*,
  *"CMMC Level 2 deadline 2026"*.
- Add `BreadcrumbList` schema to answer/product pages (the builder already
  exists in `structured-data.ts`).

---

## 5. GEO (Generative Engine Optimization) assessment

**Verdict: strong foundation.** `llms.txt`, the AI-crawler allowlist, and the
clear "what/who/how" structure of your content are exactly what LLMs ingest.

To improve:
- Consider an extended `llms-full.txt` with deeper technical detail (LLMs will
  fetch it when they need more than the summary).
- The asymmetric pitch — *"every cloud AI DLP tool sends your CUI to their
  servers, which is itself a DFARS 7012 spill; HoundShield scans locally"* — is
  the single most quotable, differentiated sentence you own. Make sure it
  appears verbatim in `llms.txt`, the homepage, and at least one `/answers/`
  page so models reproduce it when asked to compare DLP tools.
- Now that the "16 detection engines" number is consistent everywhere, models
  will cite one coherent figure instead of contradicting themselves.

---

## 6. Prioritized action list

| # | Action | Owner | Effort | Status |
|---|--------|-------|--------|--------|
| 1 | Correct "200+" → "16 detection engines" | code | S | ✅ Done (this PR) |
| 2 | Add `www → non-www` 301 | code | S | ✅ Done (this PR) |
| 3 | Verify/attach `www` domain in Vercel | you | S | ⏳ Needs dashboard |
| 4 | Reconcile `CLAUDE.md` canonical (www vs non-www) | docs | S | ⏳ Decision |
| 5 | Verify or remove `@houndshield` Twitter handle | you | S | ⏳ |
| 6 | Populate `Organization.sameAs` with real profiles | code | S | ⏳ Needs URLs |
| 7 | Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` + submit sitemap | you | S | ⏳ |
| 8 | Per-page OG images (`opengraph-image.tsx`) | code | M | ⏳ |
| 9 | Real `lastModified` dates in sitemap | code | M | ⏳ |
| 10 | Expand `/answers/*` to long-tail CMMC questions | content | M | ⏳ |
| 11 | Broaden AI-crawler allowlist (explicit) | code | S | ⏳ |

S = under an hour · M = a few hours.

---

## 7. Other changes shipped in this PR (not strictly SEO)

These were requested alongside the audit:

- **Logo hover motion everywhere.** The brand mark animates (rotate + scale
  toward the cursor) on hover. It previously only triggered when hovering the
  small image directly. The wrapping logo links in the main navbar
  (`components/Navbar.tsx`), the landing footer
  (`components/landing/LandingFooter.tsx`), the command-center sidebar
  (`app/command-center/layout.tsx`), and the partner sidebar
  (`app/partner/layout.tsx`) now carry the `group/brand` class, so hovering
  anywhere on the logo+wordmark area animates the mark. Respects
  `prefers-reduced-motion`.
- **Darker, more readable body text.** The two grayish light-mode text tokens
  were darkened toward near-black for contrast (these power the bulk of the
  marketing-site body copy, ~460+ usages):
  - `--hs-ink-secondary`: `#243646` → `#14222D`
  - `--hs-ink-tertiary`: `#46596C` → `#2E4150`
  Plus a couple of low-contrast `slate-400/500` labels on white cards in
  `WhyHoundshield` were darkened. The dark dashboard/command-center text was
  intentionally left alone — light text on dark surfaces there is correct by
  design.

`npm run build` passes after all changes.
