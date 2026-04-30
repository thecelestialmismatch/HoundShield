# CLAUDE.md: HoundShield Development Governance

## Project Overview

**HoundShield / Houndshield.com** - The fastest, most compliant AI data loss prevention proxy

- **Mission**: Inline AI proxy with sub-10ms compliance scanning for defense contractors and regulated enterprises
- **Target Market**: CMMC Level 2 compliance-required defense contractors, HIPAA enterprises, enterprise security teams
- **Tech Stack**: React 19, Next.js 15, TypeScript strict, Node.js, Supabase, Stripe, PostHog
- **GitHub**: https://github.com/thecelestialmismatch/HoundShield.git

---

## Workflow Orchestration

### Rule 1: Observe Then Orient
Before any implementation:
- Deep research on the problem space (GitHub, docs, existing solutions)
- Understand current codebase state (read critical files first)
- Identify gaps, inconsistencies, blockers
- Orient strategically before building

### Rule 2: Plan Mode Default
For any non-trivial task (3+ steps or architectural decisions):
1. Write checklist to `tasks/todo.md`
2. Identify dependencies and blockers
3. Check in with checkpoint plan
4. Only then start implementation

### Rule 3: Subagent Strategy
When working with multiple agents (if context permits):
- One task per subagent for focused execution
- Main agent (you) maintains context and governance
- Offload research, exploration, parallel analysis
- For complex problems, throw more compute at it via subagents
- All agents report: what done, test results, ready to merge or blocked on decisions

### Rule 4: Self-Improvement Loop
After ANY correction from the user:
1. Update `tasks/lessons.md` with the pattern
2. Write rules that prevent the same mistake
3. Ruthlessly iterate until error rate drops
4. Review lessons at session start

### Rule 5: Verification Before Done
Never mark a task complete without proving it works:
- Run all relevant tests (unit, integration, perf, security)
- Load test under realistic conditions
- Diff behavior between main and changes
- Ask: "Would a staff engineer approve this?"
- Demonstrate correctness with specific output/logs

### Rule 6: Autonomous Bug Fixing
When given a bug report:
- Just fix it. Don't ask for hand-holding.
- Point at logs and errors, then resolve
- Zero context switching required
- Go fix failing CI tests without being told how

---

## Task Management Framework

### Step 1: Plan First
Create entry in `tasks/todo.md`:
```markdown
## Task [ID]: [Title]
- [ ] Sub-step A
- [ ] Sub-step B
- [ ] Verify
- [ ] Document
- [ ] PR ready

Checkpoint: [What defines done]
Estimate: [Time]
```

### Step 2: Verify Plan
Check in before starting:
- "Plan is ready, proceeding with implementation"
- Flag any dependencies or blockers
- Update progress as you go

### Step 3: Track Progress
Mark items complete incrementally:
- Update checkbox as each sub-step completes
- Add timestamps for longer tasks
- Update SESSION_STATE.json every 30 min

### Step 4: Explain Changes
High-level summary after each significant step:
- "Completed X, now working on Y"
- Link to relevant files
- Show test results

### Step 5: Document Results
Add review section to `tasks/todo.md`:
```markdown
## Review
- All tests: PASS
- Coverage: 94%
- Performance: sub-10ms ✓
- Ready to merge: YES
- PR: #[number]
```

### Step 6: Capture Lessons
Update `tasks/lessons.md`:
```markdown
## Lesson: [Pattern learned]
- What happened: [Situation]
- Why it happened: [Root cause]
- How to prevent: [Rule or check]
- Test case: [Example]
```

---

## Core Development Principles

### Simplicity First
- Make every change as simple as possible
- Impact minimal code
- Single responsibility per function
- Resist "while I'm here" changes

### No Laziness
- Find root causes, not symptoms
- No temporary fixes or TODO comments without follow-up
- Senior developer standards on all code
- If it feels hacky, implement the elegant solution

### Minimal Impact
- Only touch what's necessary
- No side effects introducing new bugs
- Verify no unintended behavior changes
- Comprehensive test coverage for all modified paths

---

## Critical Code Standards

### TypeScript Strict Mode (Non-Negotiable)
```typescript
// ✓ Good
interface ScanResult {
  hasPII: boolean;
  violations: Array<{type: 'pii' | 'phi' | 'cui'; value: string}>;
}

function scanPrompt(input: string): ScanResult {
  // implementation
}

// ✗ Bad
const scanPrompt = (input) => {  // any type
  const result: any = {};  // any type
  return result as ScanResult;  // unsafe cast
}
```

### 100% Critical Path Testing
```typescript
// Tests for
// 1. Happy path (normal input -> expected output)
// 2. Edge cases (empty, huge, special chars)
// 3. Error cases (invalid input, service down)
// 4. Performance (latency < 10ms)
// 5. Security (no secrets leakage, no injection)
```

### Compliance-Aware Design
Every function asks:
- Does this handle PII/PHI/CUI correctly?
- Is logging safe for audit trails?
- Does this preserve data residency?
- Could this violate CMMC L2 / HIPAA / SOC 2?

### Performance Budget
- Scanning latency: < 10ms (absolute requirement)
- API response: < 100ms
- Frontend render: < 16ms (60fps)
- Benchmark before and after critical changes

