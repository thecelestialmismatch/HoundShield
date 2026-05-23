# BEAST System Quick Reference Card

Everything you need to know on one page.

---

## Session Commands

### Start New Session
```
Paste BEAST_PROMPT.md
Say: "Begin HoundShield development"
```

### Resume Existing Session
```
Say: "continue"
```

### Check Status
```
cat SESSION_STATE.json | jq '.'
```

### Save Session
```
npm run save-session
```

---

## Development Workflow

### 1. Plan
```bash
# Edit tasks/todo.md
# Add task with checklist and checkpoint
# Verify plan before starting
```

### 2. Execute
```bash
# Code + tests together (TDD)
# Run tests as you go
npm run test -- --watch

# Update SESSION_STATE every 30min
npm run save-session

# Verify no console.logs
grep -r "console\." src/ --exclude-dir=node_modules
```

### 3. Verify
```bash
# All tests pass
npm run test:coverage

# TypeScript strict - zero errors
npm run typecheck

# Performance targets met
npm run test:performance

# No secrets in code
grep -r "SECRET\|API_KEY" src/ | grep -v "process.env"
```

### 4. Deploy
```bash
# Ship to staging (test environment)
npm run deploy:staging

# Ship to production (after staging verified)
npm run deploy:prod
```

---

## File Locations

| File | Purpose |
|------|---------|
| BEAST_PROMPT.md | Main system prompt - load this first |
| CLAUDE.md | Project governance |
| GODMODE_ACTIVATION.md | System overview |
| SESSION_STATE.json | Session tracking (auto-updated) |
| tasks/todo.md | Active tasks |
| tasks/lessons.md | Lessons learned |
| pr-automation.md | Deployment docs |
| MANIFEST.md | System inventory |
| INTEGRATION_GUIDE.md | Setup instructions |
| .claude/settings.json | Agent configuration |

---

## Critical Standards

### Code
```typescript
// ✓ Good
const scanPrompt = (prompt: string): ScanResult => {
  const validated = ScanInputSchema.parse(prompt);
  return scan(validated);
};

// ✗ Bad
const scanPrompt = (prompt: any): any => {
  return scan(prompt as ScanResult);
};
```

### Tests
```typescript
// ✓ Good
it('should detect SSN', () => {
  const result = scanPrompt('SSN: 123-45-6789');
  expect(result.hasPII).toBe(true);
});

// ✗ Bad
it('scanning works', () => {
  const result = scan('something');
  expect(result).toBeDefined();
});
```

### Documentation
```markdown
// ✓ Good
/**
 * Scans a prompt for PII/PHI/CUI violations
 * @param prompt - User input to scan
 * @returns ScanResult with violations and recommendations
 * @throws ValidationError if input is invalid
 */

// ✗ Bad
// scans the prompt
```

---

## The One Rule

**Never skip Context or Stop Conditions**

This is the difference between good output and actually working code.

---

## Session Lifecycle

### During Session
```
0h     - Load BEAST PROMPT, initialize SESSION_STATE.json
1h     - Checkpoint #1, review progress
2h     - Checkpoint #2, 100K tokens consumed
3h     - Complete first task, create PR #1
4h     - Complete second task, deploy to staging
5h     - Complete third task, prepare for resume
5h     - Save SESSION_STATE.json, report progress
```

### Between Sessions
```
SESSION_STATE.json saved (knows what's done)
Memory snapshot captured (compressed understanding)
PRs created and deployed (changes shipping)
Ready to resume from exact checkpoint
```

### Resume Protocol
```
Say: "continue"

Get back:
- Time elapsed since last session
- Tokens used and remaining
- All completed tasks (with PR links)
- Current task checkpoint
- Exact place to resume

Continue from checkpoint (no restart)
```

---

## Token Budget Quick View

```
Total: 200K tokens
Per session: 5 hours

Allocation:
Setup (10%):        20K  tokens
Planning (10%):     20K  tokens
Implementation (50%): 100K tokens
Verification (20%): 40K  tokens
Documentation (10%): 20K  tokens
```

