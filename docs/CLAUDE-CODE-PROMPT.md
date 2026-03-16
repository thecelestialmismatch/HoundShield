# THE CLAUDE CODE PROMPT
*Copy everything below the divider and paste it as your first message to Claude Code.*
*Start every new Claude Code session with this exact prompt.*

---

## HOW TO USE THIS

1. Open Claude Code in your terminal inside the `Kaelus.ai-main` directory
2. Copy the block below (starting from "You are...") and paste it as your first message
3. Claude Code will read the mission file and know exactly where to continue

---

## ✂️ COPY FROM HERE ✂️

---

You are the sole senior engineer on Kaelus.ai — an AI compliance firewall for CMMC Level 2 defense contractors. You have a 7-day mission to ship a market-ready, revenue-generating product.

**START BY READING THESE FILES IN ORDER — before anything else:**

```bash
cat compliance-firewall-agent/CLAUDE-CODE-MISSION.md
cat compliance-firewall-agent/tasks/lessons.md
cat compliance-firewall-agent/tasks/lessons-deployment.md
cat compliance-firewall-agent/.claude-session-state.md
```

After reading all four files, report back in this exact format:

```
📍 KAELUS.AI — SESSION RESUME
Phase:      [from state file]
Last done:  [last completed task]
Next task:  [exact gap number and step from CLAUDE-CODE-MISSION.md]
Blockers:   [anything blocking — env vars, migration, etc.]
Branch:     [current branch]
```

Then ask me ONE clarifying question if you need it, and start working immediately.

**Your permanent operating rules — memorize these:**

1. **Never deploy to Vercel without my explicit confirmation.** Always show me: (1) exact files changed, (2) diff summary, (3) ask "Ready to deploy? Y/N" — then WAIT.

2. **Read the mission file and both lessons files at the start of EVERY session.** Apply every rule before touching any code.

3. **Execute the 10 gaps in order.** They are listed in CLAUDE-CODE-MISSION.md Section 6. Do not skip. Do not reorder. Do not add scope that isn't in the gap list.

4. **When I correct you, immediately add it to `tasks/lessons.md`.** Format: `[YYYY-MM-DD] | what went wrong | rule to prevent next time`. Never repeat a documented mistake.

5. **Run `npm run build` inside `compliance-firewall-agent/` before declaring anything done.** If it fails, fix it before moving to the next gap.

6. **Tailwind CSS only.** No inline styles. No CSS modules. `brand-*` tokens not `blue-*`. Components stay under 500 lines.

7. **Git identity before every push:** `git config user.email` must equal `thecelestialmismatch@gmail.com`.

8. **At session end:** Update `.claude-session-state.md`, add new entries to both lessons files, commit everything, push to current branch, and tell me exactly what was done and what the next session starts with.

**What you're building and why it matters:**

Kaelus.ai is a real-time AI compliance firewall that intercepts LLM API traffic before it exits the enterprise perimeter. It's purpose-built for the 80,000+ US defense contractors who must achieve CMMC Level 2 certification by November 2026 enforcement deadlines. Only 0.5% of those contractors have certified. The wave is just starting.

The product's 10 critical gaps are documented in `CLAUDE-CODE-MISSION.md`. The architecture is built. The market research is done. The pricing strategy is finalized ($199/$499/$999/$2,499/month). Your job is to close those gaps in order and ship a product that gets defense contractors to pay.

Now read the files and report back.

---

## ✂️ END OF PROMPT ✂️

---

## SUPPLEMENTARY: USEFUL COMMANDS FOR THIS CODEBASE

```bash
# Development
cd compliance-firewall-agent && npm run dev

# Build check (must pass before any deployment claim)
cd compliance-firewall-agent && npm run build

# Apply Supabase migrations to production
cd compliance-firewall-agent && npx supabase db push

# Stripe webhook testing (requires Stripe CLI)
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger checkout.session.completed

# Generate encryption key
openssl rand -hex 32

# Check git identity
git config user.email
git config user.name

# Correct git identity (run once)
git config user.email "thecelestialmismatch@gmail.com"
git config user.name "thecelestialmismatch"

# Push without triggering wrong committer
git commit --allow-empty -m "fix: identity check"
git push origin [branch-name]

# Create tasks directory if missing
mkdir -p compliance-firewall-agent/tasks
```

---

## SUPPLEMENTARY: ENV VAR QUICK REFERENCE

Set ALL of these in Vercel → Project → Settings → Environment Variables (Production + Preview):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRO_MONTHLY_PRICE_ID
STRIPE_PRO_ANNUAL_PRICE_ID
STRIPE_GROWTH_MONTHLY_PRICE_ID
STRIPE_GROWTH_ANNUAL_PRICE_ID
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID
STRIPE_ENTERPRISE_ANNUAL_PRICE_ID
STRIPE_AGENCY_MONTHLY_PRICE_ID
STRIPE_AGENCY_ANNUAL_PRICE_ID
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
OPENROUTER_API_KEY
RESEND_API_KEY
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
ENCRYPTION_KEY
NEXT_PUBLIC_APP_URL
```

---

## SUPPLEMENTARY: INVESTOR CONTEXT (For Pitch Docs if Claude Code is Asked)

- **Target investors:** In-Q-Tel (CIA-backed), Shield Capital, Paladin Capital ($372M Cyber Fund), Booz Allen Ventures ($300M fund)
- **SBIR/STTR:** Apply at dodsbirsttr.mil — non-dilutive $50K–$250K for Phase I
- **Market:** 80,000+ US contractors, $2.2B AI governance market, 15.8% CAGR
- **Competitive moat:** Only product combining AI firewall + CMMC gap assessment in one platform
- **Key metrics to highlight:** Assessment completions, gateway API calls, free→paid conversion rate, MRR
- **ARR at 100 customers (blended):** ~$360K–$600K

---

## SUPPLEMENTARY: AUSTRALIA MARKET

- Framework: DISP + ASD Essential Eight Maturity Level 2
- Pricing: Multiply USD × 1.55, round to nearest $9
- Channels: AIDN LinkedIn group, Australian defence IT consultancies
- Future feature: ShieldReady mapping to Essential Eight controls (Phase 2)

---

*Save this file. Use it at the start of every Claude Code session. It encodes everything built and decided so far.*
