#!/usr/bin/env bash
# .claude/statusline.sh — custom Claude Code bottom-bar
#
# OPT-IN: this does nothing until referenced in .claude/settings.json:
#   "statusLine": { "type": "command", "command": ".claude/statusline.sh" }
#
# Claude Code pipes a JSON blob on stdin (cwd, model, etc.). We keep it simple
# and just show: branch · short dir · model. Safe no-op if jq is missing.

input="$(cat)"

dir="$(basename "$(pwd)")"
branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '—')"

model="claude"
if command -v jq >/dev/null 2>&1; then
  model="$(printf '%s' "$input" | jq -r '.model.display_name // .model // "claude"' 2>/dev/null || echo claude)"
fi

printf '🦴 HoundShield  %s  ⎇ %s  ·  %s' "$dir" "$branch" "$model"
