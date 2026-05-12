#!/usr/bin/env bash
# houndshield — commit sync script
# Run this from your LOCAL machine to commit all session work.
# The sandbox cannot remove .git/index.lock due to permissions.

set -e

REPO_DIR="$(dirname "$0")"
cd "$REPO_DIR"

echo "→ Removing stale git lock..."
rm -f .git/index.lock

echo "→ Staging all changes..."
git add -A

echo "→ Committing..."
git commit -m "feat: rebrand to houndshield + PRD v2 + agent team + Brain AI knowledge graph + landing cleanup

- Full rebrand: Kaelus → houndshield across 171+ files
- docs/PRD.md: Full PRD v2.0 with manager mode rules, 4-phase roadmap, competitive matrix
- CLAUDE.md: Rewritten to 90 lines (lean session-constant context only)
- .claude/agents/: 7 specialist agents (team-lead, code-reviewer, security-auditor, debugger, test-writer, doc-writer, refactorer)
- .claude/commands/: fix-issue, deploy, pr-review commands
- .claude/rules/: frontend, database, api rules
- .claude/hooks/: pre-commit TypeScript check, lint-on-save
- .claude/settings.json: model, permissions, hooks config
- lib/brain-ai/knowledge-graph.ts: Token-efficient KG with 12 CMMC/competitor seed nodes + managerModeCheck()
- lib/brain-ai/firecrawl-updater.ts: Auto-update Brain AI from public URLs
- components/landing/SetupSteps.tsx: Real Docker/env var/API code examples
- components/landing/Testimonials.tsx: Honest proof points, no fake testimonials
- app/robots.ts: houndshield.com SEO config
- app/sitemap.ts: 11-URL sitemap with priority weights
- tsconfig.json: Exclude legacy/ to eliminate false TS errors
- lib/brain-ai/query-engine.ts: Fixed 2 type cast errors (unknown intermediates)"

echo "→ Pushing to origin..."
git push origin feat/system-refactor-launch-prep

echo ""
echo "✅ Done. All session work committed and pushed."
echo "   Next: Set STRIPE_WEBHOOK_SECRET in .env.local and apply Supabase migrations."
