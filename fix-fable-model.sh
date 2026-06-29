#!/usr/bin/env bash
# fix-fable-model.sh
# Repairs Claude Code "API Error: 400 tools.N.model: Claude Fable 5 is not available. Please use Opus 4.8."
#
# Cause: an agent/subagent definition is sent to the Anthropic API with `model: fable`
#        (or claude-fable-5), but this account has no Fable/Mythos access -> 400.
# Fix:   rewrite every Fable model reference to claude-opus-4-8.
#
# Safe: auto-fixes only agent markdown (.md) files (backups saved as *.fable.bak);
#       stateful JSON (settings.json, ~/.claude.json) and env vars are REPORTED, not auto-edited.
#
# Run:   bash fix-fable-model.sh
set -uo pipefail

REPLACEMENT="claude-opus-4-8"
# Matches: model: fable | model: "claude-fable-5" | model: 'fable-mythos' ...
PATTERN="model:[[:space:]]*[\"']?(claude-)?fable[A-Za-z0-9._-]*[\"']?"

# Portable in-place sed (GNU vs BSD/macOS)
if sed --version >/dev/null 2>&1; then SED_INPLACE=(-i); else SED_INPLACE=(-i ''); fi

# Markdown agent dirs we will AUTO-FIX
FIX_DIRS=(
  "$HOME/.claude/agents"
  "$HOME/.claude/plugins"
  ".claude/agents"
  "agents"
)
# Files we only REPORT (manual edit — they hold state, unsafe to sed)
REPORT_FILES=(
  "$HOME/.claude/settings.json"
  "$HOME/.claude/settings.local.json"
  "$HOME/.claude.json"
  ".claude/settings.json"
  ".claude/settings.local.json"
)

echo "============================================================"
echo " HoundShield :: Fable-model repair"
echo "============================================================"

echo
echo "==> [1/3] Scanning agent files (.md) ..."
FOUND_MD=0
for d in "${FIX_DIRS[@]}"; do
  [ -d "$d" ] || continue
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    FOUND_MD=1
    echo "  FOUND: $f"
    grep -nEI "$PATTERN" "$f" 2>/dev/null | sed 's/^/        /'
  done < <(grep -rlEI "$PATTERN" "$d" 2>/dev/null)
done
[ "$FOUND_MD" -eq 0 ] && echo "  (none)"

if [ "$FOUND_MD" -eq 1 ]; then
  echo
  echo "==> [2/3] Fixing agent files -> model: $REPLACEMENT  (backups: *.fable.bak)"
  for d in "${FIX_DIRS[@]}"; do
    [ -d "$d" ] || continue
    while IFS= read -r f; do
      [ -n "$f" ] || continue
      cp "$f" "$f.fable.bak"
      sed "${SED_INPLACE[@]}" -E "s/$PATTERN/model: $REPLACEMENT/g" "$f"
      echo "  fixed: $f"
    done < <(grep -rlEI "$PATTERN" "$d" 2>/dev/null)
  done
else
  echo
  echo "==> [2/3] No agent .md to fix."
fi

echo
echo "==> [3/3] Reporting stateful config + environment (edit by hand if flagged) ..."
for f in "${REPORT_FILES[@]}"; do
  [ -f "$f" ] || continue
  if grep -qEiI "fable" "$f" 2>/dev/null; then
    echo "  CHECK (edit fable -> $REPLACEMENT): $f"
    grep -nEiI "fable" "$f" 2>/dev/null | sed 's/^/        /'
  fi
done
ENVHIT="$(env | grep -iE 'ANTHROPIC|CLAUDE' | grep -iE 'model|fable' || true)"
if [ -n "$ENVHIT" ]; then
  echo "  CHECK environment variables (unset or repoint to $REPLACEMENT):"
  echo "$ENVHIT" | sed 's/^/        /'
else
  echo "  env: no ANTHROPIC/CLAUDE model vars set."
fi

echo
echo "==> Verify nothing remains:"
REMAIN=0
for d in "${FIX_DIRS[@]}"; do
  [ -d "$d" ] || continue
  if grep -rnEI "$PATTERN" "$d" 2>/dev/null; then REMAIN=1; fi
done
[ "$REMAIN" -eq 0 ] && echo "  clean."
echo
echo "Done. Restart Claude Code (quit and relaunch) for the change to load."
echo "============================================================"
