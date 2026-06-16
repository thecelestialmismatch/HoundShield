# Contributing to HoundShield

Thanks for helping build the local-only AI compliance firewall. HoundShield protects Controlled Unclassified Information for defense contractors — correctness and the compliance engine come before everything else.

## Ground rules

1. **The build must pass.** From `compliance-firewall-agent/`: `npm run build`.
2. **Tests stay green.** `npm test` — 400+ tests. Add tests for new behavior; never delete a test to make CI pass.
3. **Never weaken the compliance engine.** CI's *Compliance Pattern Guard* fails any change that drops below **16 CUI patterns** in `proxy/patterns/index.ts`. You may **extend** patterns — never replace or remove them.
4. **The local-only data boundary is sacred.** Prompt content must never leave the customer network in Mode B/C. No telemetry of scanned content. No exceptions.

## Workflow

1. Fork the repo and branch off `main` (e.g. `feat/...`, `fix/...`).
2. Make your change. Keep it focused — a bug fix is not an invitation to refactor.
3. Run locally before pushing:
   ```bash
   cd compliance-firewall-agent
   npm install
   npx tsc --noEmit      # types
   npm run lint          # lint
   npm test              # tests
   npm run build         # build
   ```
4. Open a PR against `main` and fill out the PR template, including **Jordan's Test Plan** (the CMMC-buyer checklist). PRs that skip it will not be merged.

## Commit style

Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`, `ci:`.

## Where things live

| Area | Path |
| :--- | :--- |
| Web app, dashboard, API, Brain AI | `compliance-firewall-agent/` |
| Detection proxy (the product) | `proxy/` |
| Detection patterns (extend only) | `proxy/patterns/` |
| Database migrations | `supabase/migrations/` |
| Docs, PRD, roadmap | `docs/` |

## Security

Found a vulnerability? **Do not open a public issue.** Follow the private disclosure process in [SECURITY.md](SECURITY.md).

## Ideas

Browse [issues labeled `good first issue`](../../issues?q=label%3A%22good+first+issue%22) for a place to start.
