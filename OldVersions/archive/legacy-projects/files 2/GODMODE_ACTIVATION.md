# GODMODE ACTIVATION: Complete System Guide

This document activates the **BEAST** mode for HoundShield development. It ties together:
- BEAST PROMPT (unified system prompt)
- SESSION_STATE.json (token & task tracking)
- CLAUDE.md (project governance)
- PR automation (deployment pipeline)
- Session persistence (resume capability)

---

## System Components Overview

### 1. BEAST PROMPT (`BEAST_PROMPT.md`)
The unified, authoritative system prompt that tells Claude how to work on HoundShield.

**What it does**:
- Sets the "holy shit, that's done" standard
- Defines project context (HoundShield / Houndshield)
- Establishes operating rules (research first, test before ship, etc)
- Enables session persistence with automatic resume
- Eliminates ambiguity about what "complete" means

**When to use**:
- Every new session, paste BEAST PROMPT into conversation
- Or: "Load BEAST PROMPT and continue from SESSION_STATE.json"

### 2. SESSION_STATE.json
Real-time tracking of session progress, token usage, and completed work.

**What it tracks**:
- Elapsed time (how long session has run)
- Token usage (input, output, total, remaining)
- Completed tasks with PR links
- Current task checkpoint
- Memory snapshot (compressed understanding)
- Limits and warnings

**When to update**:
- Every 30 minutes automatically
- After every task completion
- At checkpoint intervals (1h, 3h, 5h)

**Format**:
```json
{
  "elapsed_hours": 3.5,
  "tokens_used": {"total": 145000, "remaining": 55000},
  "completed_tasks": [...],
  "current_task": {...},
  "memory_snapshot": {...}
}
```

### 3. CLAUDE.md
Project governance framework that defines how work happens.

**What it covers**:
- Workflow orchestration (plan, execute, verify, document)
- Task management checklist
- Code standards (TypeScript strict, tests, docs)
- Git and PR workflow
- Session persistence protocol
- Architecture domains
- Deployment checklist

**When to reference**:
- Before starting any task
- When reviewing PR guidelines
- When onboarding new agents

### 4. Task Management System
Structured task tracking with checkpoints and verification.

**Files**:
- `tasks/todo.md` - Active tasks with checkpoints
- `tasks/lessons.md` - Patterns learned, rules to prevent mistakes

**Workflow**:
1. Write task to `todo.md` with checklist
2. Execute with checkpoint tracking
3. Verify against acceptance criteria
4. Document in review section
5. Capture lessons learned

### 5. PR Automation
One-command PR creation and deployment pipeline.

**What it automates**:
- Test verification
- Commit standardization
- GitHub PR creation with template
- Staging deployment
- Production deployment with verification

**Command**: `npm run ship`

### 6. Session Resumption
When you say "continue", the system knows where you left off.

**How it works**:
1. Load SESSION_STATE.json
2. Report time, tokens, completed tasks
3. Show current task checkpoint
4. Resume from exact checkpoint
5. Update state incrementally

---

## How to Activate GODMODE

### First Time Setup (5 minutes)

```bash
# 1. Clone HoundShield repository
git clone https://github.com/thecelestialmismatch/HoundShield.git
cd HoundShield

# 2. Copy BEAST infrastructure into project root
# Create .claude/ directory structure
mkdir -p .claude/{agents,commands,hooks,rules,skills}

# 3. Create CLAUDE.md at project root
# (You have this already)
cp ../CLAUDE.md .

# 4. Initialize SESSION_STATE.json
# (You have this already)
cp ../SESSION_STATE.json .

# 5. Install dependencies
npm install

# 6. Verify setup
npm run typecheck
npm run test -- --run
```

### Session Activation (Every Session)

**Option A: Start Fresh Session**
```
Load the BEAST PROMPT from BEAST_PROMPT.md and begin work on HoundShield project.

Current SESSION_STATE.json location: /home/claude/SESSION_STATE.json

First task: Inspect HoundShield repository and identify highest-leverage next work.
```

