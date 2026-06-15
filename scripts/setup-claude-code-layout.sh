#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup-claude-code-layout.sh
#
# Materializes the canonical Claude Code project layout (the "your-project" tree:
# CLAUDE.md, .claude/{agents,skills,commands,hooks,output-styles,plugins,rules},
# settings, statusline, .mcp.json). Run this YOURSELF from the repo root — your
# execution is the authorization. The agent can't auto-create behavior config from
# a screenshot (auto-mode guardrail), so this puts you in the loop.
#
#   bash scripts/setup-claude-code-layout.sh          # create what's missing
#   bash scripts/setup-claude-code-layout.sh --force  # overwrite existing
#   bash scripts/setup-claude-code-layout.sh --dry-run # show what it would do
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FORCE=0; DRY=0
for a in "$@"; do
  case "$a" in
    --force) FORCE=1 ;;
    --dry-run) DRY=1 ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
  esac
done

note(){ printf '  %s\n' "$*"; }
write(){ # write <path> <<'EOF' ... EOF
  local path="$1"; shift
  if [[ -e "$path" && $FORCE -eq 0 ]]; then note "skip  $path (exists; --force to overwrite)"; cat >/dev/null; return; fi
  if [[ $DRY -eq 1 ]]; then note "would write $path"; cat >/dev/null; return; fi
  mkdir -p "$(dirname "$path")"
  cat > "$path"
  note "write $path"
}
copy(){ # copy <src.example> <dst>
  local src="$1" dst="$2"
  [[ -f "$src" ]] || { note "skip  $dst (no template $src)"; return; }
  if [[ -e "$dst" && $FORCE -eq 0 ]]; then note "skip  $dst (exists)"; return; fi
  if [[ $DRY -eq 1 ]]; then note "would copy $src -> $dst"; return; fi
  cp "$src" "$dst"; note "copy  $src -> $dst"
}

echo "Setting up Claude Code layout in $ROOT"

# ── Output style: terse ──────────────────────────────────────────────────────
write .claude/output-styles/terse.md <<'EOF'
---
name: Terse
description: Code-only, minimal prose. Drop preamble, filler, and recaps; keep technical substance.
---

You are a senior engineer in terse mode.

- No preamble, no "Sure!", no restating the request, no closing summary.
- Lead with the answer or the diff. Prose only when it carries technical substance.
- Prefer code, file paths (`path:line`), and short imperative steps over paragraphs.
- One clear next action, not a menu of options.
- Keep technical terms exact; quote errors verbatim.

Exceptions — write normally for: security warnings, irreversible actions, and
multi-step sequences where order matters.
EOF

# ── Slash command: /commit ───────────────────────────────────────────────────
write .claude/commands/commit.md <<'EOF'
---
description: Stage changes and write a clean Conventional Commit on a non-main branch
allowed-tools: Bash(git add *), Bash(git commit *), Bash(git status *), Bash(git diff *), Bash(git branch *)
---

Review the working tree, then commit:

1. Run `git status` and `git diff --staged` (and `git diff`) to see what changed.
2. If on `main`, create a branch first — never commit to `main`.
3. Stage the relevant files (not unrelated noise).
4. Write a Conventional Commit: `<type>: <description>` (feat, fix, refactor, docs,
   test, chore, perf, ci). Body explains the why if non-trivial.
5. Do NOT push unless asked.

$ARGUMENTS
EOF

# ── Subagent: researcher ─────────────────────────────────────────────────────
write .claude/agents/researcher.md <<'EOF'
---
name: researcher
description: Web fetch + synthesis. Use for market/competitor/compliance research (CMMC, DFARS, NIST, competitors) where current, cited sources matter. Returns a structured brief, not raw dumps.
tools: WebSearch, WebFetch, Read, Grep, Glob
---

You are a research analyst for HoundShield (local-only AI compliance firewall; CMMC L2 /
DFARS 7012 buyer). Gather current, authoritative sources and synthesize.

