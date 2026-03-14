@~/.claude/primer.md
@.claude-memory.md

## PROJECT CONTEXT
Client: Kaelus.ai
Stack:  Next.js 15, React 19, Supabase, Stripe, Tailwind CSS, Framer Motion, PostHog, WebSocket, OpenRouter

## ARCHITECTURE
- `app/` — Next.js App Router (15 routes + 11 API endpoints)
- `components/` — 35+ components (landing, dashboard, UI)
- `lib/` — Core logic (gateway, agent, audit, classifier, interceptor, quarantine, supabase)
- `sdk/` — Client SDK for gateway consumers
- `server.ts` — WebSocket gateway server

## RULES
- Always use Tailwind CSS — never inline styles
- Dark theme is primary: bg-[#07070b], brand-400/500/600 (indigo), emerald accent
- Typography: Inter (body), Outfit (display)
- Auth: Supabase Auth with GitHub + Microsoft OAuth (NO Google)
- Every new feature must include error boundary handling
- Keep components under 500 lines — split if larger
- Run `npm run build` before claiming anything works
