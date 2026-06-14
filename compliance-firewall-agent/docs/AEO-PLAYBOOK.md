# AEO Playbook — HoundShield

Answer Engine Optimization (AEO): structuring content so HoundShield *is the answer*
in featured snippets, People-Also-Ask boxes, voice answers, Google AI Overviews, and
AI chat citations (ChatGPT / Perplexity / Claude) — not just a blue link.

This file documents what shipped, the schema topology, and the ongoing plan.

## Why AEO matters here
Our buyer (an IT/security manager at a defense contractor) searches in questions:
*"Is ChatGPT HIPAA compliant?"*, *"How much does an AI compliance firewall cost?"*,
*"What deployment mode is CUI-safe?"*. Whoever owns the direct answer to those questions
owns the consideration set. AEO is how a young domain wins position-zero before it has
authority to win rank-one.

## What shipped (2026-06-14)

### 1. Page-scoped FAQ schema + visible Q&A
The generic site-wide `FAQPage` block was replaced with **topical, page-specific FAQs**.
Google only honors FAQ rich results when the Q&A is visibly on the page, so a single
component renders both at once:

- `lib/seo/faqs.ts` — curated FAQ datasets, each answer in the snippet-optimal
  ~40–60 word "direct answer" shape, questions phrased the way users actually search.
- `lib/seo/structured-data.ts` — pure, tested JSON-LD builders
  (`faqPageSchema`, `howToSchema`, `breadcrumbSchema`, `softwareApplicationSchema`,
  `organizationSchema`).
- `components/seo/JsonLd.tsx` — hardened `<script type="application/ld+json">` renderer.
- `components/seo/FaqSection.tsx` — renders the visible accordion **and** the matching
  FAQPage schema together, so they can never drift apart.

Wired into: home, `/hipaa`, `/pricing`, `/features`, `/how-it-works`, `/brain-ai`.

### 2. HowTo + Breadcrumb schema
`/how-it-works` emits a `HowTo` ("How to deploy HoundShield", `PT15M`) so the install
steps are eligible for step display and voice read-out. Breadcrumbs added on
`/how-it-works` and `/brain-ai`.

### 3. Global entity schema
`SoftwareApplication` (with all five priced offers — powers "how much does X cost"
answers) and `Organization` (Knowledge Panel eligibility) remain site-wide, now sourced
from typed builders.

### 4. New answer-first page
`/brain-ai` — an autonomous-compliance-copilot page with its own direct-answer FAQ set,
added to the sitemap.

### Schema topology (the important decision)
| Schema | Scope | Where |
|--------|-------|-------|
| SoftwareApplication, Organization | site-wide | `app/layout.tsx` |
| FAQPage | **page-scoped** | each page via `<FaqSection>` |
| HowTo, BreadcrumbList | page-scoped | relevant pages via `<JsonLd>` |

Page-scoping FAQPage avoids the same Q&A duplicating across every URL and lets each page
answer its own intent.

## Foundations already in place
- `app/robots.ts` explicitly allows AI crawlers (GPTBot, ClaudeBot, PerplexityBot, CCBot,
  GoogleOther) on public content — a GEO prerequisite.
- `app/sitemap.ts` lists all public pages.
- Per-page metadata (title/description/canonical/OpenGraph) in layout + pages.
- `lib/brain-ai/faq.ts` keyless answer engine (answers on-site without an LLM key).

## How to add AEO to a new/edited page
1. Add a topical FAQ set to `lib/seo/faqs.ts` (questions distinct from other pages,
   answers ~40–60 words, lead with the direct answer — no preamble).
2. Drop `<FaqSection items={yourFaqs} title="…" />` near the bottom of the page.
3. For step-by-step content, add `howToSchema(...)` via `<JsonLd>`.
4. `npm test` (the `lib/seo` tests enforce question/answer quality and cross-page
   uniqueness), then `npm run build` and confirm the schema lands in
   `.next/server/app/<page>.html`.

## 30-day plan (HoundShield-tailored)
**Week 1 — question research.** Pull PAA + autocomplete for: "AI compliance", "CMMC AI",
"is ChatGPT HIPAA compliant", "DFARS 7012 AI", "CUI ChatGPT". Map each to an existing page
or a gap.
**Week 2 — restructure.** Convert headings to question form where natural; ensure each key
page leads with a 40–60 word direct answer; expand FAQ sets from Week 1 findings.
**Week 3 — schema + blog.** Add `Article` schema to blog posts; publish 2–3 answer-first
posts on the highest-volume questions ("Is ChatGPT HIPAA compliant?", "CMMC Level 2
deadline", "cheapest path to a SPRS score").
**Week 4 — measure + iterate.** Track in Google Search Console: impressions on
question-queries, snippet/PAA wins. Manually search target questions weekly; ask
Siri/Google Assistant the top 5 and note the source. Double down on what's winning.

## Measurement
- **GSC:** rising impressions on question-form queries (often precedes click growth) =
  winning more PAA/snippet surface.
- **Manual:** weekly search of target questions; monthly voice-assistant check.
- **AI citation:** periodically ask ChatGPT/Perplexity/Claude the buyer's questions and
  check whether HoundShield is named.

## Guardrails
- Every FAQ answer must be truthful to the product (mode boundaries: Cloud = demo/non-CUI,
  self-hosted/air-gapped = CUI-safe). Never claim CUI-safety for cloud mode.
- Keep answers concise; over-long answers get truncated in snippets.
- Use real `<ol>`/`<table>` for steps/comparisons — never styled `<div>`s — so they're
  extractable.
