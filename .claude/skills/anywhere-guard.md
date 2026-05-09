---
name: anywhere-guard
description: Destructive command guard and agent config portability. Intercepts dangerous git/bash commands and asks for confirmation. Based on anywhere-agents by yzhao062. Use when setting up new environments or when you want to enforce the destructive-command guard across all agents.
user-invocable: true
---

# Anywhere Guard Skill

Portable agent configuration with destructive command guard.
Built on: https://github.com/yzhao062/anywhere-agents

## What It Does

1. **Destructive command guard**: Before executing git push, git reset --hard, rm -rf, or force operations, Claude confirms with the user
2. **Writing style enforcement**: Blocks AI-generated filler phrases in documentation
3. **Dual-agent review**: Implements the /implement-review pattern (implement + critique in sequence)
4. **Config portability**: Syncs agent behavior across machines and projects

## HoundShield-Specific Guard Rules

Commands that always require explicit confirmation:
- `git push --force` (blocked outright per .claude/settings.json)
- `git push origin main` (blocked outright)
- `vercel --prod` (blocked outright)
- `rm -rf` (blocked outright)
- Any database migration to production
- Any change to `proxy/patterns/index.ts` (16 detection patterns -- SACRED)
- Any change to `lib/gateway/` that could affect the data boundary

## Banned Words in Documentation

Claude never uses these phrases in HoundShield documentation or copy:
- empower, unleash, revolutionize, supercharge
- cutting-edge, state-of-the-art, next-generation
- delve into, pivotal, seamlessly
- leverage (as a verb)
- Any emoji used as decoration

## Implement-Review Pattern

When building a non-trivial feature:

```
Step 1: Implement
  - Write the code
  - Write the tests
  - Run the build

Step 2: Review (separate agent turn)
  - Re-read the implementation cold
  - Check: does this serve Jordan's CMMC pain directly?
  - Check: data boundary intact?
  - Check: TypeScript strict, no any?
  - Check: test coverage >= 80%?
  - If any check fails: fix before marking complete
```

## Install (new environment)

```bash
# Zero-install
npx anywhere-agents

# Or tell Claude:
# "Install anywhere-agents in this project"
```

## Settings Integration

The guard patterns are enforced via `.claude/settings.json` deny list.
Current denied commands are in `/home/user/HoundShield/.claude/settings.json`.

To add a new guard:
```json
{
  "permissions": {
    "deny": ["Bash(your-dangerous-command *)"]
  }
}
```
