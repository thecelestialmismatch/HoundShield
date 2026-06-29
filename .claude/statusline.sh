#!/usr/bin/env bash
# Custom Claude Code status line for HoundShield.
# Shows: branch · dirty-count · days-to-CMMC-deadline · active-task.
# Registered via settings.json -> statusLine. Reads JSON context on stdin (ignored here).
set -uo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" 2>/dev/null || true
BRANCH="$(git branch --show-current 2>/dev/null || echo '∅')"
DIRTY="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
# CMMC Level 2 hard deadline: 2026-11-10
DEADLINE="2026-11-10"
NOW="$(date +%s)"
DL="$(date -d "$DEADLINE" +%s 2>/dev/null || date -j -f '%Y-%m-%d' "$DEADLINE" +%s 2>/dev/null || echo "$NOW")"
DAYS=$(( (DL - NOW) / 86400 ))
TASK="$(grep -m1 -E '^\s*[-*] \[ \]' tasks/todo.md 2>/dev/null | sed -E 's/^\s*[-*] \[ \] //' | cut -c1-40)"
printf "🛡️ %s · ✎%s · CMMC T-%sd · ▶ %s" "$BRANCH" "$DIRTY" "$DAYS" "${TASK:-idle}"
