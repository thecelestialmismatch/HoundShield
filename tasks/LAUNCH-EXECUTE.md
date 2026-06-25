# HoundShield — Master Launch-Execute Prompt

> Paste the block below into a fresh session, then say **"do it"**.
> Self-contained: a cold agent can act on it with zero ramp-up.

---

```
/OODA — HoundShield Stage 1 launch-readiness execution. Boil the ocean. Permanent fixes
only, with tests, no workarounds. Standard is "holy shit, that's done."

STEP 0 (MANDATORY, before any code): git fetch origin main && git log --oneline HEAD..origin/main.
If main is ahead, reset/rebase onto origin/main FIRST. grep main for an existing component
before creating a new one (e.g. ModeBNotice already exists). A "fixed in PR #N" memory is
worthless until you confirm #N is in this HEAD. ~30 stale branches exist — never trust the
local base.

CONTEXT (do not re-derive):
- Product: HoundShield — local-only AI compliance firewall. App: compliance-firewall-agent/
  (Next.js 15 / React 19). Canonical URL https://www.houndshield.com/.
- Mission: Stage 1 first revenue — the $499 one-time CMMC AI Risk Assessment PDF is the hero,
  NOT a subscription. RPO/MSP channel, never C3PAOs.
- Mode A (hosted Vercel) is demo/non-CUI only — NEVER claim CUI-safe. Mode B (Docker) / Mode C
  (air-gapped) are the only CUI-safe paths. Use the shared <ModeBNotice /> component for this
  disclosure (full + inline variants) on every CUI-claim-adjacent page.

PROCESS (OODA): read tasks/todo.md + tasks/lessons.md; curl /api/health; run the 5-check
Counter-Intelligence Protocol; write a checkable plan to tasks/todo.md; smallest correct change;
verify before done; log corrections to tasks/lessons.md.

AUDIT + FIX SCOPE:
A) UI/COLOURS (public pages light, dashboard dark). Palette is on --hs-* tokens
   (steel #81A6C6 · sky #AACDDC · cream #F3E3D0 · sand #D2C4B4). Public pages: ZERO forbidden
   raw classes (indigo/emerald/amber/yellow/purple/raw-blue) — use --hs-* or --hs-success/warn.
   Dark dashboard semantic status colors are allowed — do NOT strip them. Text slate-900/--hs-ink
   on light; no white-on-white; logo = Doberman PNG, motion works (idle, not hover-only); brand
   "HoundShield" one word.
B) LINKS/ROUTES — no 404 on CTAs/nav/footer; sitemap clean.
C) BRAIN AI — demo answers (who are you/hello/pricing) work KEYLESS via lib/brain-ai/faq.ts.
   Any CUI claim qualified to Mode B/C; if a live input routes to OpenRouter it shows the CUI warning.
D) CONTENT TRUTH — no fabricated metrics/testimonials (grep "[0-9][KM]?\+ (teams|scans|users)|
   trusted by [0-9]|99\.9"). Replace counts with product facts (16 engines, 110 controls, <10ms,
   SHA-256). Testimonials + company history = founder-verify; flag, don't fabricate/delete.
E) GATES — cd compliance-firewall-agent && npm run build (green) · npm run test (all green) ·
   secrets scan clean · run the app + verify visually via preview; don't ask me to check manually.

CRITICAL RULES: never git push origin main; never vercel --prod without approval (Vercel
auto-deploys on merge); PlatformDashboard stays dynamic(ssr:false); never combine
transformStyle:preserve-3d with motion.div; never modify proxy regex (extend only);
run compliance-specialist before any detection-engine change; local-only boundary sacred.

SHIP: conventional commits · open a PR to main with full summary + test plan (gh) · confirm the
merge will trigger Vercel auto-deploy (do NOT force prod) · report preview/prod + health-check.

OUTPUT: BLUF first. End with the HERMES DEBRIEF block + the remaining manual Vercel env steps
(key rotation, Stripe IDs, Supabase prod, webhook URL) per docs/LAUNCH-CHECKLIST-2026-06.md.
```

---

**Usage:** copy the fenced block → new session → paste → `do it`.
