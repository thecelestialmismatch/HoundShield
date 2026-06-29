# HoundShield — Level-Up Install & Integration Guide
Run these on **your machine** (this Cowork sandbox has no GitHub network, so I can't install them for you). Each entry has: what it is, whether it's worth it for the $5K-MRR / 10-customers goal, and the exact commands.

---

## 1. last30days-skill — research engine ✅ INSTALL
Multi-source research (Reddit, X, YouTube, HN, Polymarket, GitHub) synthesized into one brief. **Best HoundShield use:** run it before every C3PAO/prospect call, and to track Nightfall/Strac/Purview moves.

**Claude Code:**
```
/plugin marketplace add mvanhorn/last30days-skill
```
**claude.ai (web):** download `last30days.skill` from the repo's latest release → claude.ai → Settings → Capabilities → Skills → `+` → drop it in (enable "Code execution & file creation" first).

**Use it like:**
```
/last30days CMMC Level 2 AI compliance
/last30days <C3PAO firm name> --give me a shareable HTML brief
/last30days Nightfall AI vs Strac --competitors
```

## 2. headroom — context compression ✅ INSTALL (if you run big Claude Code sessions)
Compresses tool outputs/logs/RAG before they hit the model — 60–95% fewer tokens, local & reversible. **Why:** the Direction-A port + dynamic workflows burn a lot of tokens; this cuts the bill.
```
pip install "headroom-ai[all]"        # Python 3.10+
headroom wrap claude                  # wrap Claude Code with compression + shared memory
headroom stats                        # see savings
```
Bonus: `headroom learn` mines failed sessions and writes corrections into your `CLAUDE.md`.

## 3. andrej-karpathy-skills — Claude Code discipline ✅ INSTALL (merge into CLAUDE.md)
A `CLAUDE.md` of 4 principles (Think Before Coding · Simplicity First · Surgical Changes · Goal-Driven Execution) that directly improve port quality. **Note:** canonical repo is `forrestchang/andrej-karpathy-skills`.

**Plugin:**
```
/plugin marketplace add forrestchang/andrej-karpathy-skills
/plugin install andrej-karpathy-skills@karpathy-skills
```
**Or append to your project CLAUDE.md:**
```bash
echo "" >> compliance-firewall-agent/CLAUDE.md
curl https://raw.githubusercontent.com/forrestchang/andrej-karpathy-skills/main/CLAUDE.md >> compliance-firewall-agent/CLAUDE.md
```

## 4. OpenHuman (Brain AI) — ⚠️ DEFER until after revenue
A separate local-first agent system (Docker, vector DB, 16–32GB RAM). **You already have a Brain AI in-repo (`lib/brain`)** — bolting on a competing 50GB system before you have paying customers is the wrong order (your own rule #6: revenue before features). If you still want to evaluate it later:
```bash
git clone https://github.com/tinyhumansai/openhuman.git && cd openhuman
cp .env.example .env     # add LLM_PROVIDER_KEY (your OpenRouter/Anthropic key)
docker-compose up --build   # → http://localhost:3000
```
**Better near-term move:** fix the Brain you have (add identity/product/pricing facts + set `OPENROUTER_API_KEY`) — that's already in the port prompt.

## 5. Dynamic workflows / `ultracode` — use this to RUN the port
Your pasted blog: Claude Code can fan out tens–hundreds of parallel subagents for big migrations. The Direction-A port is exactly that shape. **How to use it:**
- Turn on **auto mode**, set effort to **`xhigh`** (or enable `ultracode` in `/config`), then:
```
Read HERMES-REDESIGN/CLAUDE-CODE-PORT-PROMPT.md and create a dynamic workflow to execute it end-to-end.
```
- Per Anthropic's Opus 4.8 guidance: dynamic workflows use **substantially more tokens** — start scoped (do Tier 1 first), keep a large max-output budget, and let it run. Pair with **headroom** (#2) to offset the cost.

## 6. The "Fable Five" prompts — map them to HoundShield, don't collect them
These are income prompts; two map cleanly onto your existing plan:
- **The 30-Minute AI Audit ($500)** → this *is* your **$499 CMMC AI Gap Report** (already a SKU). Use the audit prompt's structure for the deliverable.
- **The Agent Team Architect ($10K)** → your HERMES swarm story; useful for the future autonomous-AI product page (the "polsia-allied" angle), post-revenue.
Ignore the rest for now — your one job is 10 CMMC customers, not a portfolio of side hustles.

---

### Priority order
1. Run the **Direction-A port** (`CLAUDE-CODE-PORT-PROMPT.md`) with `ultracode` + `headroom`.
2. Ship the **AEO kit** (`AEO/` folder) as part of Tier 3.
3. Install **last30days** and use it before your first 10 C3PAO/prospect calls.
4. Everything else (OpenHuman, polsia angle, extra Fable prompts) waits until you have paying customers.
