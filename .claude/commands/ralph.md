---
name: ralph
argument-hint: [idea or task description]
---

Relentless execution mode for: $ARGUMENTS

Follow the Ralph Methodology — no exceptions:

## 1. PLAN
- Define architecture decision and approach
- Write exact definition of done (acceptance criteria)
- List risks and blockers
- Confirm with user before proceeding

## 2. BREAK
- Decompose into atomic tasks, 5-10 minutes each
- Number sequentially, identify dependencies

## 3. EXECUTE
- One task at a time — verify before moving to next
- Self-heal errors: read the error, find root cause, fix it
- `npm run build` after every 3 tasks to catch drift early

## 4. SHIP
- `npm run build` — must pass with zero errors
- Run code-reviewer agent
- `git add [specific files only — never git add -A]`
- `git commit -m "feat: [description]"`
- `git push origin [current-branch]`

Never ask clarifying questions unless genuinely blocked after investigation.
Read the code, infer the context, execute.
