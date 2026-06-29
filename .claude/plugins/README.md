# .claude/plugins — Bundled plugins

Each subfolder is a self-contained Claude Code plugin: bundled slash-commands, agents,
and/or MCP servers that install together. A plugin folder contains a
`.claude-plugin/plugin.json` manifest plus optional `commands/`, `agents/`, `skills/`,
and `.mcp.json`.

| Plugin   | Provides                                  | Invoke            |
|----------|-------------------------------------------|-------------------|
| vercel   | Deploy + inspect helpers for the live app | `/vercel:deploy`  |

To add a plugin: create `<name>/.claude-plugin/plugin.json` and drop commands/agents inside.
