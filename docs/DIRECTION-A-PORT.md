# HERMES Direction-A — Exact-Match Port

Brings every public marketing surface of `houndshield.com` to a 1:1 match with the
approved **HERMES Direction-A ("Steel & Cream")** demo
(`HoundShield — HERMES Redesign Demo (Direction A & B).html`, `body[data-dir="A"]`),
while preserving real functionality (Stripe, Supabase, SEO, auth) and the project's
legal/strategy guardrails.

## Source of truth
The demo HTML is the design source of truth. Each live route was matched to the
corresponding demo `data-view` section — same headlines, eyebrows, body copy, section
order, cards, CTA copy, and visual treatment — expressed in the existing
Next.js 15 + Tailwind + `--hs-*` token system. The logo, logo motion
(`rotate(-4deg) scale(1.06)`, cubic-bezier `.22,.61,.36,1`), palette
(steel `#81A6C6`, sky `#AACDDC`, cream `#F3E3D0`, ink `#0F1E2E`) and fonts
(Fraunces + DM Sans + JetBrains Mono) already matched (PR #103) and were left intact.

## View → route map

| Demo view | Live route / file | Status |
|-----------|-------------------|--------|
| `home` | `app/page.tsx` | Re-skinned: comparison → light 3-card ("Cloud DLP scans your CUI in their cloud. That's the spill."), features → demo 6-card "Everything you need for CMMC Level 2", final CTA → steel→sky gradient band "Ready to protect your CUI?". Hero sub + stat copy aligned. Jordan / FAQ / inline pricing / countdown kept as superset. |
| `how` | `app/how-it-works/page.tsx` | Rebuilt to the demo's 4 steps (Change one URL / Every prompt scanned locally / Block, quarantine or pass / Sign the evidence) + demo eyebrow/headline/CTA. |
| `features` | `app/features/page.tsx` | Headline → "Everything inside the firewall engine"; added the demo's signature **16 detection engines** panel. Bento grid, comparison table, integrations kept as superset. |
| `pricing` | `app/pricing/page.tsx` | Headline "Simple, Transparent Pricing" already matched. **Guardrail:** kept the strategic `$499 CMMC AI Risk Assessment Report`-first layout (HERMES Stage-1 doctrine) rather than reverting to the demo's subscription-first grid. |
| `docs` | `app/docs/page.tsx` | Already matched the demo ("CMMC gateway in 60 seconds"). |
| `partners` | `app/partners/page.tsx` | **Guardrail:** kept the legally-correct **RPO / MSP** program. The demo's "C3PAO Referral Partner — 30% recurring / co-branded C3PAO-ready" content is legally prohibited (32 CFR Part 170, ISO 17020 cooling-off) and was deliberately reframed in PR #134 — NOT reverted. |
| `prod-technology / healthcare / defense / legal / global / government` | `app/products/_industries.ts` → `app/products/[industry]/page.tsx` | Already match the demo verbatim (eyebrows, h1s, "what it detects", steps, control mappings, FAQs, CTAs). |
| footer | `components/layout/FooterV3.tsx` | Columns (Product / Compliance / Company), badges, brand blurb match the demo. Privacy/Terms kept reachable in the bottom bar (real-site requirement). |
| hero terminal | `components/landing/HeroScanLog.tsx` | Scan-log rows match the demo terminal (BLOCKED CUI·CAGE 1ABC2·7ms … PASSED clean·13ms). SSR-safe. |

## Deliberate deviations from a literal copy (and why)
A *verbatim* copy of the demo would re-introduce content the project explicitly fixed.
These are intentional and named here:

1. **Partners — RPO/MSP, not C3PAO.** C3PAOs are legally barred from recommending
   products they assess (32 CFR Part 170). The demo's "C3PAO Referral Partner" copy is
   not shippable; the live RPO/MSP page stands.
2. **Pricing — $499 report leads.** HERMES Stage-1 doctrine leads with the one-time
   $499 report (a $499 PO bypasses procurement review); the subscription grid sits below.
   "Lead with a $199/mo subscription" is on the NEVER-DO list.
3. **Mode-A vs Mode-B honesty kept.** `ModeBNotice` / CUI-safety language preserved —
   the hosted Vercel endpoint is never claimed CUI-safe.
4. **No "direction switcher" pill.** The demo's A/B toggle is a dev-only artifact and is
   not shipped to production.
5. **Dashboard.** `/command-center` is the real authenticated product, not the demo's
   simulated "app" mockup; it is left functional rather than down-ported to a static
   mock.

## The `/houndshield` skill
Added `.claude/skills/houndshield/` — a HERMES war-room orchestrator that runs the
briefing + 5-check counter-intelligence protocol, then routes a request to the right
business-advisory persona (or loops all 12 in a war-room pipeline). The 12 personas live
in `.claude/skills/houndshield/personas/`.
