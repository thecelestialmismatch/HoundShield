---
name: token-efficiency
description: >
  Master token efficiency protocol for Claude Code sessions. Combines PULSE protocol
  (Lean Engine v1.0), RTK CLI patterns, context-mode principles, token-savior patterns,
  and claude-token-optimizer structure rules. Apply when token budget is tight, context
  window approaching limit, or starting long autonomous sessions.
---

# Token Efficiency — Lean Engine

Sources: PULSE-TOKEN-EFFICIENCY-COMPACTOR.md · rtk-ai/rtk · mksglu/context-mode ·
tirth8205/code-review-graph · Mibayy/token-savior · drona23/claude-token-efficient ·
ooples/token-optimizer-mcp · nadimtuhin/claude-token-optimizer · alexgreensh/token-optimizer

---

## THE 10 COMMANDMENTS

1. Don't read files already in context.
2. Don't read whole files when you need 5 lines — grep/sed instead.
3. Don't write comments that say what the code says.
4. Don't use 10 lines when 2 do the same thing.
5. Don't repeat yourself — extract, template, configure.
6. Don't load everything at boot — lazy load on demand.
7. Don't write prose when structured output works.
8. Don't preamble, recap, or narrate process.
9. Don't keep dead code — delete, git remembers.
10. Don't sacrifice quality for brevity — same output, fewer tokens.

---

## CODE COMPACTION (apply to all written code)

```
□ Drop obvious comments — keep only WHY, never WHAT
□ Inline single-use variables
□ Optional chaining, nullish coalescing, ternaries for conditionals
□ Arrow functions for simple transforms
□ .map/.filter/.reduce over manual loops
□ Object shorthand, spread, destructuring
□ Template literals over concatenation
□ Destructure only used imports
□ Collapse try/catch when just log-and-rethrow
□ Extract repeated 3+ line blocks to functions
□ Delete dead code (don't comment out)
```

TS/JS patterns:
```typescript
// WRONG
const x = getData(); return transform(x);
if (obj && obj.prop) { result = obj.prop; } else { result = "d"; }
const out = []; for (let i = 0; i < arr.length; i++) { if (arr[i].active) out.push(arr[i].id); }

// RIGHT
return transform(getData());
const result = obj?.prop ?? "d";
const out = arr.filter(x => x.active).map(x => x.id);
```

---

## SMART READING (before every Read/Bash tool call)

| Instead of | Do this |
|-----------|---------|
| Read entire file | `grep -n "symbol" file` then read specific lines |
| cat package.json | `jq '.dependencies' package.json` |
| Re-read file I just wrote | Skip — I know what's in it |
| Read 500-line file for 1 function | `sed -n '45,60p' file` |
| Read all agent files on boot | Read agent index only |

**Decision tree before any file read:**
1. Already in context this session? → SKIP
2. I wrote it this session? → SKIP  
3. Need whole file or just section? → read only section
4. Can grep find it? → GREP

**code-review-graph** (already installed): use `get_minimal_context_tool` and
`get_impact_radius_tool` before any code review to get minimal relevant file set.

---

## CONTEXT WINDOW BUDGET

```
15% — system prompt + CLAUDE.md
10% — memory files (state, log tail)
 5% — agent index only, not full files
60% — ACTUAL WORK
10% — buffer for tool responses
```

Burning >40% on reads before any work = FAILING this protocol.

---

## LAZY LOADING (session boot discipline)

- Read `tasks/todo.md` + `primer.md` — NOT all memory files
- Load memory/decisions.md only if the task touches architecture
- Load memory/compliance-domain.md only if task touches CMMC/HIPAA
- Agent files: read `.claude/agents/*.md` only when that agent is invoked

---

## OUTPUT COMPRESSION

- No preamble: start doing, not explaining
- No recap: "Fixed: X. Next: Y." not a paragraph
- Tables > paragraphs for comparisons
- Code > descriptions for technical solutions
- Diffs > full rewrites when editing
- Structured status: `BROKEN: email (down), db (95%), auth (fail)` not prose

---

## AGENT PROMPT COMPRESSION TARGET

```
Compressed agent prompt (<200 tokens):
Role: [agent type]
Check: [things to look for]
Output: {field, severity, issue, fix}
Rules: [2-3 project-specific rules]
```

---

## MEMORY FILE COMPACTION (weekly)

- `.claude-session-state.md`: prune sessions > 7 days, keep last 10 entries
- `tasks/todo.md`: move done items to `## Done` section, keep active under 50 lines
- `memory/*.md`: prune unused entries > 30 days
- Target: all memory files under 200 lines each

---

## AVAILABLE TOOLS (install separately if needed)

### RTK CLI (rtk-ai/rtk) — command output compression
```bash
brew install rtk          # macOS
rtk gain                  # verify install
```
Wraps shell commands, strips noise before output reaches LLM.
Savings: ls/grep/git 80%, npm test 90%, docker ps 80%.

### context-mode (mksglu/context-mode) — MCP server
```bash
/plugin marketplace add mksglu/context-mode
/plugin install context-mode@context-mode
```
Key pattern: "Think in Code" — write a script to count/analyze, don't read 50 files.
315 KB → 5.4 KB (98% reduction) via sandbox tools.

### token-savior (Mibayy/token-savior) — structural code navigation
MCP server: indexes by symbol, not file. `find_symbol("fn")` = 67 chars vs 41M chars.
77% active token reduction. 100% on coding benchmark vs 78% baseline.

### token-optimizer-mcp (ooples/token-optimizer-mcp) — Brotli caching
```bash
npm install -g @ooples/token-optimizer-mcp
```
SQLite + Brotli: cache large API responses/file content external to context.
60-90% reduction. 61 tools. Fully offline.

### claude-context (zilliztech/claude-context) — semantic search
Requires: Zilliz Cloud + OpenAI API key. Vector DB for large codebases.
Use when codebase > 100K lines and code-review-graph insufficient.

---

## ALREADY ACTIVE IN THIS PROJECT

- **code-review-graph**: PostToolUse hook in settings.json — auto-updates graph
- **caveman mode**: `/caveman` skill — 75% output token reduction
- **CLAUDE.md manager mode**: sprint discipline prevents drift work
