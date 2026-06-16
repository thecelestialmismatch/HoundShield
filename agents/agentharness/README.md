# agents/agentharness/ — AgentHarness (Apodex-1.0) agent bridges

> **Installed.** [AgentHarness](https://github.com/ApodexAI/AgentHarness) is
> vendored as a git submodule at **`tools/agent-harness/`** (commit-pinned). This
> folder exposes its agents as first-class entries in the HoundShield agent
> library so you can use them directly.

## Install / refresh (one command)

The submodule is already declared in `.gitmodules`. To materialize or update it:

```bash
git submodule update --init --recursive tools/agent-harness
```

Then resolve Python deps when you actually run it:

```bash
cd tools/agent-harness && uv sync --python 3.12 && cp .env.example .env
```

## The agent bridges (use these)

| Bridge agent | What it runs | Use it for |
|--------------|--------------|-----------|
| [`apodex-react-researcher`](./apodex-react-researcher.md) | `react_base` (default profile, full history) | Hard multi-hop web research, verified + sourced |
| [`apodex-react-researcher-keep5`](./apodex-react-researcher-keep5.md) | `react_base` (keep-last-5 compaction) | Long-horizon research without context overflow |
| [`apodex-gateway-benchmark`](./apodex-gateway-benchmark.md) | benchmark suite via the HoundShield gateway | Prove "<10ms scan, zero agent impact" |
| [`brain-smoke-eval`](./brain-smoke-eval.md) | `tools/agent-harness-bridge/brain_smoke_eval.py` | Demo-critical Brain AI regression gate |

> **Why bridges, not copies?** AgentHarness isn't a folder of `.md` subagents — it's
> a Python ReAct harness with **one** agent role (`react_solver`) configured by
> profiles, plus a library of observers/tools/scheduling. Copying `.py` files into
> an `.md` agents folder would be cargo-culting. Instead, each bridge above is a
> real Claude Code subagent that knows how to drive the corresponding AgentHarness
> capability — and the index below makes **every** module findable.

## Complete AgentHarness module index (nothing hidden)

Everything the repo ships, mapped to its path under `tools/agent-harness/`:

### The agent (role + workflow)
| Component | Path |
|-----------|------|
| ReAct agent node (`main_agent`) | `workflows/react_base/nodes/main_agent.py` |
| Pipeline spec (`react_base`) | `workflows/react_base/spec.py` |
| Profiles (`default`, `keep5`) | `workflows/react_base/profiles/*.yaml` |
| Prompts (system / summarize) | `workflows/react_base/prompts.py` |
| Tool-result compactors | `workflows/react_base/compactors.py` |
| Agent role model (`AgentDefinition`) | `agent_harness/models/agent_definition.py` |

### Observers (the agent's guardrails)
| Observer | Path |
|----------|------|
| Budget guard | `agent_harness/components/observers/budget_observer.py` |
| Context-size guard | `agent_harness/components/observers/context_size_guard.py` |
| ReAct step tracker | `agent_harness/components/observers/react_step_tracker.py` |
| Leaked tool-call retry | `agent_harness/components/observers/leaked_tool_call_retry.py` |
| Trajectory recorder | `agent_harness/components/observers/trajectory.py` |
| SSE streaming observer | `agent_harness/components/observers/sse_observer.py` |
| Workflow-local observers (console, refusal/empty-search/duplicate-query rollback, normalizer) | `workflows/react_base/observers/` |

### Tools (what the agent can call)
| Tool | Path |
|------|------|
| Web search | `agent_harness/plugins/tools/web_search.py` |
| Web fetch / reader | `agent_harness/plugins/tools/web_fetch.py` |
| Python sandbox | `agent_harness/plugins/tools/run_python_code.py` |

### Core runtime & scheduling
| Component | Path |
|-----------|------|
| Agent loop / runtime / LLM client | `agent_harness/core/` (`runtime/`, `llm.py`, `loop_types.py`, `messages.py`, `tool.py`) |
| Model thinking-format registry | `agent_harness/model_registry.yaml` |
| Scheduler / process manager / workflow loader | `agent_harness/scheduling/` |
| Event store (sqlite) | `agent_harness/state/` |
| Benchmark runners + datasets | `benchmarks/` |

## The HoundShield bridge (mission glue)

`tools/agent-harness-bridge/` ties AgentHarness to the product:

- `README.md` — the two on-mission uses (gateway benchmark + Brain regression).
- `brain_smoke_eval.py` — the demo-critical regression check (see `brain-smoke-eval`).
- `houndshield.env.example` — wiring `OPENAI_BASE_URL` through the gateway.

## Notes

- The submodule is **commit-pinned**; `tools/agent-harness/.venv` (from `uv sync`)
  is not committed.
- AgentHarness is **Apache-2.0**. Full benchmark runs need a served model (GPU),
  dataset downloads, and search/sandbox API keys — see `tools/agent-harness/README.md`.
- Active project agents live in `.claude/agents/`. This `agents/` tree (root) is the
  reusable **library**; these AgentHarness bridges live here as library entries.
