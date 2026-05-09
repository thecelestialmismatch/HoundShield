#!/bin/bash
# Hound Shield pre-commit hook
# Gates: TypeScript typecheck → ESLint → secrets scan → any-type → Supabase warning → test suite
# Exit 2 = BLOCK COMMIT | Exit 0 = allow

APP="$(git rev-parse --show-toplevel)/compliance-firewall-agent"
cd "$APP" || exit 0

echo "🛡️ Hound Shield pre-commit: running checks..."

# 1. TypeScript strict check
echo "→ TypeScript check..."
if ! npx tsc --noEmit 2>&1; then
  echo "❌ BLOCKED: TypeScript errors detected. Run: npx tsc --noEmit --pretty"
  exit 2
fi

# 2. ESLint on staged TS/TSX files
echo "→ ESLint on staged files..."
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' | sed "s|^compliance-firewall-agent/||" || true)
if [ -n "$STAGED_FILES" ]; then
  if ! echo "$STAGED_FILES" | xargs npx eslint --max-warnings 0 2>&1; then
    echo "❌ BLOCKED: ESLint errors detected. Fix all lint errors before committing."
    exit 2
  fi
fi

# 3. Secrets scan on staged files
echo "→ Checking for secrets..."
SECRET_PATTERNS=(
  "sk-[a-zA-Z0-9]{20,}"
  "AKIA[A-Z0-9]{16}"
  "AIza[A-Za-z0-9_-]{35}"
  "ghp_[a-zA-Z0-9]{36}"
  "xoxb-[a-zA-Z0-9-]{50,}"
  "password\s*=\s*['\"][^'\"]+['\"]"
)
for pattern in "${SECRET_PATTERNS[@]}"; do
  if git diff --cached | grep -qE "$pattern"; then
    echo "❌ BLOCKED: Possible secret in staged files — pattern: $pattern"
    echo "   Use environment variables. Never commit secrets."
    exit 2
  fi
done

# 4. TypeScript 'any' check in staged files
echo "→ Checking for TypeScript 'any'..."
if [ -n "$STAGED_FILES" ]; then
  ANY_USAGE=$(echo "$STAGED_FILES" | xargs grep -n ": any" 2>/dev/null || true)
  if [ -n "$ANY_USAGE" ]; then
    echo "❌ BLOCKED: TypeScript 'any' type detected:"
    echo "$ANY_USAGE"
    echo "   Replace with proper types. No exceptions in compliance-critical code."
    exit 2
  fi
fi

# 5. Supabase in new code warning (CUI data boundary)
echo "→ Checking Supabase usage..."
if [ -n "$STAGED_FILES" ]; then
  SUPABASE_USAGE=$(echo "$STAGED_FILES" | xargs grep -l "supabase" 2>/dev/null || true)
  if [ -n "$SUPABASE_USAGE" ]; then
    echo "⚠️  WARNING: Supabase reference in staged files:"
    echo "$SUPABASE_USAGE"
    echo "   Supabase is NOT permitted for CUI data. Confirm intentional."
  fi
fi

# 6. Test suite
echo "→ Running test suite..."
if ! npm test -- --run 2>&1; then
  echo "❌ BLOCKED: Test suite failed. All tests must pass before committing."
  exit 2
fi

echo "✅ All pre-commit checks passed. Committing..."
exit 0