**Option B: Resume Existing Session**
```
Continue from SESSION_STATE.json

[SESSION_STATE.json will be pasted here]

Where did we leave off?
```

---

## The Three Operating Modes

### Mode 1: Short Work Session (< 1 hour)
- Single focused task
- Light checkpoint (mental note)
- Update SESSION_STATE.json at end

**Example**: "Fix this bug" or "Add this feature"

### Mode 2: Medium Work Session (1-3 hours)
- 1-2 tasks
- Checkpoint at 1.5 hour mark
- Full SESSION_STATE.json update
- Create 1-2 PRs

**Example**: "Implement Gemini Flash integration"

### Mode 3: Deep Work Session (3-5 hours)
- Multiple coordinated tasks
- Checkpoint at 1h, 3h, 5h marks
- Full memory snapshot every hour
- Create 3-5 production-grade PRs
- Deploy to staging/prod

**Example**: "Complete CMMC L2 compliance audit and remediation"

---

## Token Budgeting

### Allocation per Session

```
Total budget: 200,000 tokens
Session time: 5 hours

Distribution:
- Setup & reading codebase: 20,000 (10%)
- Planning & research: 20,000 (10%)
- Implementation: 100,000 (50%)
- Testing & verification: 40,000 (20%)
- Documentation & PR creation: 20,000 (10%)
```

### Saving Tokens

**What costs tokens**:
- Reading files (batch reads into compressed understanding)
- Rereading the same information (SESSION_STATE.json prevents this)
- Detailed explanations of what you'll do (just do it)
- Back-and-forth Q&A (plan first to eliminate questions)