Method:
1. Clarify the question in one line; list the sub-questions you'll answer.
2. Search broadly, then fetch the strongest primary sources (regs, vendor docs, gov pages).
3. Cross-check claims across ≥2 sources; flag anything uncertain as [UNCLEAR].
4. Return: a 3-sentence executive summary, key findings with inline source links, and a
   short "so what for HoundShield" section.

Rules: never fabricate stats or quotes; attribute every number; prefer .gov/standards bodies
for compliance claims. Output a brief, not a transcript.
EOF

# ── Hooks (inert until registered in settings.json — see end) ────────────────
write .claude/hooks/SessionStart.sh <<'EOF'
#!/usr/bin/env bash
# SessionStart hook — load lightweight project context at session start.
# Register in .claude/settings.json under hooks.SessionStart to activate.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
echo "HoundShield — local-only AI compliance firewall. Prod branch: main (Vercel auto-deploys)."
[[ -f "$ROOT/tasks/todo.md" ]] && echo "Active tasks:" && grep -m3 -E '^\s*[-*]|Active' "$ROOT/tasks/todo.md" 2>/dev/null || true
echo "Guardrails: never push to main directly; never vercel --prod without approval; build must pass."
EOF

write .claude/hooks/PostToolUse.sh <<'EOF'
#!/usr/bin/env bash
# PostToolUse hook — safe, non-destructive. Warns on stray console.log in edited TS/TSX.
# Does NOT auto-commit (auto-commit-on-edit is intentionally avoided). Register in
# .claude/settings.json hooks.PostToolUse (matcher "Edit|Write") to activate.
set -euo pipefail
f="${CLAUDE_TOOL_FILE_PATH:-}"
case "$f" in
  *.ts|*.tsx)
    if grep -nE 'console\.(log|debug)' "$f" >/dev/null 2>&1; then
      echo "note: console.log left in $f — remove before commit (use a logger)."
    fi ;;
esac
EOF

# ── Plugins doc (plugins are installed via /plugin, not hand-authored) ───────
write .claude/plugins/README.md <<'EOF'
# .claude/plugins

Plugins bundle commands + agents + MCP servers. They are installed via the marketplace,
not hand-edited here:

    /plugin marketplace add <owner/repo>
    /plugin install <name>

Relevant to HoundShield: the **vercel** plugin (`/vercel:deploy`, `/vercel:env`, status),
and review/testing plugins. Run `/plugin` to browse and manage. Installed plugins land in
this directory automatically.
EOF

# ── Custom statusline (inert until referenced in settings.json) ──────────────
write .claude/statusline.sh <<'EOF'
#!/usr/bin/env bash
# Custom Claude Code status line — branch · dir · model. Reads the JSON Claude Code
# pipes on stdin. Enable via "statusLine" in .claude/settings.json.
set -euo pipefail
input="$(cat)"
read_json(){ printf '%s' "$input" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d$1,end='')" 2>/dev/null || true; }
model="$(read_json "['model']['display_name']")"
dir="$(read_json "['workspace']['current_dir']")"
branch="$(git -C "${dir:-.}" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '-')"
printf '🛡 HoundShield  %s  ⎇ %s  ◇ %s' "$(basename "${dir:-$PWD}")" "$branch" "${model:-Claude}"
EOF

chmod +x .claude/hooks/SessionStart.sh .claude/hooks/PostToolUse.sh .claude/statusline.sh 2>/dev/null || true

# ── Personal / startup configs from templates (gitignored) ───────────────────
copy .mcp.json.example .mcp.json
copy CLAUDE.local.md.example CLAUDE.local.md
copy .claude/settings.local.json.example .claude/settings.local.json

cat <<'EOF'

Done. Canonical layout is in place.

Manual step (we don't auto-edit your live settings.json): to enable the custom statusline,
add this to .claude/settings.json:

  "statusLine": { "type": "command", "command": ".claude/statusline.sh", "padding": 0 }

To activate the new hooks, add SessionStart.sh / PostToolUse.sh under "hooks" in settings.json.
Select the terse output style any time with:  /output-style Terse
EOF
