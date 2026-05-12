# houndshield — Task Tracker + Manager Protocol
# Location: tasks/todo.md
# READ THIS AT THE START OF EVERY SESSION

---

## MANAGER PROTOCOL

The team-lead agent is your project manager. It enforces the PRD and roadmap.

If you find yourself building something not in this file:
1. STOP
2. Ask: "Is this in the PRD and roadmap?"
3. If no: add it to "PROPOSED DEVIATIONS" below
4. Get approval before writing a single line of code

The manager will ask: **"Is this the right move right now?"**
This is not bureaucracy. This is survival. Solo founders die from building the wrong things.

---

## CURRENT STATUS

**Phase:** Month 1 — Foundation
**Current Week:** Week 1
**Revenue:** $0
**Next Revenue Milestone:** $299 (first customer)

---

## THIS WEEK'S TASKS (Month 1, Week 1)

Priority is strict top-to-bottom. Do not start task N+1 until task N is complete and tested.

- [ ] 1. Rename all Kaelus → houndshield references in codebase (automated + manual audit)
- [ ] 2. Archive Supabase DDL schema (export before removing)
- [ ] 3. Create /db/schema.sql (PostgreSQL 16, replaces Supabase schema)
- [ ] 4. Set up self-hosted PostgreSQL 16 in Docker Compose
- [ ] 5. Create /db/migrations/ directory with migration 001 (initial schema)
- [ ] 6. Remove Supabase client dependency from lib/
- [ ] 7. Add PostgreSQL client (pg + connection pool)
- [ ] 8. Set up Keycloak Docker container with houndshield realm
- [ ] 9. Wire Next.js session management to Keycloak OIDC
- [ ] 10. Create docker-compose.yml with all 5 services (proxy, presidio, dashboard, db, keycloak)
- [ ] 11. Verify all services start and communicate
- [ ] 12. Enable FIPS 140-2 OpenSSL module in all containers
- [ ] 13. Set up .claude/ directory with all agent files
- [ ] 14. Set up Brain AI: create /brain/ directory and seed all domain JSON files
- [ ] 15. Run first end-to-end test: proxy intercepts test prompt with SSN
- [ ] 16. Commit everything to GitHub with clean commit messages

---

## NEXT WEEK'S TASKS (Month 1, Week 2)

Do not start until this week is complete.

- [ ] HTTP(S) forward proxy (TypeScript strict, no any)
- [ ] OpenAI API format support
- [ ] Anthropic API format support
- [ ] Azure OpenAI format support
- [ ] Microsoft Presidio sidecar (Docker container)
- [ ] CUI entity types (CAGE codes, DoD contract numbers, export control markings)
- [ ] Policy engine (block/redact/flag per entity type)
- [ ] Tamper-evident audit logging (SHA-256 hash chain)
- [ ] Unit tests for all of the above (80%+ coverage)
- [ ] Latency benchmark: verify <10ms P99

---

## COMPLETED THIS SESSION

_(Move items here when done)_

---

## COMPLETED — PREVIOUS SESSIONS

_(Archive of completed tasks)_

---

## PROPOSED DEVIATIONS

_(Anything you want to build that's not in the current week's tasks. Record it here. Get approval before building.)_

| Idea | Rationale | PRD Priority | Approved? |
|---|---|---|---|
| _(example)_ Browser extension | User mentioned wanting this | P1 (Month 4) | NO — wait for P0 to ship |

---

## BLOCKERS

| Blocker | Impact | Who Resolves | ETA |
|---|---|---|---|
| Supabase migration | Blocks first customer | Founder | Week 1 |
| RPO outreach | Blocks Month 3 revenue | Founder | Month 1 Week 4 |
| SOC 2 auditor selection | Blocks Month 9 certification | Founder | Month 7 |

---

## LESSONS LEARNED

_(Read these at the start of every session. Add to tasks/lessons.md when you learn something.)_

| Date | Lesson | Rule |
|---|---|---|
| 2026-04-27 | Supabase is not FedRAMP/FIPS compliant — discovered after significant build | Never use SaaS infrastructure for CUI without verifying FedRAMP/FIPS first |
| _(add new lessons here)_ | | |

---

## MANAGER CHECK HISTORY

_(Log of when deviations were caught and what decision was made)_

| Date | Proposed Deviation | Decision | Reason |
|---|---|---|---|
| _(first deviation will go here)_ | | | |