### Security by Default
- Secrets in environment variables only
- Input validation with Zod
- SQL injection protection (parameterized queries)
- OWASP Top 10 awareness
- Audit logging for all compliance-relevant actions
- No console.logs of sensitive data

---

## Git Workflow & PR Standards

### Branch Naming
```
feature/[task-id]-[short-description]
fix/[task-id]-[issue-description]
refactor/[task-id]-[what-changed]
perf/[task-id]-[what-improved]
```

### Commit Messages
```
[TASK-ID] Brief description

- Why this change
- What was changed
- Test coverage

Fixes #[issue] (if applicable)
```

### PR Description Template
```markdown
## What
[What does this PR do]

## Why
[Why is this change needed - business/technical rationale]

## How
[How does the implementation work]

## Testing
- [x] Unit tests: [coverage %]
- [x] Integration tests: [specific scenarios]
- [x] Performance: [latency measured]
- [x] Security: [OWASP checks, dependency audit]
- [x] Compliance: [CMMC/HIPAA/SOC2 reviewed]

## Files Changed
[List critical files]

Task: [Link to task in SESSION_STATE.json]
```

### Merge Requirements
- [ ] Code review approval (at least 1 reviewer)
- [ ] All tests pass (CI green)
- [ ] Coverage not decreased
- [ ] TypeScript strict: zero errors
- [ ] No console.logs or debug code
- [ ] Documentation updated
- [ ] CHANGELOG updated

---

## Session Persistence Protocol

### What Gets Saved
When SESSION_STATE.json is updated (every 30 min or task completion):
```json
{
  "elapsed_hours": 2.5,
  "tokens_used": {
    "total": 95000,
    "remaining": 105000
  },
  "completed_tasks": [
    {
      "task_id": "task_001",
      "title": "Implement Gemini Flash integration",
      "pr_url": "https://github.com/.../pull/123",
      "completed_at": "2026-04-28T02:15:00Z"
    }
  ],
  "current_task": {
    "task_id": "task_002",
    "progress_checkpoint": "Completed scanning, now working on remediation",
    "next_steps": ["Fix encryption", "Add logging", "Test"]
  },
  "memory_snapshot": {
    "project_understanding": "[Compressed understanding]",
    "critical_blockers": "[What's blocking progress]",
    "architectural_decisions": "[Key decisions made]",
    "next_priority": "[What's highest leverage next]"
  }
}
```

### Resume Protocol
When you say "continue":
1. Load SESSION_STATE.json
2. Report time elapsed, tokens used, tasks completed
3. Show current task checkpoint and next steps
4. Provide compressed context
5. Resume from exact checkpoint (don't restart)

---

## Architecture Domains

### Frontend (`src/frontend/`)
- React 19 components
- Next.js 15 routing
- Zustand state management
- Tailwind CSS styling
- Real-time compliance dashboard

### Gateway (`src/gateway/`)
- LLM routing logic
- Prompt interception
- Multi-model support (OpenAI, Claude, Gemini)
- Latency optimization (<10ms requirement)

### Compliance Engine (`src/compliance/`)
- PII/PHI/CUI detection
- CMMC L2 rule codification
- HIPAA encryption checks
- SOC 2 audit logging
- Regex fallback logic (deterministic safety)

### API (`src/api/`)
- REST endpoints
- Authentication (CMMC-compliant)
- Rate limiting
- Audit trail logging
- Webhook handling

### Database (`src/db/`)
- Supabase/PostgreSQL schema
- Encryption at rest
- Audit log tables
- Migration system

### DevOps (`src/devops/`)
- Docker containerization
- Kubernetes configs (if applicable)
- GitHub Actions CI/CD
- Monitoring and alerting

---

## Deployment Checklist

Before every deployment:
- [ ] All tests pass on main branch
- [ ] TypeScript strict: zero errors
- [ ] Dependency audit clean (no vulnerabilities)
- [ ] Environment variables set correctly
- [ ] Database migrations tested
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented
- [ ] Load test passes (2x expected traffic)

Deployment command (when ready):
```bash
npm run deploy:staging  # Test environment first
npm run deploy:prod    # Production after verification
```

---

## Success Metrics

You win when each task achieves:

1. **Functionality**: Feature works as specified, all acceptance criteria met
2. **Testing**: 100% critical path, 80%+ overall coverage, perf targets met
3. **Type Safety**: TypeScript strict mode - zero errors
4. **Performance**: Sub-10ms scanning latency maintained
5. **Compliance**: CMMC L2/HIPAA/SOC2 verified
6. **Security**: OWASP Top 10 aware, no secrets in code, audit logging
7. **Documentation**: README, API docs, JSDoc, CHANGELOG updated
8. **Code Review**: Staff engineer would approve on first read
9. **Mergeable**: PR meets all criteria, ready to deploy

---

## The One Rule

**Never skip Context or Stop Conditions.**

Those two are the difference between a generic Claude response and one that actually does the work.

---

**Status**: Active  
**Last Updated**: 2026-04-28  
**Session**: See SESSION_STATE.json for current progress  
**Standard**: "Holy shit, that's done"
