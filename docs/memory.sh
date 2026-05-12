#!/bin/bash
# ============================================================
# KAELUS.AI — SMART CONTEXT LOADER v2
# Usage:
#   ./memory.sh               → resume from last session
#   ./memory.sh "gap 1"       → resume with specific task
#   ./memory.sh --status      → print current state, no AI call
#   ./memory.sh --market      → load full market research context
# ============================================================

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Status mode (no AI call) ─────────────────────────────────
if [[ "$1" == "--status" ]]; then
  echo ""
  echo "╔══════════════════════════════════════════════════════╗"
  echo "║             KAELUS.AI — SESSION STATUS              ║"
  echo "╚══════════════════════════════════════════════════════╝"
  echo ""
  echo "Branch:      $(git -C "$ROOT" branch --show-current 2>/dev/null)"
  echo "Last commit: $(git -C "$ROOT" log --oneline -1 2>/dev/null)"
  echo "Modified:    $(git -C "$ROOT" diff --name-only HEAD 2>/dev/null | head -5 | tr '\n' ' ')"
  echo ""
  echo "── NEXT TASK ──────────────────────────────────────────"
  grep -A 3 "## NEXT TASK" "$ROOT/.claude-session-state.md" 2>/dev/null | tail -3
  echo ""
  echo "── BLOCKERS ───────────────────────────────────────────"
  grep -A 5 "## BLOCKERS" "$ROOT/.claude-session-state.md" 2>/dev/null | tail -5
  echo ""
  exit 0
fi

# ── Build compact context (minimize tokens) ──────────────────
CONTINUE_CARD=$(cat "$ROOT/CONTINUE.md" 2>/dev/null | head -60)
LAST_ERRORS=$(tail -20 "$ROOT/tasks/lessons.md" 2>/dev/null)
LAST_DEPLOY=$(tail -15 "$ROOT/tasks/lessons-deployment.md" 2>/dev/null)
RECENT_COMMITS=$(git -C "$ROOT" log --oneline -5 2>/dev/null)
CURRENT_BRANCH=$(git -C "$ROOT" branch --show-current 2>/dev/null)
MODIFIED_FILES=$(git -C "$ROOT" diff --name-only HEAD 2>/dev/null)

# ── Market context (only when --market flag used) ────────────
MARKET_CONTEXT=""
if [[ "$1" == "--market" ]]; then
  MARKET_CONTEXT=$(cat <<'MARKET'

MARKET INTELLIGENCE (2026 — do not re-research):
- 80,000–300,000 US defense contractors need CMMC Level 2 certification
- Only 0.5% certified as of 2026; Phase 2 enforcement = November 2026
- C3PAO assessment cost: $30K–$76K (rising to $150K by late 2026)
- No competitor bundles AI firewall + CMMC assessment in one product
- CalypsoAI/Prompt Security/Lakera = generic enterprise, not CMMC-specific
- Pricing validated: $199 Pro / $499 Growth / $999 Enterprise / $2,499 Agency
- Top investors: In-Q-Tel, Shield Capital, Paladin Capital ($372M Cyber Fund II), Booz Allen Ventures
- Australia: DISP + ASD Essential Eight = secondary market, near-zero competition
- SBIR/STTR available: dodsbirsttr.mil Phase I = $50K–$250K non-dilutive
MARKET
)
fi

# ── Assemble context (compact — minimize tokens) ─────────────
CONTEXT=$(cat <<EOF
# KAELUS.AI SESSION RESUME — $(date '+%Y-%m-%d %H:%M')

## QUICK RESUME
$CONTINUE_CARD

## RECENT COMMITS
$RECENT_COMMITS

## MODIFIED FILES (uncommitted)
${MODIFIED_FILES:-none}

## RECENT ERRORS (apply all rules)
$LAST_ERRORS

## LAST DEPLOYMENT ATTEMPT
$LAST_DEPLOY
$MARKET_CONTEXT

## YOUR INSTRUCTIONS
- Read CLAUDE-CODE-MISSION.md for full architecture and gap specs
- Read tasks/SPRINT-1.md for the ordered checklist
- Start with the NEXT TASK listed in CONTINUE.md
- Never deploy without user saying "deploy" explicitly
- Run npm run build before declaring anything done
EOF
)

# ── Custom task override ──────────────────────────────────────
TASK="${1:-resume from where we left off. Read CONTINUE.md first, then CLAUDE-CODE-MISSION.md, report status in under 8 lines, then start coding immediately.}"

# ── Launch Claude Code with context ──────────────────────────
echo ""
echo "⚡ Loading Kaelus.ai session context..."
echo "   Branch: $CURRENT_BRANCH"
echo "   Task: $TASK"
echo ""

claude --append-system-prompt "$CONTEXT" -p "$TASK"
