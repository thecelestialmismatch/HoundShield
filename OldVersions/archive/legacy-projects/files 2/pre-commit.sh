#!/bin/bash
# houndshield pre-commit hook
# Runs: TypeScript typecheck + ESLint + full test suite
# Exit code 2 = BLOCK COMMIT

set -e

echo "🛡️ houndshield pre-commit: running checks..."

# 1. TypeScript strict check
echo "→ TypeScript check..."
if ! npx tsc --noEmit; then
  echo "❌ BLOCKED: TypeScript errors detected. Fix all type errors before committing."
  echo "   Run: npx tsc --noEmit --pretty for details"
  exit 2
fi

# 2. ESLint on staged files
echo "→ ESLint on staged files..."
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' || true)
if [ -n "$STAGED_FILES" ]; then
  if ! echo "$STAGED_FILES" | xargs npx eslint --max-warnings 0; then
    echo "❌ BLOCKED: ESLint errors detected. Fix all lint errors before committing."
    exit 2
  fi
fi

# 3. Check for secrets in staged files
echo "→ Checking for secrets..."
SECRET_PATTERNS=(
  "sk-[a-zA-Z0-9]{20,}"          # OpenAI API keys
  "AKIA[A-Z0-9]{16}"              # AWS access keys
  "AIza[A-Za-z0-9_-]{35}"        # Google API keys
  "ghp_[a-zA-Z0-9]{36}"          # GitHub personal access tokens
  "xoxb-[a-zA-Z0-9-]{50,}"       # Slack bot tokens
  "password\s*=\s*['\"][^'\"]+['\"]"  # Hardcoded passwords
)

for pattern in "${SECRET_PATTERNS[@]}"; do
  if git diff --cached | grep -qE "$pattern"; then
    echo "❌ BLOCKED: Possible secret detected in staged files."
    echo "   Pattern matched: $pattern"
    echo "   Remove all secrets from code. Use environment variables."
    exit 2
  fi
done

# 4. Check for `any` type in TypeScript staged files
echo "→ Checking for TypeScript 'any'..."
if [ -n "$STAGED_FILES" ]; then
  ANY_USAGE=$(echo "$STAGED_FILES" | xargs grep -n ": any" 2>/dev/null || true)
  if [ -n "$ANY_USAGE" ]; then
    echo "❌ BLOCKED: TypeScript 'any' type detected:"
    echo "$ANY_USAGE"
    echo "   Replace 'any' with proper types. No exceptions."
    exit 2
  fi
fi

# 5. Check for Supabase client in non-legacy files
echo "→ Checking for Supabase in new code..."
SUPABASE_USAGE=$(echo "$STAGED_FILES" | xargs grep -l "supabase" 2>/dev/null || true)
if [ -n "$SUPABASE_USAGE" ]; then
  echo "⚠️  WARNING: Supabase reference detected in:"
  echo "$SUPABASE_USAGE"
  echo "   Supabase is NOT permitted for CUI data. Confirm this is intentional."
  # Warning only, not block — legacy migration files may reference Supabase
fi

# 6. Run full test suite
echo "→ Running test suite..."
if ! npm run test -- --run; then
  echo "❌ BLOCKED: Test suite failed. All tests must pass before committing."
  exit 2
fi

echo "✅ All pre-commit checks passed. Committing..."
exit 0
