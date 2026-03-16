@.claude-memory.md
@.claude-session-state.md

# ⚡ SESSION START — READ THIS FIRST
Before doing ANYTHING else, read .claude-memory.md and .claude-session-state.md (already loaded above via @-includes).
Then tell the user:
  📍 KAELUS.AI — SESSION RESUME
  Phase: [from state file]
  ✅ Last done: [from state file]
  🎯 NEXT TASK: [exact next action]
  ⛔ Blockers: [from state file]

Do NOT re-scan the project. Do NOT re-explain the architecture. Just read the state and go.
At session END: update .claude-session-state.md + .claude-memory.md + git commit + git push.

# ⚡ SESSION END — DO THIS BEFORE STOPPING
1. Update .claude-session-state.md: move done→completed, set new NEXT TASK, add session entry
2. Update .claude-memory.md: add any new architectural decisions or discovered issues
3. Run: git add .claude-memory.md .claude-session-state.md [changed files] && git commit -m "chore: session sync — [summary]" && git push origin [branch]
4. Tell user: ✅ SESSION SAVED + what was committed + next session starts at [task]

---

## PROJECT CONTEXT
Product: Kaelus.ai — AI compliance firewall for CMMC Level 2 defense contractors
Stack: Next.js 15, React 19, Supabase, Stripe, Tailwind CSS, Framer Motion, PostHog, WebSocket, OpenRouter
Pricing: Free | Pro $69/mo | Enterprise $249/mo | Agency $599/mo
Active branch: feat/branding-shieldready-polish

## ARCHITECTURE
- `app/` — Next.js App Router (15 routes + 11 API endpoints)
- `components/` — 35+ components (landing, dashboard, UI)
- `lib/` — Core logic (gateway, agent, audit, classifier, interceptor, quarantine, supabase)
- `sdk/` — Client SDK for gateway consumers
- `server.ts` — WebSocket gateway server

## RULES (non-negotiable)
- Always use Tailwind CSS — never inline styles
- Dark theme is primary: bg-[#07070b], brand-400/500/600 (indigo), emerald accent
- Typography: Inter (body), Outfit (display)
- Auth: Supabase Auth with Google + GitHub + Microsoft OAuth
- Logo: Always use `<Logo />` and `<TextLogo />` — never inline Shield/Zap icons
- Colors: Use `brand-*` tokens (NOT `blue-*`) for all accent colors
- Every new feature must include error boundary + loading state
- Keep components under 500 lines — split if larger
- Run `npm run build` before claiming anything works
- RLS on every new Supabase table
- TypeScript strict — no `any` unless unavoidable
