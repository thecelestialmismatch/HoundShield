# Third-Party Repo Review — 2026-06-14

Review-first assessment of five external repos requested for "install everything."
Decision policy: **nothing unreviewed enters the shipped compliance product.** Skill/
agent repos belong in `.claude/` (developer environment), never in
`compliance-firewall-agent/` or the `proxy/` CUI path.

The deciding lens is **boundary fit**: HoundShield's entire value is "prompt content
never leaves the customer network." Any dependency that phones home, routes models
through a third-party backend, or carries copyleft licensing is disqualified from the
product regardless of code quality.

| Repo | Type | License | Network / secrets / exec | Verdict |
|------|------|---------|--------------------------|---------|
| [andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) | Docs (`CLAUDE.md` coding principles) | permissive | none | ✅ Safe — low marginal value (overlaps existing rules) |
| [q-agent-harness](https://github.com/kju4q/q-agent-harness) | TS templates (agent map / guardrails / feedback loops) | permissive | none | ✅ Safe — adopt patterns selectively |
| [last30days-skill](https://github.com/mvanhorn/last30days-skill) | Claude Code skill (Py + Node) | MIT | reads `.env`/Keychain, calls 3rd-party APIs (Brave, Perplexity, ScrapeCreators), runs `yt-dlp` | ⚠️ Dev/env tool only — never in product |
| [headroom](https://github.com/chopratejas/headroom) | Context-compression lib (Py/Rust) | check before use | local-first, but can act as an LLM proxy wrapping provider creds; fetches models on setup | ⚠️ Isolated dev spike only — never in the CUI proxy path |
| [tinyhumansai/openhuman](https://github.com/tinyhumansai/openhuman) | Desktop AI assistant (Rust/TS) | **GPL-3.0** | OAuth to 118+ services, auto-fetch every 20 min, routes models through OpenHuman backend, executes shell/code | ❌ Reject |

## Per-repo notes & recommended action

### ✅ andrej-karpathy-skills — SAFE, optional
Documentation-only: four coding principles (Think Before Coding, Simplicity First,
Surgical Changes, Goal-Driven). No executable code. It largely restates rules already
present in this repo's `CLAUDE.md` and `~/.claude/rules`. **Action:** optional — install
as a global Claude Code skill if desired (`/plugin marketplace add ...`). Nothing to
vendor into this codebase.

### ✅ q-agent-harness — SAFE, adopt patterns
TypeScript templates for giving agents a system "map," guardrails (schema validation,
enforced lint/type checks, human approval for destructive actions), and feedback loops.
No network/secrets/exec. **Action:** the guardrail patterns align with the existing
`.claude/agents` + pre-commit gates. Borrow ideas (e.g. an `AGENTS.md` system map) where
they add value; do not bulk-copy.

### ⚠️ last30days-skill — dev/env tool ONLY
A genuinely useful market-research skill (already present in this environment's skill
list). It reads API keys from `.env`/macOS Keychain and sends queries to multiple
third-party APIs, and runs shell tools. That secret-read + external-egress profile is
fine for a developer's research workflow but is **incompatible with the product's data
boundary.** **Action:** keep it as an environment-level research skill (STRIKER/ORACLE
work). Never import into `compliance-firewall-agent/` or `proxy/`.

### ⚠️ headroom — isolated evaluation ONLY
Token/context compression (claimed 60–95% reduction). The *compression* idea is relevant
to Brain AI / LLM cost — but the library can run as a **proxy that wraps provider
credentials** and supports corporate SSL inspection bundles, and it fetches models from
external CDNs on setup. Putting any third-party proxy in front of CUI is a non-starter.
**Action:** if cost reduction is a priority, evaluate the pure compression functions in an
isolated dev spike with synthetic data only. Do **not** place it in the gateway/proxy path.

### ❌ openhuman — REJECT
Disqualified on two independent grounds:
1. **License:** GPL-3.0 copyleft is incompatible with a proprietary SaaS product.
2. **Boundary:** it OAuths into 118+ services, auto-fetches every 20 minutes, and routes
   models through the OpenHuman backend — the exact "your data leaves the building"
   pattern HoundShield sells against.
**Action:** do not integrate. If the user wants it personally, it is a standalone desktop
app, fully separate from HoundShield.

## Net result
- **0** of these were added to the shipped product (correct — preserves the data boundary
  and avoids supply-chain + GPL contamination in a security product).
- **2** (karpathy docs, q-agent-harness) are safe to adopt as developer-environment
  references at the user's discretion.
- **2** (last30days, headroom) are usable only as isolated tools/spikes outside the product.
- **1** (openhuman) is rejected outright.
