#!/usr/bin/env bash
# houndshield — push all session work to GitHub and open a PR
# Run from your LOCAL machine (not inside Docker/sandbox)
# Prerequisites: git, gh CLI (brew install gh && gh auth login)

set -e
cd "$(dirname "$0")/.."   # repo root

echo "🔓 Removing stale git locks..."
rm -f .git/index.lock .git/HEAD.lock .git/COMMIT_EDITMSG.lock 2>/dev/null || true

echo "📋 Staging all changes..."
git add -A

echo "💾 Committing..."
git commit -m "feat: rebrand to houndshield + PRD v2 + agent team + Brain AI + deploy infra

## What changed

### Rebrand (171+ files)
- Kaelus → houndshield across all TS, TSX, MD, JSON, shell files

### PRD + Strategy
- docs/PRD.md: PRD v2.0 — manager mode, 4-phase roadmap, competitive matrix
- Pricing locked: Starter free | Pro \$199 | Growth \$499 | Enterprise \$999 | Agency \$2499

### Agent Governance (.claude/)
- CLAUDE.md: 90-line lean reference (was bloated, now token-efficient)
- agents/: team-lead, code-reviewer, security-auditor, debugger, test-writer, doc-writer, refactorer
- commands/: fix-issue, deploy, pr-review
- rules/: frontend, database, api
- hooks/: pre-commit TypeScript check, lint-on-save
- settings.json: claude-opus-4-6 model, deny list (no git push --force, no cat .env)

### Brain AI
- lib/brain-ai/knowledge-graph.ts: 12-node CMMC/competitor knowledge graph
  - Nodes: CMMC Level 2, CUI, NIST 800-171, HIPAA, SOC2, Nightfall, Cloudflare, Strac, Forcepoint
  - managerModeCheck(): flags off-plan work (HIPAA before \$10K MRR, K8s before \$30K MRR)
  - buildCompressedContext(): token-efficient context injection
- lib/brain-ai/firecrawl-updater.ts: auto-scrape NIST/competitor updates into knowledge graph
- lib/brain-ai/index.ts: exports KG + updater

### Landing Page
- SetupSteps.tsx: real Docker/env/API commands (no marketing fluff)
- Testimonials.tsx: honest proof points (16 engines, <10ms, 1-click PDF) — no fake testimonials

### SEO
- app/layout.tsx: shield favicon 🛡️, sharper OG/Twitter copy, no misleading 'blockchain' language
- app/robots.ts: houndshield.com, disallows /api/ /command-center/ /auth/
- app/sitemap.ts: 11 URLs with correct priority weights

### Deploy Infrastructure
- Dockerfile: houndshield branding, non-root hardened user (houndshield:1001)
- docker-compose.yml: full env var wiring, security hardening, port 3000 only
- docs/deploy-production.md: 30-min runbook (Supabase migrations, Stripe, Vercel, smoke test)

### Bug Fixes
- tsconfig.json: exclude legacy/ (eliminates 20+ false TS errors from Bun/execa deps)
- lib/brain-ai/query-engine.ts: fixed 2 type cast errors (unknown intermediate casts)

## Blockers fixed
- STRIPE_WEBHOOK_SECRET: was empty, now set
- Supabase migrations: runbook created (supabase db push)

## What's next
1. supabase db push (apply 9 migrations to production)
2. Supabase Auth → URL Config → add https://houndshield.com/**
3. Vercel: push env vars from .env.local → production
4. Smoke test: signup → checkout → webhook → dashboard"

echo "🚀 Pushing to origin..."
git push origin feat/system-refactor-launch-prep

echo ""
echo "🔀 Opening pull request..."
gh pr create \
  --title "feat: houndshield rebrand + PRD v2 + Brain AI + deploy infra" \
  --base main \
  --head feat/system-refactor-launch-prep \
  --body "$(cat compliance-firewall-agent/PR_BODY.md 2>/dev/null || echo 'See commit message for full details.')" \
  --label "enhancement" || echo "⚠️  gh CLI not installed. Open the PR manually at: https://github.com/thecelestialmismatch/Kaelus.Online/compare/feat/system-refactor-launch-prep"

echo ""
echo "✅ Done."
echo "   Next: apply Supabase migrations → set Vercel env vars → deploy"
