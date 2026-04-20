# Hound Shield — Task Queue

## Active
<!-- Move items here when starting work -->

## Backlog

### .claude/ Setup (this branch)
- [ ] Verify all agents have `memory: project` and `maxTurns` — run: `grep -r "memory: project" .claude/agents/`
- [ ] Verify settings.json has `autoMemoryEnabled` and `model`
- [ ] Verify pre-commit hook runs tests: `bash .claude/hooks/pre-commit.sh`
- [ ] Build passes: `cd compliance-firewall-agent && npm run build`

### Proxy / Core Product
- [ ] Complete `proxy/install.sh` — single `curl | bash` install, starts Docker container
- [ ] Add test suite for `proxy/scanner.ts` and `proxy/patterns/index.ts`
- [ ] Verify one-command local setup works on fresh Mac + Ubuntu

### Landing Page
- [ ] Remove decorative gradients, glassmorphism, grain overlays
- [ ] Replace with plain, evidence-backed copy (one metric per claim)
- [ ] Keep: hero, problem, solution, pricing, CTA — cut everything decorative

### Brain AI Module
- [ ] Query interface on top of `lib/agent/memory.ts` + `lib/agent/memory-dna.ts`
- [ ] Replace static `brain/research.md` with queryable, self-updating knowledge system

### Launch
- [ ] Set Stripe webhook in dashboard → `STRIPE_WEBHOOK_SECRET` in Vercel
- [ ] Push Supabase migrations 003+004 to production
- [ ] E2E test: signup → onboarding → assessment → PDF download

## Done
- [x] `.claude/settings.json` — added `model`, `autoMemoryEnabled`
- [x] `.claude/agents/code-reviewer.md` — added `memory: project`, `maxTurns: 20`
- [x] `.claude/agents/debugger.md` — added `memory: project`, `maxTurns: 20`
- [x] `.claude/agents/test-writer.md` — added `memory: project`, `maxTurns: 20`
- [x] `.claude/agents/security-auditor.md` — added `memory: project`, `maxTurns: 20`
- [x] `.claude/agents/compliance-specialist.md` — added `memory: project`, `maxTurns: 20`
- [x] `.claude/agents/refactorer.md` — created
- [x] `.claude/agents/doc-writer.md` — created
- [x] `.claude/agents/team-lead.md` — created
- [x] `.claude/skills/*.md` — added `user-invocable: true` to all 4 skills
- [x] `.claude/hooks/pre-commit.sh` — added `npm test -- --silent` gate
