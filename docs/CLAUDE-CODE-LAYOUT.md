# HoundShield — Canonical Claude Code Layout

This is the project's Claude Code setup, matching the canonical "your-project" tree.
Most of it already exists; the rest is materialized by one script (see bottom).

```
HoundShield/                         Project root Claude Code reads
├─ CLAUDE.md                         Project rules (committed)
├─ CLAUDE.local.md                   Personal overrides (gitignored)        ← from .example
├─ .gitignore                        Ignores *.local.* + secrets
├─ .mcp.json                         MCP servers, root (gitignored-local)   ← from .example
└─ .claude/                          Where Claude Code looks first
   ├─ agents/                        Subagents, isolated context
   │  ├─ code-reviewer.md            Reviews diffs, returns a summary       (exists)
   │  ├─ researcher.md               Web fetch + synthesis                  ← script
   │  └─ … hermes-build/ops/qa/seo, compliance-specialist, debugger, …     (exist)
   ├─ skills/                        Model-invokable, load on demand        (23 skills exist)
   ├─ commands/                      Slash commands
   │  ├─ commit.md                   /commit — stage + Conventional Commit  ← script
   │  └─ deploy / ship / pr-review / fix-issue / plan-ceo / ralph           (exist)
   ├─ hooks/                         Deterministic, fire on events
   │  ├─ SessionStart.sh             Load context on startup                ← script
   │  ├─ PostToolUse.sh              Safe lint-warn after edits             ← script
   │  └─ lint-on-save.sh / pre-commit.sh                                    (exist)
   ├─ output-styles/                 Custom response formats
   │  └─ terse.md                    Code-only, no prose                    ← script
   ├─ plugins/                       Bundled commands + agents + MCP
   │  └─ README.md                   Managed via /plugin marketplace        ← script
   ├─ rules/                         Path-scoped, load on glob match
   │  ├─ api.md  database.md  frontend.md  stack.md                         (exist)
   ├─ workflows/                     Dynamic workflows (ultracode)
   │  ├─ houndshield-port.js  houndshield-aeo-pages.js  README.md           (exist)
   ├─ settings.json                  Permissions, model, hook registry      (exists)
   ├─ settings.local.json            Personal, gitignored                   ← from .example
   └─ statusline.sh                  Custom bottom-bar                      ← script
```

## Materialize the missing pieces

The agent cannot auto-author Claude Code *behavior* config from a screenshot (auto-mode
guardrail — and that's correct). So the missing files ship as templates + one script you run:

```bash
bash scripts/setup-claude-code-layout.sh            # create what's missing
bash scripts/setup-claude-code-layout.sh --dry-run  # preview
bash scripts/setup-claude-code-layout.sh --force    # overwrite existing
```

Running it (you, the human) is the authorization. It writes the `← script` files above and
copies the `.example` templates into their gitignored real names. Two manual one-liners it
prints at the end (enabling `statusLine` and registering the hooks in `settings.json`) are
left to you, since editing the live settings file should be your explicit choice.
```
