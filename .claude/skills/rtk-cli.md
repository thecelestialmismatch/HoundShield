---
name: rtk-cli
description: >
  RTK (Rust Token Killer) CLI reference. High-performance proxy that compresses command
  output before it reaches LLM context. 60-90% token savings on shell commands.
  Use when setting up a new machine, advising on token efficiency tooling, or documenting
  the token optimization stack for HoundShield development.
---

# RTK CLI — Rust Token Killer

Source: rtk-ai/rtk · License: MIT · Install: `brew install rtk`

---

## WHAT IT DOES

Transparent CLI proxy. Intercepts shell command output, strips noise, compresses before
reaching LLM context. Single Rust binary. <10ms overhead. 100+ supported commands.

**NOT** reachingforthejack/rtk (Rust Type Kit — different project). Verify correct install:
```bash
rtk gain    # shows token savings stats — correct RTK
```

---

## INSTALL

```bash
# macOS
brew install rtk

# Linux/macOS
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh

# Cargo
cargo install --git https://github.com/rtk-ai/rtk
```

---

## TOKEN SAVINGS (30-min session, medium TS/Rust project)

| Command | Frequency | Standard | RTK | Savings |
|---------|-----------|---------|-----|---------|
| `ls` / `tree` | 10x | 2,000 | 400 | -80% |
| `cat` / `read` | 20x | 40,000 | 12,000 | -70% |
| `grep` / `rg` | 8x | 16,000 | 3,200 | -80% |
| `git status` | 10x | 3,000 | 600 | -80% |
| `git diff` | 5x | 10,000 | 2,500 | -75% |
| `git log` | 5x | 2,500 | 500 | -80% |
| `git add/commit/push` | 8x | 1,600 | 120 | -92% |
| `npm test` | 5x | 25,000 | 2,500 | -90% |
| `pytest` | 4x | 8,000 | 800 | -90% |
| **Total** | | **~118,000** | **~23,900** | **-80%** |

---

## USAGE

RTK wraps standard commands — no config needed after install:
```bash
rtk ls              # compressed ls output
rtk git status      # compressed git output
rtk npm test        # compressed test output
rtk gain            # session token savings report
```

Configure in Claude Code hooks (PostToolUse) to auto-wrap Bash calls — see
context-mode MCP for hook-based integration.

---

## COMPLEMENTARY TOOLS

| Tool | Role | Savings |
|------|------|---------|
| RTK CLI | Command output compression | 80% on shell |
| code-review-graph | Structural code indexing | 8.2x on code reads |
| caveman mode | Output token reduction | 75% on responses |
| context-mode MCP | Session continuity + sandbox | 98% on MCP data |
| token-savior MCP | Symbol-level navigation | 77% active tokens |

Stack them for multiplicative gains. RTK + code-review-graph + caveman = ~85% total
token reduction in typical coding session.
