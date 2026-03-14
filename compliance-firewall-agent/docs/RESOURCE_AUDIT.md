# 📋 Kaelus.ai — Resource Audit & Integration Report

> **Generated**: 2026-03-14 | **Total Resources Reviewed**: 70+ links  
> **Skills Already Installed**: 800+ (via Antigravity Awesome Skills)

---

## 🔑 Executive Summary

You provided 70+ resources (GitHub repos, docs, tools, prompts). After auditing:

| Category | Count | Notes |
|----------|-------|-------|
| **Already installed as skills** | ~30 repos | Already in `~/.gemini/antigravity/skills/` |
| **Useful for project dev** | ~15 repos | Reference material, APIs, templates |
| **Reference/learning only** | ~20 repos | Tutorials, courses, prompt leaks |
| **SaaS tools (external)** | ~10 links | External platforms, not code |
| **Prompt templates saved** | 5 templates | Saved to `docs/prompts/` |
| **Security checklist saved** | 1 checklist | Saved to `docs/security/` |

---

## 🟢 ALREADY INSTALLED AS SKILLS (Agent Uses These)

These repos are **already installed** in `~/.gemini/antigravity/skills/` — I use them automatically when relevant tasks come up.

| Resource | Skill Name | What I Use It For |
|----------|-----------|-------------------|
| [anthropics/skills](https://github.com/anthropics/skills) | Multiple (official) | Core skill foundation — code review, debugging, deployment |
| [vercel-labs/skills](https://github.com/vercel-labs/skills) | `nextjs-*`, `react-*` | Next.js patterns, React best practices, Vercel deployment |
| [sickn33/antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills) | ALL 800+ skills | The master collection — this is what powers my entire skill set |
| [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | `ui-ux-pro-max` | Premium UI/UX design with 50 styles, 21 palettes, 50 font pairings |
| [obra/superpowers](https://github.com/obra/superpowers) | `using-superpowers` | Enhanced agent capabilities and skill discovery |
| [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) | `conversation-memory` | Persistent memory across sessions |
| [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) | `obsidian-clipper-*` | Obsidian integration and knowledge management |
| [gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done) | `concise-planning` | Task breakdown, execution, verification workflows |
| [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) | `cc-skill-*` | Coding standards, frontend/backend patterns, security review |
| [davila7/claude-code-templates](https://github.com/davila7/claude-code-templates) | Various templates | Project scaffolding and boilerplate generation |
| [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | Integration skills | Composio-based SaaS automations (Slack, GitHub, etc.) |
| [czlonkowski/n8n-mcp](https://github.com/czlonkowski/n8n-mcp) | `n8n-mcp-tools-expert` | n8n workflow automation via MCP |
| [pablodelucca/pixel-agents](https://github.com/pablodelucca/pixel-agents) | Integrated in project | Already used in `components/dashboard/pixel-office/` |
| [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) | `dispatching-parallel-agents` | Multi-agent orchestration |
| [huangserva/skill-prompt-generator](https://github.com/huangserva/skill-prompt-generator) | `prompt-engineer` | Prompt optimization and framework application |
| [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) | *Was in repo, removed* | Generic agent templates — not project-specific, removed per cleanup |

---

## 🔵 USEFUL FOR PROJECT DEVELOPMENT (Reference Material)

These are NOT installed as skills but contain useful patterns, APIs, or tools for Kaelus.ai.

### GitHub Repos

| Resource | What's In It | How We'll Use It |
|----------|-------------|-----------------|
| [public-apis/public-apis](https://github.com/public-apis/public-apis) | 1,400+ free APIs indexed by category | Reference when building integrations — security APIs, ML APIs, compliance APIs |
| [Atarity/deploy-your-own-saas](https://github.com/Atarity/deploy-your-own-saas) | Self-hosted alternatives for 30+ SaaS tools | Reference for Phase 4 enterprise features — self-hosted analytics, email, storage |
| [remotion-dev/remotion](https://github.com/remotion-dev/remotion) | Programmatic video creation in React | Future: auto-generate compliance report videos, marketing content |
| [NirDiamant/RAG_Techniques](https://github.com/NirDiamant/RAG_Techniques) | Advanced RAG patterns and implementations | For Kaelus AI agent knowledge base — improving compliance doc retrieval |
| [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | Production LLM app patterns | Architecture reference for Kaelus AI features |
| [HKUDS/ClawWork](https://github.com/HKUDS/ClawWork) | AI agent framework | Multi-agent orchestration patterns for compliance agents |
| [microsoft/agent-lightning](https://github.com/microsoft/agent-lightning) | Microsoft's agent framework | Enterprise agent patterns for compliance automation |
| [VoltAgent/voltagent](https://github.com/VoltAgent/voltagent) | Agent orchestration toolkit | Patterns for coordinating multiple compliance agents |
| [automazeio/ccpm](https://github.com/automazeio/ccpm) | Claude Code Project Manager | Workflow automation for development |
| [BloopAI/vibe-kanban](https://github.com/BloopAI/vibe-kanban) | AI-powered Kanban board | UI inspiration for project management features |
| [ruvnet/ruflo](https://github.com/ruvnet/ruflo) | AI workflow automation | Background job patterns |
| [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) | Curated MCP server list | Finding new integrations for Kaelus (Supabase, Stripe MCPs) |
| [anomalyco/opencode](https://github.com/anomalyco/opencode) | Open source coding assistant | Architecture patterns |
| [siteboon/claudecodeui](https://github.com/siteboon/claudecodeui) | Claude Code UI wrapper | UI patterns |

### Learning & Reference (Not Directly Integrated)

| Resource | Category | Value |
|----------|----------|-------|
| [microsoft/generative-ai-for-beginners](https://github.com/microsoft/generative-ai-for-beginners) | Course | GenAI fundamentals — not needed for project directly |
| [microsoft/ai-agents-for-beginners](https://github.com/microsoft/ai-agents-for-beginners) | Course | Agent architecture basics |
| [panaversity/learn-agentic-ai](https://github.com/panaversity/learn-agentic-ai) | Course | Agentic AI patterns |
| [rasbt/LLMs-from-scratch](https://github.com/rasbt/LLMs-from-scratch) | Course | LLM internals — too low-level for project needs |
| [Avik-Jain/100-Days-Of-ML-Code](https://github.com/Avik-Jain/100-Days-Of-ML-Code) | Course | ML fundamentals — reference only |
| [owainlewis/awesome-artificial-intelligence](https://github.com/owainlewis/awesome-artificial-intelligence) | Curated list | AI resources directory |
| [patchy631/ai-engineering-hub](https://github.com/patchy631/ai-engineering-hub) | Tutorials | AI engineering patterns |
| [shareAI-lab/learn-claude-code](https://github.com/shareAI-lab/learn-claude-code) | Guide | Claude Code tips |
| [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) | Curated list | Skills, hooks, slash-commands index |
| [x1xhlol/system-prompts-and-models-of-ai-tools](https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools) | Reference | System prompt engineering patterns |
| [asgeirtj/system_prompts_leaks](https://github.com/asgeirtj/system_prompts_leaks) | Reference | Prompt engineering insights |
| [sushildubey76/awesome-lim-apps](https://github.com/sushildubey76/awesome-lim-apps) | Curated list | LLM application examples |
| [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) | Skills | Additional Claude skill patterns |
| [SAGAR-TAMANG/groww-python-mcp](https://github.com/SAGAR-TAMANG/groww-python-mcp) | MCP | Financial data MCP — niche, not compliance-related |
| [raxx21/rajesh-portfolio](https://github.com/raxx21/rajesh-portfolio) | Portfolio | Portfolio template — UI inspiration only |

---

## 🟡 EXTERNAL TOOLS & PLATFORMS

These are web tools/SaaS platforms — not code repos. They're bookmarked as reference.

| Tool | URL | Use Case | Relevance to Kaelus |
|------|-----|----------|---------------------|
| **SketricGen** | [sketricgen.ai](https://www.sketricgen.ai/) | React component generation from AI | Could speed up UI component creation |
| **Readdy** | [readdy.ai](https://readdy.ai/) | AI-powered app builder | Alternative approach reference |
| **Flatlogic** | [flatlogic.com](https://flatlogic.com/) | SaaS templates and generators | Enterprise dashboard template ideas |
| **Unicorn Studio** | [unicorn.studio](https://www.unicorn.studio/) | Visual effects for web | Animation inspiration for landing page |
| **Kilo.ai** | [kilo.ai](https://kilo.ai/) | AI tool suite | General AI tooling reference |
| **Bytez** | [bytez.com](https://bytez.com/) | ML model deployment | Model serving reference |
| **TestYourIdea** | [testyouridea.app](https://testyouridea.app/) | Startup idea validation | Business validation tool |
| **Startups.rip** | [startups.rip](https://startups.rip/) | Startup marketplace | Business/market research |
| **OpenAlternative** | [openalternative.co](https://openalternative.co/alternatives) | Open-source alternatives | Self-hosted tool discovery |
| **TrustMRR** | [trustmrr.com](https://trustmrr.com/) | Revenue analytics | MRR tracking reference |
| **Acquire** | [acquire.com](https://app.acquire.com/) | Startup marketplace | Business exit reference |
| **NimRobo** | [nimroboai.com](https://app.nimroboai.com/) | AI workspace | Agent workspace patterns |
| **Groq** | [groq.com](https://groq.com/) | Fast LLM inference | Alternative LLM provider |
| **NVIDIA Build** | [build.nvidia.com](https://build.nvidia.com/) | GPU model APIs | GPU-accelerated inference |
| **OpenRouter** | [openrouter.ai](https://openrouter.ai/) | Multi-model API router | LLM routing for agents |
| **CTO.new** | [cto.new](https://cto.new/) | AI CTO assistant | Architecture planning |
| **Supabase** | [supabase.com](https://supabase.com/dashboard/) | Database + Auth | **Core dependency — already integrated** |

---

## 📄 KNOWLEDGE DOCS & NOTION PAGES

| Document | What It Contains | Saved? |
|----------|-----------------|--------|
| [Architecture Stress Test Prompt Pack](https://shaded-season-2f0.notion.site/Architecture-Stress-Test-Prompt-Pack-30c3ad7d46738020848fd2394ff4cd7c) | Architecture validation prompts | ✅ Saved to `docs/prompts/architecture-stress-test.md` |
| [Claude Code × Antigravity Guide](https://operatoros.notion.site/Claude-Code-xAntigravity-2e607c94a4a7801aa5d0f4ca4cea1f80) | Antigravity setup guide | Reference — we're already using Antigravity |
| [The Ultimate AI Stack](https://www.notion.so/The-Ultimate-AI-Stack-Gemini-3-1-Claude-4-6-30d543f52886806397bffcf1c1ec6353) | AI stack recommendations | Reference |
| [The 10K Dashboard Blueprint](https://striped-thief-c4a.notion.site/The-10K-Dashboard-Blueprint-30173bd1b02b80dcbbacf3bb122be407) | SaaS dashboard monetization | Business strategy reference |
| [NoeAI Free Resource Library](https://www.notion.so/NoeAI-Free-Resource-Library-3151bae02eff800c9c9bd43265bcecae) | AI resource collection | Learning reference |
| [0 to $750K MRR Playbook](https://asyncr0ne.notion.site/Playbook-0-to-750K-MRR-Loic-Minea-Dropmagic-3172c883cd74802a846ef499d09c7826) | Revenue growth playbook | Business strategy |
| [How to Build App with Claude Code](https://osoperator.notion.site/How-to-Build-App-with-Claude-Code-31ad72dca3b280a2a488e8d18381cdfd) | Claude Code app-building guide | Reference — already using |
| [Vibe Coding Security Checklist](https://gist.github.com/mdsaban/29ffbb6974ce2fa9acc37415b9a4b684) | 7-step security audit checklist | ✅ Saved to `docs/security/vibe-security-checklist.md` |
| [Aflekkas Claude Code Guide](https://www.aflekkas.com/guides/max-out-claude-code) | Claude Code optimization tips | Reference |
| [Aflekkas Landing Pages Guide](https://www.aflekkas.com/guides/landing-pages-claude-code) | Landing page building guide | Reference for Phase 2 |
| [YC AI Student Starter Pack](https://anayjoshi.substack.com/p/the-yc-ai-student-starter-pack-how) | YC startup resources | Business reference |
| [Anthropic Skills Guide PDF](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf) | Official skill creation guide | Reference for creating custom skills |
| Google Docs (multiple) | Various guides and templates | Link-only reference — require Google Auth |
| Google Drive files (multiple) | Various resources | Link-only reference — require Google Auth |

---

## ✅ FILES SAVED TO PROJECT

### Prompt Templates → `docs/prompts/`
1. `systems-architect.md` — Full architecture blueprint prompt
2. `visual-system-architect.md` — Design system generation prompt
3. `conversion-copy-architect.md` — Website copy generation prompt
4. `interaction-systems-engineer.md` — Interactive module design prompt
5. `figma-make-translator.md` — Spec-to-Figma prompt translator
6. `architecture-stress-test.md` — Architecture validation prompts

### Security → `docs/security/`
7. `vibe-security-checklist.md` — 7-step security audit checklist

### Tech Stack Reference → `docs/`
8. `recommended-tech-stack.md` — Best stack for vibe-coding

---

## 🔴 WHAT WAS MISSING (Gaps Identified)

| Gap | Description | How to Fill |
|-----|-------------|-------------|
| **Stripe integration** | Pricing page exists but CTAs aren't wired to Stripe | Phase 2 — use `stripe-integration` skill |
| **Remotion video** | No video generation capability yet | Could add for marketing/report videos |
| **RAG for compliance** | Agent uses demo data, not real docs | Use RAG patterns from NirDiamant repo |
| **Google Workspace CLI** | Not integrated | Could automate Google Docs/Sheets workflows |
| **Financial MCP** | Groww Python MCP provided but not relevant | Skip — Kaelus is compliance, not finance |
| **n8n workflows** | MCP installed but no workflows defined yet | Phase 3+ — automate compliance workflows |
| **Custom Claude skills** | Could create Kaelus-specific skills | Create `kaelus-compliance-expert` skill |

---

## 📊 Summary by Owner

### What YOU (Human) Should Review
- The Notion docs (require login, I can't access them all)
- The Google Docs/Drive files (require Google Auth)
- Business strategy resources (10K Dashboard, 0-750K MRR playbook)
- SaaS marketplace links (Acquire, TestYourIdea, Startups.rip)

### What I (Agent) Already Use
- 800+ installed Antigravity skills (from sickn33/antigravity-awesome-skills)
- All Anthropic + Vercel official skills
- UI/UX, security, testing, deployment, database skills
- MCP servers (Supabase, Cloud Run, Stitch)

### What Was Copied to Project
- 5 architect prompt templates
- 1 security checklist
- 1 tech stack reference
- This audit report

### What Was NOT Copied (And Why)
- Full GitHub repos → Too large, already available as skills or reference only
- External SaaS tools → They're web services, nothing to copy
- Google Docs/Drive → Require authentication you'd need to export manually
- Course repos → Learning material, not production code