### Token Savers
- Load SESSION_STATE.json (don't reread project)
- Use compressed context (domain graphs, not raw files)
- Plan thoroughly before coding (fewer iterations)
- Automated testing (less debugging)

### Token Wasters
- Restarting from scratch
- Rereading the same files
- Back-and-forth Q&A about what to do
- Asking "what should I do?" instead of planning

---

## Common Tasks & Commands

### Create New Feature
```bash
# 1. Write task to tasks/todo.md
# 2. Create branch
git checkout -b feature/task_001-feature-name

# 3. Code + test
npm run test -- --watch

# 4. Verify
npm run typecheck
npm run test:coverage

# 5. Commit
git add -A
git commit -m "[TASK-001] Feature title\n\n- Details"

# 6. Deploy
npm run deploy:staging

# 7. Save
npm run save-session
```

### Fix Bug
```bash
# 1. Point at error
# 2. Run failing test
npm run test -- test-name.test.ts

# 3. Fix code
# 4. All tests pass
npm run test:coverage

# 5. Deploy
npm run deploy:staging
```

### Deploy to Production
```bash
# 1. Staging already tested
# 2. All PRs merged
# 3. Run deployment
npm run deploy:prod

# 4. Verify live
curl https://kaelus.ai/health

# 5. Update SESSION_STATE.json
npm run save-session
```

---

## Verification Checklist (Before "Done")

- [ ] TypeScript strict: `npm run typecheck` passes
- [ ] Tests: `npm run test:coverage` all PASS
- [ ] Perf: sub-10ms latency verified
- [ ] Security: no console.logs, no hardcoded secrets
- [ ] Compliance: CMMC/HIPAA/SOC2 aware
- [ ] Documentation: JSDoc, README, CHANGELOG
- [ ] PR: Description complete, tests shown
- [ ] Ready: Would deploy day 1

If all checked: "Holy shit, that's done"

---

## The Standard

❌ "This mostly works"  
❌ "We can polish this later"  
❌ "Let me plan what to do"  

✓ "Shipped. Done. Working. Tested. Documented."

---

## Help / Blocked

### "I'm blocked"
Point at error message or specific decision needed. Don't ask vague questions.

### "I forgot what I was doing"
Load SESSION_STATE.json - it has your checkpoint.

### "I'm running out of tokens"
Check `cat SESSION_STATE.json | jq '.tokens_used'`
Wrap up, save state, resume next session.

### "Something broke"
Point at logs. I'll fix it, not ask you how.

### "I need to resume"
Say "continue" - system loads state and resumes from checkpoint.

---

## Productivity Gains

| Metric | Traditional | BEAST System |
|--------|-------------|--------------|
| Context setup | 30% of session | 1% of session |
| Lost context between sessions | 100% (full restart) | 0% (checkpoint resume) |
| Token efficiency | 40-50% productive | 90%+ productive |
| Session startup | 30+ min | <2 min |
| Task handoff | Needs full re-briefing | "continue" |
| Deployment | Manual, error-prone | Automated, tested |

---

## Success Metric

**"Holy shit, that's done"**

Every deliverable is:
- Complete
- Tested
- Type-safe
- Performant
- Compliant
- Documented
- Production-ready
- Integrated

Not plans. Not "mostly working". Shipped.

---

## Emergency Rollback

If deployment fails:
```bash
npm run rollback:prod
```

---

## Key Files to Know

| File | When to Read |
|------|--------------|
| BEAST_PROMPT.md | Session start (paste into chat) |
| CLAUDE.md | Before any task |
| SESSION_STATE.json | Before and after work |
| MANIFEST.md | System overview |
| GODMODE_ACTIVATION.md | How the system works |
| tasks/todo.md | Track active work |
| tasks/lessons.md | Learn from mistakes |

---

## The Path Forward

1. **Now**: Copy all files to HoundShield
2. **Setup**: Run integration steps (15 min)
3. **Activate**: Load BEAST_PROMPT, say "Begin"
4. **Ship**: Build first task (3-5 hours)
5. **Resume**: Say "continue", pick next task
6. **Repeat**: Session after session, ship production code

---

**Status**: READY TO GO  
**Next Step**: Load BEAST_PROMPT.md  
**Result**: HoundShield shipped at velocity

---

**One page. Everything you need. Now ship it.**
