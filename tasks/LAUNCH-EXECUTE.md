# HoundShield — Master Launch-Execute Prompt

> Paste the block below into a fresh session, then say **"do it"**.
> Self-contained: a cold agent can act on it with zero ramp-up.

---

```
/OODA — HoundShield Stage 1 launch-readiness execution. Boil the ocean. Marginal cost
of completeness is near zero — do the whole thing, with tests, with docs, permanent fixes
only, no workarounds, no "table for later". Standard is "holy shit, that's done."

CONTEXT (do not re-derive):
- Product: HoundShield — local-only AI compliance firewall. App: compliance-firewall-agent/
  (Next.js 15 / React 19). Proxy: proxy/. Canonical URL https://www.houndshield.com/.
- Mission: Stage 1 first revenue — the $499 one-time CMMC AI Risk Assessment PDF is the
  hero product, NOT a subscription. RPO/MSP channel, never C3PAOs.
- Deployment-mode truth: Mode A (Vercel hosted) is demo/non-CUI only — NEVER claim it is
  CUI-safe. Mode B (Docker) is the only CUI-safe path. Make this distinction explicit
  everywhere it matters.

PROCESS (OODA every task):
1. Observe: read tasks/todo.md and tasks/lessons.md. Run `curl https://www.houndshield.com/api/health`.
2. Orient: run the 5-check Counter-Intelligence Protocol from CLAUDE.md. Drop anything off-plan.
3. Plan: write a checkable plan to tasks/todo.md before touching code. Mark in_progress.
4. Act: smallest correct change. Prefer editing existing files. No feature creep.
5. Verify before done. Capture corrections in tasks/lessons.md.

AUDIT + FIX SCOPE (find every gap, fix it, prove it):

A) UI / COLOURS — public pages are light mode, dashboard is dark. Reconcile the public
   palette to the approved light-steel set and enforce contrast:
   - Steel blue   #81A6C6   rgb(129,166,198)
   - Light blue   #AACDDC   rgb(170,205,220)
   - Cream        #F3E3D0   rgb(243,227,208)
   - Beige/taupe  #D2C4B4   rgb(210,196,180)
   Drive these through the --hs-* / brand-400 CSS variables. Body text slate-900 on light,
   secondary slate-600. FORBIDDEN accent classes anywhere: indigo-*, emerald-*, amber-*,
   yellow-*, blue-* raw, purple, gradients/glassmorphism on the landing page.
   - Kill every white-on-white / low-contrast regression (pricing has done this before —
     verify $159/mo headline + "$1,910/yr billed annually" and the $499 report render visibly).
   - Logo: black Doberman shield PNG only (Logo.tsx). No cat-mask SVG, no emoji favicon.
     Idle-breathe motion must work (not hover-only). app/icon.png + apple-icon.png + og-image present.
   - Brand string is "HoundShield" (one word) everywhere — no "Hound Shield".

B) LINKS / ROUTES — no 404s on CTAs, nav, or footer. Fix sitemap (no phantom routes).
   Verify /signup, /pricing, /partner, /security, /roadmap, docs, auth pages all resolve.

C) BRAIN AI — demo-critical answers (who are you / hello / pricing) must work KEYLESS via
   the FAQ layer (lib/brain-ai/faq.ts), zero API keys needed. The CUI warning
   ("Do not input CUI. Routes to a commercial cloud endpoint.") MUST be live wherever Brain
   AI is shown. If it can't be made safe, pull it from the homepage.

D) CONTENT TRUTH — no fictional metrics ("500+ teams", "2M+ scans"). One pricing grid,
   $499 report as hero. Mode-B CUI distinction visible on defense-facing copy and /security.

E) GATES (all must pass before PR):
   - Build: `cd compliance-firewall-agent && npm run build` — green.
   - Tests: 409+ stay green (fix implementation, not the hook; pre-commit blocks <80%).
   - Secrets scan clean. No hardcoded keys.
   - If previewable, run the app and verify visually — don't ask me to check manually.

CRITICAL RULES (never violate):
- Never `git push origin main`. Work on the current feature branch.
- Never `vercel --prod` without explicit approval — Vercel auto-deploys on merge to main.
- PlatformDashboard stays dynamic(ssr:false). Never combine transformStyle:preserve-3d with
  motion.div. Never modify proxy regex patterns — extend only. Run compliance-specialist
  before any detection-engine change. Local-only data boundary is sacred.

SHIP:
1. Conventional-commit the work (feat/fix/etc.), detailed messages.
2. Open a PR to main with a full change summary + test plan (use gh).
3. Redeploy: confirm the merge triggers Vercel auto-deploy (do NOT force prod manually).
   Report the preview/prod deploy status and the health-check result.

OUTPUT: BLUF first. End with the HERMES DEBRIEF block (completed / Stage-1 progress /
architecture status / next priority / blockers). Then remind me what manual Vercel env
steps remain (key rotation, Stripe IDs, Supabase prod, webhook URL) per
docs/LAUNCH-CHECKLIST-2026-06.md.
```

---

**Usage:** copy the fenced block → new session → paste → `do it`.
