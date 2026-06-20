# Repo Triage — for HoundShield (do not bulk-clone)

> Source: `BrainData.md` header + user message (2026-06-20).
> Rule from the user: **"only the important things, not just dump all the unnecessary thing."**
> Nothing here is cloned yet. Each is scored: **WIRE** (high value, low risk, aligned) ·
> **EVALUATE** (review first) · **SKIP** (off-strategy or risky). Pick before installing.

## WIRE NOW — aligned, low risk, serves Jordan / launch
| Repo | What it gives us | Where it lands |
|------|------------------|----------------|
| `ApodexAI/AgentHarness` | Agent execution harness (already referenced in repo per commit 877abef) | `lib/brain-ai/` agent runtime |
| `Bomx/qwoted-seo-backlinks-skill` | SEO backlink-building skill → directly serves the SEO/backlink ask | `.claude/skills/` |
| `anthropics/skills → frontend-design` | Already available as the `frontend-design` skill in this session | use as-is for UI polish |
| `nextlevelbuilder/ui-ux-pro-max-skill` | UI/UX skill (also present as `ui-ux-pro-max` skill) | use as-is |
| `Leonxlnx/taste-skill` | Design "taste" heuristics for visual QA | `.claude/skills/` |
| `kylezantos/design-motion-principles` | Motion/animation reference for nav + onboarding | reference doc → `docs/design/` |
| `microsoft/markitdown` | Any doc → Markdown. Useful to ingest source material into Brain AI cleanly | build-time util only |

## EVALUATE — promising but review before wiring
| Repo | Why look | Risk |
|------|----------|------|
| `garrytan/gstack` | Next.js SaaS starter; compare auth/billing patterns | we already have Next 15/Supabase/Stripe — only cherry-pick |
| `NousResearch/hermes-agent` | "HERMES" agent framework — naming overlap; check fit for Brain AI orchestration | heavy; don't adopt wholesale |
| `NangoHQ/nango` | OAuth/integration infra if we add 3rd-party connectors | infra weight; only if integrations are on the roadmap |
| `affaan-m/ECC` | Listed 5× in BrainData — clearly important to you, but undocumented here | **need you to say what ECC is for** |
| `1jehuang/jcode`, `tinyhumansai/openhuman`, `iii-hq/iii`, `pbakaus/impeccable` | Unknown purpose from the list alone | confirm intent before time spent |

## REFERENCE ONLY — read, don't install
- `VoltAgent/awesome-ai-agent-papers` — research papers (Brain AI design reading)
- `ComposioHQ/awesome-claude-skills` — skills catalog to mine for more skills
- `tashfeenahmed/freellmapi` + `cheahjs/free-llm-api-resources` — free/cheap LLM fallbacks → **cost control** (pair with the `ccusage` guide you pasted) and Brain AI model fallback chain
- `ritheshh-cmyk/claudecode` — Claude Code config patterns
- `betalist.com` — launch directory (not a repo) → add to launch/distribution checklist

## SKIP — off-strategy or risky for a compliance product
- `elder-plinius/OBLITERATUS` — jailbreak/prompt-injection content. **Do not ship in a CUI-compliance product** — reputationally and technically wrong fit.
- `playcanvas/supersplat` — 3D gaussian-splat editor. No relation to the firewall product.

## Next decision (yours)
Tell me which **WIRE** items to actually clone/integrate and what **ECC** is for.
I'll wire them one at a time with a passing build + tests each — not a bulk dump.
