#!/usr/bin/env bash
# SessionStart hook — loads project context at the start of every session (zero ramp-up).
# Registered in .claude/settings.json. Safe to run anywhere; degrades gracefully.
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
echo "🛡️  HoundShield session start — $(date '+%Y-%m-%d %H:%M')"
echo "------------------------------------------------------------"
# 1. Active sprint + tasks
[ -f "$ROOT/tasks/todo.md" ]    && { echo "## Active tasks (tasks/todo.md)"; grep -m 8 -E '^\s*[-*][ ]?\[ \]|^## ' "$ROOT/tasks/todo.md" 2>/dev/null || true; echo; }
# 2. Lessons learned
[ -f "$ROOT/tasks/lessons.md" ] && { echo "## Recent lessons (tasks/lessons.md)"; tail -n 6 "$ROOT/tasks/lessons.md" 2>/dev/null || true; echo; }
# 3. Repo map pointer
[ -f "$ROOT/PROJECT-MAP.md" ]   && echo "## Repo map: see PROJECT-MAP.md (single source of truth for layout)"
# 4. Integration health (non-blocking, 3s budget)
if command -v curl >/dev/null 2>&1; then
  echo -n "## Health (houndshield.com/api/health): "
  curl -fsS --max-time 3 https://www.houndshield.com/api/health 2>/dev/null | head -c 200 || echo "unreachable (offline or not deployed)"
  echo
fi
echo "------------------------------------------------------------"
exit 0
