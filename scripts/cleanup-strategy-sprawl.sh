#!/usr/bin/env bash
#
# Removes superseded strategy documents listed in
# docs/operating-system/05-DELETE-LIST.md, tiers two and three.
#
# Touches no application code, no proxy code, no tests and no configuration.
# Every path below was verified to exist on 2026-09-08.
#
# Usage:
#   scripts/cleanup-strategy-sprawl.sh          # dry run, prints what would go
#   scripts/cleanup-strategy-sprawl.sh --apply  # actually deletes
#
# Everything is recoverable with git until the deletion is committed, and
# recoverable from history afterwards.

set -euo pipefail

cd "$(dirname "$0")/.."

APPLY=0
[ "${1:-}" = "--apply" ] && APPLY=1

FILES=(
  # Tier two: duplicate strategy and prompt documents.
  "docs/MASTER-PROMPT.md"
  "docs/BEAST-FINAL-SYNTHESIS.md"
  "docs/beast-prompt-v100.md"
  "docs/BEAST_PROMPT.md"
  "docs/LeakWall_Mega_Prompt.md"
  "docs/GODMODE_ACTIVATION.md"
  "docs/CLAUDE_v2_draft.md"
  "docs/CLAUDE 2.md"
  "docs/CLAUDE_1.md"
  "docs/CLAUDE.md"
  "docs/CLAUDE-CODE-PROMPT.md"
  "docs/CLAUDE-CODE-ULTIMATE-PROMPT.md"
  "docs/CLAUDE-CODE-LAYOUT.md"

  # Tier three: superseded roadmaps, PRDs, checklists and audits.
  "docs/ROADMAP.md"
  "docs/ROADMAP-12-MONTH.md"
  "docs/HOUNDSHIELD_ROADMAP_24M.md"
  "docs/PRD.md"
  "docs/PRD-V3-5K-MRR.md"
  "docs/KAELUS-PRD.md"
  "docs/LAUNCH-CHECKLIST.md"
  "docs/LAUNCH-CHECKLIST-2026-06.md"
  "compliance-firewall-agent/LAUNCH-CHECKLIST.md"
  "docs/AUDIT-2026-05-12.md"
  "docs/VALIDATION.md"
  "docs/VALIDATION-2026-07-12.md"
  "docs/SEO-AEO-GEO-AUDIT-2026-06-21.md"
  "docs/PRE-LAUNCH-AUDIT-2026-08-15.md"
  "docs/SECURITY-PHASE-2-AUDIT.md"
  "docs/FOUNDER-ACTIONS-2026-07-04.md"
  "docs/REPO-CLEANUP-2026-07-04.md"
  "docs/SEO_REMEDIATION_PLAN.md"
  "docs/ALL MY DATA .md"
  "docs/Untitled document.pdf"
  "docs/AI-Workflow-Resource-Audit.md"
)

# Never removed. Guards against a future edit widening this script by accident.
PROTECTED=(
  "CLAUDE.md"
  "tasks/todo.md"
  "tasks/lessons.md"
  "docs/RUNBOOK-MONEY-PATH.md"
  "docs/gtm/MSP-CHANNEL-RESEARCH.md"
  "docs/HOUNDSHIELD_PRD_v1.md"
  "docs/SEO-PLAN-2026.md"
  "ROADMAP.md"
)

for guarded in "${PROTECTED[@]}"; do
  for target in "${FILES[@]}"; do
    if [ "$guarded" = "$target" ]; then
      echo "REFUSING: protected file '$guarded' appears in the deletion list." >&2
      exit 1
    fi
  done
done

found=0
missing=0
bytes=0

for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    size=$(wc -c <"$f")
    bytes=$(( bytes + size ))
    found=$(( found + 1 ))
    printf "  %8s bytes  %s\n" "$size" "$f"
    [ "$APPLY" -eq 1 ] && rm -f -- "$f"
  else
    missing=$(( missing + 1 ))
    printf "  %8s        %s (already gone)\n" "-" "$f"
  fi
done

echo
if [ "$APPLY" -eq 1 ]; then
  echo "Deleted $found files, $bytes bytes. $missing were already gone."
  echo "Review with 'git status', then commit."
else
  echo "DRY RUN. Would delete $found files, $bytes bytes. $missing already gone."
  echo "Re-run with --apply to delete."
fi

for guarded in "${PROTECTED[@]}"; do
  [ -e "$guarded" ] || echo "WARNING: protected file '$guarded' is missing." >&2
done
