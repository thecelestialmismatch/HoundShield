#!/bin/bash
# Auto-format TS/TSX files after edits
FILE="$1"

if [[ "$FILE" =~ \.(ts|tsx)$ ]]; then
  APP="$(git rev-parse --show-toplevel)/compliance-firewall-agent"
  cd "$APP" || exit 0
  npx prettier --write "$FILE" --quiet 2>/dev/null
fi

exit 0
