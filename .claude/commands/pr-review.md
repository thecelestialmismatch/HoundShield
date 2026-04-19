---
name: pr-review
argument-hint: [pr-number]
---

Full review of PR #$ARGUMENTS:

1. `gh pr view $ARGUMENTS` — read title, description, files changed
2. `gh pr diff $ARGUMENTS` — get full diff

Launch 4 agents in parallel:
- **code-reviewer** — code quality, TypeScript strict, design system compliance
- **security-auditor** — auth coverage, secrets, RLS, Stripe webhook integrity
- **compliance-specialist** — if lib/classifier/ or SPRS scoring touched, verify no regressions
- **test-writer** — check test coverage, identify untested paths

Synthesize findings:
- CRITICAL: list + block merge
- HIGH: list + require fix before merge
- MEDIUM/LOW: list as suggestions
- Final verdict: APPROVE / REQUEST CHANGES / BLOCK
