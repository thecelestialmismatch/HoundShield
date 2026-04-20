#!/bin/bash
# Kaelus.Online pre-commit checks
# Exit 2 = block commit | Exit 0 = allow

APP="$(git rev-parse --show-toplevel)/compliance-firewall-agent"
cd "$APP" || exit 0

echo "Running pre-commit checks..."

# TypeScript type check
npx tsc --noEmit 2>&1
if [ $? -ne 0 ]; then
  echo "BLOCKED: TypeScript errors found. Fix before committing."
  exit 2
fi

# ESLint on staged TS/TSX files
STAGED=$(git diff --cached --name-only | grep -E "\.(ts|tsx)$" | sed "s|^compliance-firewall-agent/||")
if [ -n "$STAGED" ]; then
  npx eslint $STAGED --quiet 2>&1
  if [ $? -ne 0 ]; then
    echo "BLOCKED: ESLint errors found. Fix before committing."
    exit 2
  fi
fi

echo "Pre-commit checks passed."
exit 0