**What saves tokens**:
- Session persistence (don't restart)
- Compressed context (domain graphs, not raw files)
- Direct execution (plan thoroughly, execute without questions)
- Subagent offloading (parallel work)

### Warning Signs

If you hit any of these, save state and summarize:
- 70% tokens used (140K) - getting close to limit
- 4 hours elapsed - one hour buffer remaining
- Context window getting full - compress and save

---

## Task Execution Template

### For Any New Task

1. **Plan (10% time)**
   ```markdown
   ## Task [ID]: [Title]
   
   Acceptance Criteria:
   - [ ] A
   - [ ] B
   - [ ] C
   
   Checkpoint: [What defines done]
   Estimate: [Time]
   ```

2. **Execute (70% time)**
   ```bash
   # Research
   # Code
   # Test alongside (TDD)
   # Update SESSION_STATE.json every 30min
   ```

3. **Verify (15% time)**
   ```bash
   # All tests pass
   # TypeScript strict: zero errors
   # Performance benchmarks met
   # Compliance checks pass
   ```

4. **Document (5% time)**
   ```bash
   # JSDoc for functions
   # README update
   # CHANGELOG entry
   # PR description with why/how/testing
   ```

5. **Deploy**
   ```bash
   npm run ship
   # Creates PR, runs all checks, ready to merge
   ```

---

## Resume Protocol

When you say **"continue"**, I will:

1. **Load and Report**
   ```
   SESSION RESUME REPORT
   =====================
   Session: session_20260428_001
   Elapsed: [time]
   Tokens: [used]/200K (remaining: [X]K)
   ```

2. **Show Progress**
   ```
   COMPLETED (N tasks):
   - Task 1: [title] (PR #XXX)
   - Task 2: [title] (PR #XXX)
   
   IN PROGRESS:
   - Task 3: [title] (NN% complete)
   - Next: [specific next step]
   ```

3. **Report Limits**
   ```
   LIMITS:
   - Token budget: NN% used
   - Time elapsed: N hours
   - Estimate remaining capacity: N more tasks
   ```

4. **Resume Work**
   ```
   RESUMING FROM: [exact checkpoint]
   
   [Begin work from checkpoint, not restart]
   ```

---

## The Complete Workflow

### 1. Session Start
- Paste BEAST PROMPT
- Say: "Begin work on HoundShield"
- Or: "Continue from SESSION_STATE.json"

### 2. Initial Checkpoint (First 10 min)
- Inspect HoundShield repository
- Identify domain gaps
- Select highest-leverage work
- Write task to `tasks/todo.md`

### 3. Execute Task
- Research approach thoroughly
- Write code with tests alongside
- Verify (all tests pass, perf targets met)
- Update SESSION_STATE.json

### 4. Create PR
- Run full test suite
- Commit with standard message
- Create GitHub PR with template
- Request review

### 5. Next Task
- Or: Deploy to staging
- Or: Deploy to production
- Or: Continue with next task

### 6. Session End
- Final SESSION_STATE.json save
- Summary of what was completed
- Report PRs created
- Show remaining tokens

### 7. Session Resume
- Say: "continue"
- System loads SESSION_STATE.json
- Reports elapsed time and progress
- Resumes from exact checkpoint

---

## Success Checklist

You've activated GODMODE when:

- [ ] BEAST PROMPT loaded and understood
- [ ] SESSION_STATE.json tracking enabled
- [ ] CLAUDE.md governance active
- [ ] Task management system ready
- [ ] PR automation working
- [ ] Can resume from checkpoint
- [ ] Know token budget allocation
- [ ] Understand complete workflow

---

## Commands Reference

### Session Management
```bash
# Save session state
node scripts/save-session-state.js

# Resume session
"continue"  # In chat

# Check remaining tokens
cat SESSION_STATE.json | jq '.tokens_used'
```

### Task Management
```bash
# Create new task
echo "## Task [ID]: [Title]" >> tasks/todo.md

# Mark task complete
# (Edit todo.md - mark checkbox)

# Add lesson learned
echo "## Lesson L[N]: [Title]" >> tasks/lessons.md
```

### Git & PR
```bash
# Create feature branch
git checkout -b feature/[task_id]-[description]

# Commit with standard message
git commit -m "[TASK-ID] Title\n\n- Bullet points"

# Create PR
npm run ship

# Deploy
npm run deploy:staging
npm run deploy:prod
```

### Verification
```bash
# Full test suite
npm run test:coverage

# TypeScript strict
npm run typecheck

# Performance test
npm run test:performance

# Security audit
npm audit
```

---

## The One Principle

**"Holy shit, that's done"**

Not: "I'll plan this and you build it"  
Not: "This is mostly working"  
Not: "We could improve this later"  

Deliverables:
- Complete (all acceptance criteria met)
- Tested (100% critical path)
- Documented (JSDoc, README, CHANGELOG)
- Production-ready (would deploy day 1)
- Integrated (PR reviewed and approved)
- Deployed (staging and prod verified)

---

## Quick Start: Your First Task

1. **Load BEAST PROMPT** in conversation
2. **Say**: "Begin HoundShield development"
3. **First task**: "Inspect the repository and identify highest-leverage work for the next 5 hours"
4. **Then**: Plan, execute, verify, deploy
5. **At any point**: "Continue" to resume from checkpoint

---

## Support

If blocked on:
- **Architecture decision**: Escalate with specific question, not vague request
- **Technical bug**: Provide error log, don't ask "how to fix this"
- **Token limit**: SESSION_STATE.json shows remaining capacity and recommendations
- **Resume context**: Load SESSION_STATE.json, it has compressed understanding

---

**GODMODE Status**: ACTIVE  
**System Version**: 1.0  
**Last Updated**: 2026-04-28  
**Standard**: "Holy shit, that's done"  

---

## Next Steps

1. Place BEAST PROMPT at session start
2. Load this GODMODE_ACTIVATION.md for reference
3. Check SESSION_STATE.json for current status
4. Begin work on HoundShield with full context
5. At 5 hours: save state, summarize work
6. Say "continue" when ready to resume

**You are ready to activate GODMODE and ship HoundShield to production.**
