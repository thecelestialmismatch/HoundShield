# everything-claude-code — Full Claude Code Capability Reference

Complete reference for Claude Code features. Use when you need to know if a capability exists before building a workaround.

## Agents

9 built-in agent types (invoke via Agent tool):
- `Explore` — fast codebase search, file pattern matching
- `Plan` — architecture and implementation planning
- `general-purpose` — research, multi-step tasks
- `code-reviewer` — bugs, security, compliance correctness
- `debugger` — systematic root cause tracing
- `test-writer` — TDD, 80% coverage minimum
- `security-auditor` — auth, payments, compliance engine
- `compliance-specialist` — SPRS, CUI, HIPAA, SOC 2 validation
- `refactorer` — graph-powered dead code removal, symbol rename
- `doc-writer` — API docs, onboarding guides
- `team-lead` — governance, escalation handler

## Skills (User-Invocable via `/skill-name`)

Skills live in `.claude/skills/*.md`. Frontmatter `trigger:` field wires to slash command.

## Hooks

Hooks run shell commands automatically on events:
- `PreToolUse` — before any tool call
- `PostToolUse` — after tool call (matcher: regex on tool name)
- `PreCommit` — before git commit
- `Notification` — on Claude notification
- `Stop` — when Claude stops responding
- `SessionStart` — on new session

Hook stdout is shown to Claude; non-zero exit blocks the action.

## MCP Servers

Add servers in `.claude/mcp.json`. Each server exposes tools prefixed `mcp__<server>__`.

## Permissions

`.claude/settings.json` allow/deny lists use glob patterns:
```json
"allow": ["Bash(npm run *)", "Bash(git diff *)"],
"deny": ["Bash(rm -rf *)", "Read(.env*)"]
```

## Model Configuration

```json
{
  "model": "claude-sonnet-4-6",
  "defaultModel": "sonnet",
  "extendedThinking": { "maxTokens": 8000 }
}
```

## Key Shortcuts (Terminal)

- `Esc Esc` — interrupt current response
- `Ctrl+R` — search command history
- `/clear` — clear context (keep system prompt)
- `/compact` — compress conversation
- `/model <name>` — switch model mid-session
- `/cost` — show token usage

## HoundShield Agent Dispatch Rules

| Trigger | Agent |
|---------|-------|
| Any compliance engine change | `compliance-specialist` first, then `code-reviewer` |
| CRITICAL security finding | Stop → `team-lead` |
| New feature > 50 lines | `test-writer` first (TDD) |
| Build failing | `debugger` |
| PR ready | `security-auditor` then push |
