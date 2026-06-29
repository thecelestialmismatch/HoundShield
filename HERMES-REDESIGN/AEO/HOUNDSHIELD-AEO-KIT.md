# HoundShield — AEO Kit (Answer Engine Optimization)
**Goal:** be *the answer* for CMMC-AI questions in Google featured snippets, People Also Ask, voice, and AI Overviews — and get cited by ChatGPT, Claude, Perplexity & Gemini.
**Files in this folder:** `llms.txt`, `houndshield-schema.jsonld.html`, `answer-can-defense-contractors-use-chatgpt.md`, `answer-dfars-7012-ai-tools.md`, this kit.

---

## The one principle
Write for the person asking the question. After every question-heading, the **first sentence is the complete answer in 40–60 words.** Everything else is support. If a snippet can be lifted from your first paragraph, you've done 80% of AEO right. (Source: the AEO guide you provided.)

## Reality check (no bluffing)
AEO sits **on top of** SEO — snippets almost always come from pages already ranking top-10. So these pages win as you build authority (the C3PAO backlinks in your audit are the fastest lever). Expect first movement in ~4–6 weeks, AI citations once a few authoritative links point in. There is no same-day version.

---

## 1. Question map → page plan
Each row = one answer page (`/answers/<slug>`), answer-first, with FAQPage schema. ★ = already drafted in this folder.

| Target question (real query) | Format | Direct answer (the lede) | Status |
|---|---|---|---|
| ★ Can defense contractors use ChatGPT? | Paragraph + steps | "Yes — but only if CUI is scanned and blocked locally before prompts leave the network." | Drafted |
| ★ DFARS 7012 AI tools — what's allowed? | Paragraph + table | "CUI cannot reach AI tools outside your authorized system — including cloud DLP." | Drafted |
| ChatGPT CMMC compliance | Paragraph + steps | "ChatGPT is not CMMC-compliant by default; CUI in prompts must be blocked locally first." | To write |
| CMMC Level 2 AI firewall | Paragraph | "A CMMC Level 2 AI firewall intercepts AI prompts and blocks CUI on-prem before they leave." | To write |
| Is ChatGPT HIPAA compliant? | Paragraph | "No — pasting PHI into ChatGPT is a disclosure unless PHI is stripped or blocked locally first." | To write |
| Local AI proxy for CMMC | Paragraph + how-to | "A local AI proxy scans every prompt on your hardware so CUI never reaches the model." | To write |
| C3PAO evidence PDF export | List/how-to | "Export an SSP, POA&M, and SPRS attestation as SHA-256-signed PDFs mapped to 110 controls." | To write |
| Nightfall vs HoundShield (for CMMC) | Table | "Nightfall scans CUI in its cloud (a DFARS 7012 exposure); HoundShield scans locally." | To write — AI-citation magnet |
| Cheapest way to pass CMMC Level 2 | List | "Close high-weight 800-171 gaps first; block AI prompt leakage — the #1 unaddressed gap." | To write |

**Where to mine more questions (free):** AlsoAsked.com, AnswerThePublic, Google "People Also Ask" (expand every box on your target queries), Google autocomplete, your Search Console "Queries" filtered for who/what/why/how, and r/CMMC + r/NISTControls threads.

## 2. The 4 snippet formats — use the right one
- **"What is / why" → paragraph snippet:** 40–60 word definition right after the H2. (CMMC AI firewall, DFARS 7012.)
- **"How to" → list snippet:** real `<ol>`/`<ul>`, each item a complete thought. (How to use ChatGPT compliantly, deploy the proxy.)
- **"X vs Y" → table snippet:** real `<table>`. (HoundShield vs Nightfall, AI data paths.)
- **Comparison/eligibility tables win AI citations** — ChatGPT/Perplexity quote head-to-head tables heavily.

## 3. Schema — deploy this week (highest ROI)
Use `houndshield-schema.jsonld.html`:
- **Site-wide** in `app/layout.tsx`: `Organization` + `SoftwareApplication`.
- **/pricing:** `Product` + `Offer` (answers "how much does HoundShield cost").
- **Every answer/product page:** `FAQPage` (each Q/A becomes snippet-eligible) + `Speakable` (voice).
- **Validate every page** with Google Rich Results Test before shipping. Mistake to avoid: styled `<div>`s instead of real `<ol>/<table>` — Google can't extract those.

## 4. Voice + AI-engine wins
- `llms.txt` (in this folder) → publish at `https://houndshield.com/llms.txt`. AI crawlers increasingly read it.
- Keep the lede answer ≤2 sentences for voice; mark it `.answer-lead` and reference it in `Speakable`.
- Page speed matters for voice/AI — your Next.js SSR pages should be fast and server-rendered (the answer must be in the HTML, not hydrated in later).

## 5. 30-Day plan (tailored to HoundShield)
**Week 1 — Research & deploy schema.** Expand PAA boxes for the 9 questions above; finalize the page list. Ship `llms.txt` + Organization/SoftwareApplication/Product schema; validate.
**Week 2 — Publish the 4 highest-intent answer pages.** Start with the 2 drafted here + "ChatGPT CMMC compliance" + "Nightfall vs HoundShield." Question-format H1, 40–60 word lede, real lists/tables, FAQPage schema each.
**Week 3 — Convert existing pages + product FAQs.** Add the framework-mapping FAQ from each product page (already written in `houndshield-demo.html`) as `FAQPage` schema. Convert headings to question form.
**Week 4 — Comparison pages + measure.** Publish "HoundShield vs Nightfall/Strac/Purview." Voice-test your questions on Google Assistant/Siri. Track Search Console impressions for question queries.

## 6. Measure
- **Search Console:** rising impressions on question queries without rising clicks = you're winning PAA/snippet visibility.
- **Manual:** search your 9 questions weekly — are you in the snippet/PAA box?
- **AI citation check:** ask ChatGPT/Perplexity/Claude "Can defense contractors use ChatGPT?" monthly — is HoundShield named? (This is your GEO scoreboard.)
- **The snippet-steal play:** where a competitor owns a snippet for a query you rank top-5 on, write a clearer/more complete 40–60 word answer and you can take it within weeks.

## 7. Wire it into the build
This is already added to `CLAUDE-CODE-PORT-PROMPT.md` Tier 3. When Claude Code runs the port it should: publish `llms.txt`, inject the JSON-LD from this kit, create `/answers/*` routes from these markdown files, and add `FAQPage` schema to every product page. Validate each with Rich Results Test; `npm run build` clean.
