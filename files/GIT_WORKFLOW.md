# HoundShield — Credibility Sprint PR
# Branch: fix/hermes-credibility-sprint
# Purpose: Align site with research findings. Must ship before any outreach.

## === GIT COMMANDS (run in order) ===

# 1. Create and checkout branch
git checkout main && git pull origin main
git checkout -b fix/hermes-credibility-sprint

# 2. Copy new files from this PR package into your repo
# (run from your repo root, adjust source path as needed)
cp /path/to/pr-files/app/deployment/page.tsx app/deployment/page.tsx
cp /path/to/pr-files/app/security/page.tsx app/security/page.tsx  
cp /path/to/pr-files/app/gap-report/page.tsx app/gap-report/page.tsx
cp /path/to/pr-files/components/StructuredData.tsx components/StructuredData.tsx
cp /path/to/pr-files/public/llms.txt public/llms.txt

# 3. MANUAL CHANGES REQUIRED (do these by hand in your editor):

## A. app/layout.tsx — Add structured data to <head>
# Import at top:
#   import { OrganizationSchema, ProductSchema, FAQSchema } from "@/components/StructuredData";
# Add inside <head>:
#   <OrganizationSchema />
#   <ProductSchema />
#   <FAQSchema />

## B. app/pricing/page.tsx — Collapse to ONE grid
# REMOVE: annual pricing page or any second grid with different numbers
# KEEP: Free / Starter $299 / Pro $799 / Enterprise $1,499 / Audit Pack $999
# REMOVE: Federal tier, Agency tier
# REMOVE: placeholder metrics (500+ teams, 2M+ scans, 14,312 blocked)

## C. Homepage (app/page.tsx) — Fix three things
# 1. REMOVE "local-only" from hero if it implies the hosted endpoint is local
#    REPLACE with: "Local scanning. Nothing leaves your network in Mode B."
#    ADD link: "See deployment modes →" pointing to /deployment
# 2. ADD Brain AI CUI warning if Brain AI is visible:
#    Banner: "Brain AI uses commercial endpoints. Do not input CUI. See /security for details."
# 3. REMOVE all placeholder metrics unless they are real and verifiable

## D. nav / footer — Add new pages
# Add to navigation: /deployment, /security, /gap-report
# Footer: remove "SOC 2 · GDPR · HIPAA · EU AI Act" until certs are earned
#         replace with: "SOC 2 Type I in progress · Docker Mode B is CUI-safe · CMMC-aligned"

# 4. Stage and commit
git add -A
git status  # review before committing

# SECURITY CHECK — run before every commit:
grep -r "sk-" . --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules
grep -r "OPENAI_API_KEY" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules | grep -v ".env"
grep -r "secret\|password\|token" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules | grep -v ".env"
# If any results: STOP. Fix before committing.

git commit -m "fix: credibility sprint — deployment modes, security page, gap-report product, schema.org, llms.txt, remove placeholder metrics"

# 5. Push and create PR
git push origin fix/hermes-credibility-sprint

# 6. Merge to main (after review)
git checkout main
git merge fix/hermes-credibility-sprint --no-ff -m "merge: credibility sprint"
git push origin main

# 7. Vercel auto-deploys on push to main. Monitor:
#    vercel.com/dashboard → watch deploy logs
#    Check live: houndshield.com/deployment, /security, /gap-report

## === VALIDATION CHECKLIST (check these after deploy) ===

[ ] houndshield.com/deployment — shows 3 modes, Mode A warning visible
[ ] houndshield.com/security — no fictional metrics, Brain AI warning live
[ ] houndshield.com/gap-report — $499 product page live
[ ] houndshield.com/pricing — ONE grid only, no contradicting prices
[ ] houndshield.com/llms.txt — accessible (returns 200)
[ ] Homepage — no "500+ teams" or "2M+ scans" placeholder metrics
[ ] Homepage — "local-only" claim qualified with Mode B reference
[ ] View source on pricing page — confirm schema.org JSON-LD present
[ ] Google Search Console — submit sitemap after deploy

## === WHAT THIS PR DOES NOT INCLUDE (next PRs) ===

- Docker image publish to Docker Hub (separate task: docker build + docker push)
- Sitemap generation (add next-sitemap package: npm install next-sitemap)
- Brain AI removal/restriction from homepage (requires design decision: warn or remove?)
- SEO articles (separate content sprint, not code)
- Stripe Audit Pack SKU (do in Stripe dashboard, no code change needed)
