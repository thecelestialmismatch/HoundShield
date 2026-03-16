# KAELUS-DEV SKILL v2 — UPGRADE FILE
*This is the upgraded kaelus-dev skill content. The installed skill is read-only.*
*To apply this upgrade: ask the skill-creator to update kaelus-dev with this content.*
*Or: load this file manually at session start alongside the kaelus-dev skill.*

---

## HOW TO USE THIS FILE
At session start, read this file AFTER loading the kaelus-dev skill.
It overrides/extends the installed skill with 2026 market data and updated state.

---

## WHAT'S NEW IN V2 (vs installed skill)

1. **CONTINUE.md protocol** — say "continue" → read CONTINUE.md → 8-line report → start working
2. **Updated nav** — 3 sections only (Firewall | CMMC Shield | Response). AI Agents + Mission Control removed.
3. **Design system confirmed** — dashboard = dark `bg-[#07070b]` | marketing = light `bg-surface` | brand = BLUE (not indigo)
4. **10 gaps status** — Gap 5 done; Gap 1 is next
5. **2026 market data** — 80K+ contractors, 0.5% certified, Nov 2026 enforcement, $30K–$76K assessment cost
6. **Pricing locked** — $199/$499/$999/$2,499 (not old $69/$249/$599)
7. **Dead routes** — 7 routes replaced with redirects (pixeloffice/calendar/memory/workspace/agents/knowledge/pipeline)
8. **Token efficiency** — compact session start: read 2 files → report 8 lines → work

---

## THE FULL V2 SKILL CONTENT

(For reference — paste into skill-creator when upgrading the installed skill)

```markdown
SESSION START: Read compliance-firewall-agent/CONTINUE.md + .claude-session-state.md
Report in 8 lines: Branch | Last done | Next task | Blockers | Starting
Start working immediately.

PRODUCT: Kaelus.ai — AI compliance firewall for CMMC Level 2 defense contractors
STACK: Next.js 15, React 19, Supabase, Stripe, OpenRouter, Tailwind, Framer Motion
ROOT: compliance-firewall-agent/
BRANCH: feat/branding-shieldready-polish

DESIGN SYSTEM:
  Dashboard = DARK (bg-[#07070b] / sidebar bg-[#0d0d14]) — text-white/slate-400
  Marketing = LIGHT (bg-surface #F8FAFC) — text-slate-800/700
  Brand = BLUE: brand-500 = #3B82F6, brand-600 = #2563EB (NEVER indigo/blue-* hardcoded)

NAV (3 sections):
  Firewall: Overview|Real-Time|Threat Timeline|Live Scanner|Audit Log|Quarantine
  CMMC Shield: SPRS Dashboard|Assessment|Gap Analysis|Reports|Resources
  Response: Compliance AI|Remediation Tasks|Team

GAPS STATUS:
  ✅ Gap 5 (nav cleanup) | ⬜ Gap 1 (demo banner) NEXT | ⬜ Gaps 2–10 pending
  Full specs: CLAUDE-CODE-MISSION.md | Checklist: tasks/SPRINT-1.md

MARKET (do not re-research):
  80K–300K US contractors need CMMC L2 | 0.5% certified | Nov 2026 enforcement
  C3PAO assessment = $30K–$76K | Pricing: $199/$499/$999/$2,499
  Top investors: In-Q-Tel, Shield Capital, Paladin Capital, Booz Allen Ventures

RULES:
  - Tailwind only, brand-* tokens, never blue-*/indigo-*
  - npm run build must pass before declaring done
  - NEVER deploy without explicit user "deploy" confirmation
  - git identity: thecelestialmismatch@gmail.com
  - WebSocket = Docker only. Vercel = SSE only.

SESSION END:
  Update CONTINUE.md + .claude-session-state.md + tasks/lessons.md
  git add + commit + push
  Tell user: ✅ SESSION SAVED | Done: X | Next: Y | Say "continue" to resume
```
