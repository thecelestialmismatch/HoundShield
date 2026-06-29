#!/usr/bin/env bash
# PostToolUse hook — fires after Edit/Write/Bash. Auto-formats edited TS/TSX and keeps
# the code-review graph fresh. Registered in .claude/settings.json. Never blocks (exit 0).
set -uo pipefail
FILE="${1:-}"
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
APP="$ROOT/compliance-firewall-agent"
# Format TS/TSX in the app workspace if prettier is available
if [[ "$FILE" =~ \.(ts|tsx|js|jsx|css|md)$ ]] && [ -d "$APP" ]; then
  ( cd "$APP" && npx --no-install prettier --write "$FILE" --quiet 2>/dev/null ) || true
fi
exit 0
