#!/bin/bash
CONTEXT=$(cat <<EOF
$(cat ~/.claude/primer.md 2>/dev/null || echo "No prior state found")

Recent commits:
$(git log --oneline -5 2>/dev/null)

Modified files:
$(git diff --name-only HEAD 2>/dev/null)

Current branch:
$(git branch --show-current 2>/dev/null)
EOF
)

PROMPT="${1:-read the context and tell me the best next task}"
claude --append-system-prompt "$CONTEXT" -p "$PROMPT"
