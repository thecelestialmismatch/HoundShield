# houndshield Custom Slash Commands
# Location: .claude/commands/
# Usage in Claude Code: /fix-issue 42, /deploy, /pr-review, /cmmc-audit, /competitive-intel

---

## /fix-issue [github-issue-number]

```
You are fixing GitHub issue #$ARGUMENTS for the houndshield project.

Steps:
1. Read the issue: use Bash("gh issue view $ARGUMENTS") to get the full issue text
2. Identify the affected files using the CLAUDE.md directory map
3. Read the affected files completely before touching anything
4. Fix the issue permanently — no workarounds
5. Write tests that verify the fix (test-writer agent standards)
6. Update documentation if the fix changes behavior
7. Run pre-commit checks: npm run test && npx tsc --noEmit
8. Commit: git add . && git commit -m "fix: [issue description] — closes #$ARGUMENTS"
9. Open PR: gh pr create --title "fix: [description]" --body "Closes #$ARGUMENTS\n\n[description of fix]"
10. Report: what was broken, what you changed, what tests verify it

Do not close this command until the PR is open and all checks pass.
```

---

## /deploy

```
You are deploying houndshield to production.

Pre-flight checklist (stop and report if any fail):
1. npm run test -- --run (all tests pass)
2. npx tsc --noEmit (no type errors)
3. npm run lint (no lint errors)
4. npm run build (production build succeeds)
5. Check .env.local has all required vars (without reading the values)
6. Verify DATABASE_URL points to production PostgreSQL (not local dev)
7. Verify KEYCLOAK_URL points to production Keycloak

Deploy steps:
1. git push origin main (triggers GitHub Actions)
2. Monitor GitHub Actions: gh run watch (wait for completion)
3. If Vercel (SaaS dashboard): vercel --prod (or check Vercel auto-deploy from main)
4. If Docker (on-prem demo): docker-compose -f docker-compose.yml up -d --build
5. Health check: curl -f https://[domain]/api/health || echo "FAILED"
6. Verify proxy: curl -f https://[domain]/api/gateway/health || echo "FAILED"

Post-deploy:
7. Update brain/domains/codebase.json with deployment record and timestamp
8. Commit brain update: git add brain/ && git commit -m "brain: deployment record [date]"

Report: What was deployed, to where, health check results.
```

---

## /pr-review

```
You are reviewing all open pull requests for houndshield.

Steps:
1. List open PRs: gh pr list
2. For each open PR:
   a. Read the PR: gh pr view [number]
   b. Review the diff: gh pr diff [number]
   c. Apply code-reviewer agent checklist (see .claude/agents/all-agents.md)
   d. Apply compliance-auditor agent checklist for compliance-affecting changes
   e. Apply security-auditor agent checklist for security-affecting changes
3. For each PR, output:
   - PR #[number]: [title]
   - Status: APPROVE | REQUEST CHANGES | BLOCK
   - Issues found: [list]
   - Comment to post: [exact text]
4. Post the comment: gh pr review [number] --comment -b "[comment text]"

Stop only when all open PRs have been reviewed and commented.
```

---

## /cmmc-audit

```
You are running a full CMMC Level 2 practice coverage audit against the current houndshield codebase.

Steps:
1. Load compliance data: read brain/domains/compliance.json
2. For each of the 10 practices houndshield claims to cover:
   a. Read the relevant source code
   b. Verify the implementation satisfies the practice
   c. Verify the implementation generates verifiable evidence
   d. Rate: FULLY COVERED | PARTIALLY COVERED | NOT COVERED | CLAIMED BUT NOT IMPLEMENTED
3. For partially or not covered practices, specify exactly what code change closes the gap
4. Generate the audit report:

   CMMC LEVEL 2 AUDIT — houndshield
   Date: [today]
   
   | Practice | Title | Status | Evidence Generated | Gap |
   |---|---|---|---|---|
   | AC.1.001 | [title] | [status] | [evidence] | [gap or none] |
   [complete table for all 10 claimed practices]
   
   OVERALL: [X/10 fully covered]
   
   REMEDIATION PLAN:
   [ordered list of changes needed to cover gaps, with estimated effort]

5. Write the report to docs/cmmc-audit-[date].md
6. Update brain/domains/compliance.json with audit results
7. If any FULLY COVERED practice is actually NOT IMPLEMENTED: flag as CRITICAL and stop

Do not mark this command complete until the report file is written and committed.
```

---

## /competitive-intel

```
You are updating houndshield's competitive intelligence.

Steps:
1. Load current competitor data: read brain/domains/competitors.json
2. Search the web for recent news on each competitor:
   - "Noma Security" — funding, product updates, customer wins
   - "HiddenLayer" — funding, product updates
   - "AWS Bedrock Guardrails" — new features, pricing changes
   - "Microsoft Purview AI" — new features
   - "CMMC compliance AI" — new entrants in the last 90 days
3. For each update found:
   - Is this a new product feature that competes with houndshield?
   - Is this a funding event that changes the threat level?
   - Is this an acquisition that removes a competitor or adds one?
4. Update brain/domains/competitors.json with:
   - New findings (with date)
   - Changed threat levels
   - New competitors identified
5. Generate update summary:

   COMPETITIVE INTEL UPDATE — [date]
   
   NEW FINDINGS:
   - [competitor]: [finding] [impact on houndshield]
   
   THREAT LEVEL CHANGES:
   - [competitor]: [old level] → [new level] [reason]
   
   NEW ENTRANTS:
   - [company]: [what they do] [threat level]
   
   POSITIONING IMPLICATIONS:
   [1-3 sentences on whether houndshield positioning needs to change]

6. Commit the brain update
7. If a CRITICAL competitive threat is found (e.g., major free competitor adds CMMC features): flag immediately

Do not mark complete until brain is updated and committed.
```
