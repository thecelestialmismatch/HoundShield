# `.claude/plugins/` — Bundled commands + agents + MCP

A **plugin** packages slash commands, subagents, and MCP server config together
so they install as one unit (e.g. a `/vercel:deploy` bundle).

## Where this repo's plugins actually live

This project keeps its plugin payload at the **repo root** `/plugins/` directory
(not here). This folder exists to match the canonical Claude Code layout and to
point you there:

```
/plugins/          ← repo plugin bundles (root level)
.claude/plugins/   ← this pointer (canonical location for project-local plugins)
```

Drop project-local plugin bundles in this folder when you want them scoped to
Claude Code specifically. Nothing here is active until a plugin manifest is
present and registered.
