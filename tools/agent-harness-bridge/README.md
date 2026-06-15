# HoundShield ↔ AgentHarness bridge

[AgentHarness](https://github.com/ApodexAI/AgentHarness) (vendored as a git submodule at
`tools/agent-harness`) is an open-source, **OpenAI-compatible** ReAct evaluation harness for
deep-research agents. It's in this repo for two on-mission reasons:

### 1. Prove the "<10ms, zero user impact" claim (gateway benchmark)
HoundShield's product **is** an OpenAI-compatible proxy. AgentHarness points `OPENAI_BASE_URL`
at any OpenAI-compatible endpoint — so it can run an agent model **through the HoundShield
gateway** and measure whether local scanning degrades agent task completion or latency. That
turns a marketing claim into a benchmark you can publish.

- Direct baseline: `OPENAI_BASE_URL` → the model provider.
- Through HoundShield: `OPENAI_BASE_URL` → your HoundShield gateway URL.
- Compare task accuracy + latency. The delta is your evidence.

See `houndshield.env.example` for the wiring.

### 2. Regression-test the demo-critical Brain AI answers (works today)
`brain_smoke_eval.py` is a dependency-free (Python stdlib only) regression check that POSTs
the must-never-break questions ("Who are you?", pricing, DFARS 7012, SPRS) to the local Brain
AI API and asserts the keyless answers are correct. Run it before every demo / deploy.

```bash
# 1. start the app
cd compliance-firewall-agent && npm run dev      # serves http://localhost:3000

# 2. in another shell, run the Brain regression eval
python3 tools/agent-harness-bridge/brain_smoke_eval.py            # default localhost:3000
python3 tools/agent-harness-bridge/brain_smoke_eval.py --base-url https://www.houndshield.com
```
Exit code is non-zero if any demo-critical answer regresses — wire it into CI.

## Running the full AgentHarness benchmarks

The full deep-research benchmarks need a served model (GPU), dataset downloads, and search/sandbox
API keys — see `tools/agent-harness/README.md`. Resolve deps first:

```bash
cd tools/agent-harness
uv sync --python 3.12
cp .env.example .env        # then fill OPENAI_BASE_URL/KEY/MODEL (+ SERPER/JINA/E2B for tools)
```

> The submodule is **pinned to a commit**. After cloning HoundShield, run
> `git submodule update --init` to fetch AgentHarness. `tools/agent-harness/.venv` is created by
> `uv sync` and is not committed.
