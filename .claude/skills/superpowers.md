# superpowers — Extended Claude Code Capabilities

Pattern library for advanced Claude Code workflows: parallel agents, memory compression, self-improving hooks, and context-aware task routing.

## Core Patterns

### Parallel Worktree Agents
Run independent workstreams simultaneously without merge conflicts:
```bash
# Each agent gets an isolated git worktree
git worktree add ../hs-feat-a -b feat/a
git worktree add ../hs-feat-b -b feat/b
# Agents work in parallel, merge when done
```

### Memory DNA — REMOVED 2026-09-03
`lib/agent/memory-dna.ts` was deleted. It was written, documented in three
places, and imported by nothing — a reachability audit found no caller from any
route, page, script or test. The import example that used to sit here would not
have compiled.

For session state, use `lib/agent/memory.ts`, which is wired and in use.

### Self-Improving Hooks
PostToolUse hooks that auto-fix issues:
```json
{
  "PostToolUse": [{
    "matcher": "Edit|Write",
    "command": "npx tsc --noEmit --incremental 2>&1 | grep 'error TS' | head -3 || true",
    "timeout": 15000
  }]
}
```

### Context-Aware Model Routing
- Sonnet 4.6: default, all tasks
- Opus 4.7: architecture decisions, compliance engine changes, security audits
- Haiku 4.5: bulk classification, pattern matching, high-volume log analysis

## HoundShield-Specific Superpowers

### Compliance Chain of Thought
For CMMC/NIST questions, force extended thinking:
```
Think through NIST 800-171 control AC.1.001 implementation step by step before answering.
```

### Pattern Scanner Hot-Reload
`proxy/patterns/index.ts` can be updated without restarting the proxy — the scanner reloads patterns on each scan cycle.

### Brain AI Query Chain
```typescript
// Chain brain queries for compound answers
const cmmc = await ask("What CMMC controls does this violate?");
const remediation = await ask(`Given: ${cmmc.answer}, what's the remediation?`);
```

## Trigger: `/superpowers`
Activates extended thinking + parallel agent mode for the current task.
