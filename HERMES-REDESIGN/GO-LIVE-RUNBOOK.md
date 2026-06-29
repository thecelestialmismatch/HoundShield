# HoundShield — GO-LIVE RUNBOOK (approved demo → houndshield.com)
Everything to take the **approved Direction-A demo** live, run end-to-end in **Claude Code**. Two lanes:
- **Lane 1 — Proper port (recommended):** demo design becomes the real Next.js app, keeping auth/dashboard/Stripe/Brain. ~1 session with `ultracode`.
- **Lane 2 — Fast static (tonight):** serve the approved `houndshield-demo.html` as a static marketing page for pitching now. 10 minutes. (You lose app functionality on those pages — use only as a stopgap.)

---

## TL;DR (Lane 1)
```bash
# in your repo, in Claude Code's terminal
cd ~/Desktop/HoundShield-main
rm -f .git/index.lock
git checkout -b hermes/direction-a-port
```
Then in Claude Code (auto mode + effort `xhigh`/`ultracode`), paste:
> **Read `HERMES-REDESIGN/CLAUDE-CODE-PORT-PROMPT.md` and execute it end-to-end as a dynamic workflow. Build after every step. Open a PR — do not push to main or deploy to prod.**
When the PR is green → merge to your Vercel **Production Branch** → Vercel auto-deploys → houndshield.com is live.

---

## PRE-FLIGHT (one-time, ~5 min)
1. **Tools:** `node -v` (≥18), `git -v`, and Vercel access. Optional: `npm i -g vercel && vercel login`.
2. **Find your production branch:** Vercel dashboard → your project → **Settings → Git → Production Branch**. Note it (e.g. `main`). This is the branch a merge auto-deploys from.
3. **Clear the stale lock** (it's why earlier commits failed): `rm -f ~/Desktop/HoundShield-main/.git/index.lock`
4. **Confirm the spec files exist:** `ls HERMES-REDESIGN/` → you should see `houndshield-demo.html`, `houndshield-dashboard.html`, `houndshield-logo.png`, `CLAUDE-CODE-PORT-PROMPT.md`, `AEO/`.

---

## LANE 1 — Proper port (recommended)

### Step 1 — Branch
```bash
cd ~/Desktop/HoundShield-main
rm -f .git/index.lock
git checkout -b hermes/direction-a-port
```

### Step 2 — Run the port in Claude Code
Turn on **auto mode**; set effort **`xhigh`** (or enable `ultracode` in `/config`). Paste this kickoff:

```
You are HERMES. Read HERMES-REDESIGN/CLAUDE-CODE-PORT-PROMPT.md and execute it end-to-end
as a dynamic workflow. The visual spec is HERMES-REDESIGN/houndshield-demo.html (marketing)
and houndshield-dashboard.html (after-login). Work only on branch hermes/direction-a-port.

Do it in order: Tier 1 (globals.css tokens; components/Logo.tsx -> real /houndshield-logo.png;
unify app/docs + app/command-center to the shared Navbar/Footer; add app/products/[industry]
routes wired to the Products mega-menu; port the live dashboard into command-center), then
Tier 2 (reconcile pricing to one ladder; add Brain identity/product/pricing facts to
lib/brain/knowledge-base.ts; wire Stripe envs), then Tier 3 (publish AEO from HERMES-REDESIGN/AEO/
— llms.txt, JSON-LD, /answers/* routes).

Run `cd compliance-firewall-agent && npm run build` after EVERY step; it must pass. No fabricated
stats. When done, open a PR with diffs + screenshots + exact merge/redeploy commands. Do NOT push
to main or run vercel --prod. End with: done / verified / left / next.
```
Claude Code will fan out, edit, build, and stop at a PR. (Dynamic workflows use more tokens — `headroom wrap claude` first to cut cost; see LEVEL-UP-INSTALL-GUIDE.md.)

### Step 3 — Review
Open the PR. Check: build passed, screenshots of `/`, `/docs`, `/pricing`, `/products/defense`, `/command-center` all show one palette + the real doberman logo + working hover menus.

### Step 4 — Deploy to production (this is what changes houndshield.com)
**Option A (Git, simplest):** merge the PR into your **Production Branch** from Step 2 → Vercel auto-deploys in ~2 min.
```bash
git checkout <your-production-branch>      # e.g. main
git merge hermes/direction-a-port
git push origin <your-production-branch>   # Vercel auto-builds & deploys
```
**Option B (Vercel CLI direct):**
```bash
cd compliance-firewall-agent
vercel --prod
```

### Step 5 — Set the env vars so the live site actually works
In **Vercel → Settings → Environment Variables** (Production), set:
- `OPENROUTER_API_KEY` → so Brain AI works (else it errors).
- `STRIPE_WEBHOOK_SECRET` + the 8 price-ID vars (`STRIPE_PRO_MONTHLY_PRICE_ID`, …) → so checkout works. Update the Stripe webhook URL to `https://houndshield.com/api/stripe/webhook`.
- Supabase: run `npx supabase db push` to apply migrations 003 + 004.
Re-deploy after setting envs (Vercel → Deployments → Redeploy).

### Step 6 — Verify it's live (acceptance checklist)
- Open `https://houndshield.com` in a private window → new Direction-A hero + real logo.
- `/docs` says **HoundShield** (not "Hound Shield"), same shell.
- `/pricing` nav dropdown and page show the **same** numbers; Monthly/Annual toggle works.
- Hover **Products** → click an industry → loads `/products/<industry>`.
- Sign in → live dashboard. Ask Brain "Who are you?" → it answers.
- `https://houndshield.com/llms.txt` loads. Run a page through Google Rich Results Test → FAQ schema detected.

---

## LANE 2 — Fast static (live tonight, for pitching)
Get the approved demo on your domain as static pages in ~10 min (no app changes):
```bash
cd ~/Desktop/HoundShield-main
cp HERMES-REDESIGN/houndshield-demo.html compliance-firewall-agent/public/redesign-demo.html
cp HERMES-REDESIGN/houndshield-dashboard.html compliance-firewall-agent/public/redesign-dashboard.html
cp HERMES-REDESIGN/houndshield-logo.png compliance-firewall-agent/public/houndshield-logo.png
git add compliance-firewall-agent/public/redesign-*.html compliance-firewall-agent/public/houndshield-logo.png
git commit -m "Add approved redesign demo as static pitch pages"
git push origin <your-production-branch>     # or: cd compliance-firewall-agent && vercel --prod
```
Live at `https://houndshield.com/redesign-demo.html` and `/redesign-dashboard.html`. Send these links to C3PAOs/prospects today. (This does NOT restyle your real `/`, `/pricing`, etc. — Lane 1 does that.)

---

## TROUBLESHOOTING
- **`index.lock` error:** `rm -f .git/index.lock` (close any editor holding the repo).
- **`npm run build` fails on missing env:** add a placeholder to `.env.example`; never commit real secrets. Build should not require live keys.
- **Vercel didn't deploy after merge:** you merged into a non-production branch — confirm the Production Branch in Settings → Git and merge into that one.
- **Logo looks dark-on-dark in the dashboard:** ensure `Logo.tsx` applies `filter: brightness(0) invert(1)` on `variant="dark"`.
- **Recharts crash on the dashboard:** keep `PlatformDashboard` as `dynamic(..., { ssr: false })`.

---

## What "live" means here
Lane 1 merged to your production branch = **houndshield.com is the approved design.** Lane 2 = approved demo reachable as static URLs for pitching while Lane 1 is in review. Recommended: do Lane 2 now (pitch today), run Lane 1 this week (real site).
