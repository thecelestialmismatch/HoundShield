# FAQ system

One data layer, one accordion, one searchable hub — every marketing page and
the consolidated `/faq` page share the same components and the same vetted
answers.

## Where things live

| File | Role |
|------|------|
| `lib/seo/faqs.ts` | All FAQ datasets + `FaqItem`/`FaqLink`/`FaqGroup` types + `faqSlug()` + `faqHubGroups` |
| `components/ui/FaqAccordion.tsx` | The one accordion — deep-linkable, copy-link, actionable chips |
| `components/seo/FaqSection.tsx` | Accordion + heading + contact row **+ FAQPage JSON-LD** (per-page use) |
| `components/seo/FaqHub.tsx` | Searchable, category-navigable hub (renders bare `FaqAccordion`, **no schema**) |
| `app/faq/page.tsx` | The consolidated `/faq` help center |

## Answer authoring rules (enforced by `lib/seo/__tests__/faqs.test.ts`)

- Questions are PAA-style, end in `?`, ≤14 words, and **unique across every
  dataset** (each page emits a unique FAQPage schema — no cross-URL dupes).
- Answers are snippet-optimal (~25–85 words), lead with a direct sentence, and
  contain **no link markup** — actionable links go in the separate `links[]`
  array so the schema's `acceptedAnswer.text` stays snippet-pure.
- `links[]` entries are site-internal (`/…`) and never point a dataset back at
  its own page (no self-links).

## Deep links (shareable answers)

Every answer has a stable anchor id: `faqSlug(question)` → `faq-<slug>`. So
`https://houndshield.com/pricing#faq-is-there-a-free-version-of-houndshield`
opens and scrolls to that exact answer. Each open answer exposes a **Copy link**
button that writes `origin + pathname + #slug` to the clipboard — a seller (or an
AI agent) can share the precise answer.

Slugs are derived from the question text, so **editing a question breaks its old
deep link**. Uniqueness + shape are guarded; don't churn wording casually.

### Streaming-safe scroll

On server-streamed pages React emits content into both the live tree and a
hidden `<div id="S:…">` buffer, so the same `id` can exist twice. The accordion
therefore scopes its scroll to its own `ref` root (never global
`getElementById`) and retries once after layout settles, so a cold hard-load
lands on the visible answer, not the hidden buffer.

## The `/faq` hub

`faqHubGroups` aggregates every dataset into labelled categories. The hub adds
search, a sticky category jump-nav, and internal linking on top of the shared
accordion.

**It deliberately emits NO FAQPage JSON-LD.** Each Q&A already carries FAQPage
schema on its origin page; a second copy on `/faq` would be cross-URL structured
-data duplication (a silent SEO regression). This is locked by
`app/__tests__/faq-hub-contract.test.ts` ("emits NO FAQPage structured data").

## Guard tests

| Test | Pins |
|------|------|
| `lib/seo/__tests__/faqs.test.ts` | answer shape, question uniqueness, `links[]` internal + no self-links, `faqSlug` unique/url-safe |
| `app/__tests__/faq-hub-contract.test.ts` | hub coverage of every dataset, unique group ids/slugs, **no FAQPage schema on /faq** |
| `app/__tests__/faq-surface-contract.test.ts` | every page emitting FAQPage schema renders visible FAQ UI; core pages carry a FAQ; home+pricing carry the offer card |
| `components/__tests__/FaqHub.test.tsx` | search filter, empty state, clear, open-reset on filter change, chips render |
| `components/__tests__/v3-components.test.tsx` | accordion open/close/single-open behaviour |
| `app/__tests__/site-chrome-contract.test.ts` | `/faq` renders the cream `FooterV3` |
