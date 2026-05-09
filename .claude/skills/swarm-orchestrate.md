---
name: swarm-orchestrate
description: Multi-agent orchestration using swarm-forge patterns. Use when a task requires multiple parallel agents (architect + coder + reviewer pattern). Invoked for complex compliance engine changes, major feature builds, or tasks that benefit from isolated git worktrees per agent.
user-invocable: true
---

# Swarm Orchestrate Skill

Orchestrate multiple AI agents in parallel using swarm-forge patterns.
Built on: https://github.com/unclebob/swarm-forge

## When to Use

- Building a complex feature that requires design + implementation + review in parallel
- Compliance engine changes (always needs security-auditor + compliance-specialist + code-reviewer in parallel)
- Tasks that benefit from isolated git branches per agent to avoid conflicts
- Any task requiring more than 2 agents working simultaneously

## Three-Agent Pattern (Standard)

```
Architect Agent  ->  Coder Agent  ->  Reviewer Agent
(strategy)           (implementation)   (QA + security)
```

### For HoundShield Compliance Engine Changes

```bash
# 1. Architect designs the change
Agent(subagent_type="Plan", prompt="Design the CUI detection improvement for [FEATURE]. Output: step-by-step plan, files to change, test strategy.")

# 2. Coder implements (isolated worktree)
Agent(subagent_type="general-purpose", isolation="worktree", prompt="Implement [PLAN]. TypeScript strict, no any, tests first.")

# 3. Reviewer validates
Agent(subagent_type="code-reviewer", prompt="Review [CHANGES]. Check: local-only data boundary, TypeScript strict compliance, test coverage >= 80%, no security issues.")
```

### For Brain AI Knowledge Ingestion

```bash
# Run in parallel:
Agent(subagent_type="general-purpose", prompt="Scrape CMMC framework docs via firecrawl and structure as JSON knowledge nodes")
Agent(subagent_type="general-purpose", prompt="Scrape Nightfall/Strac competitor pages via firecrawl and extract pricing + feature data")
Agent(subagent_type="compliance-specialist", prompt="Validate all NIST 800-171 control mappings in the ingested data")
```

## SwarmForge Configuration Pattern

For HoundShield swarm tasks, define roles in `.swarmforge/config`:

```bash
# architect: Plans the implementation
# coder: Implements in isolated worktree
# reviewer: Reviews and blocks on CRITICAL findings
# compliance: Validates compliance accuracy before merge
```

## Escalation Rule

If any agent returns a CRITICAL finding:
1. Stop all other agents immediately
2. Invoke team-lead agent
3. Do not merge until team-lead clears the finding

## HoundShield-Specific Swarm Tasks

### Sprint task: PDF report generation
```
Architect: Design PDF generation approach (react-pdf vs Puppeteer)
Coder: Implement PDF generation endpoint + tests
Reviewer: Security audit (no PII in PDF metadata, correct CMMC control references)
```

### Sprint task: Brain AI knowledge graph
```
Scraper: Firecrawl CMMC + competitor data
Indexer: Build BM25 + vector search index
Validator: compliance-specialist validates accuracy of all control mappings
```
