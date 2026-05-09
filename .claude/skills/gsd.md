# gsd — Get Shit Done: Spec-Driven Execution

Eliminate ambiguity before writing code. Every task starts with a 3-line spec, not a blank file.

## The GSD Loop

```
SPEC → IMPLEMENT → VERIFY → SHIP
```

Never skip SPEC. Never ship without VERIFY.

## Spec Format (3 lines max)

```
WHAT: <one sentence describing the output>
WHY:  <which Jordan job-to-be-done this serves>
DONE: <binary acceptance criteria — how you know it's complete>
```

### Example — PDF Report Button

```
WHAT: Button on dashboard that downloads compliance PDF for selected date range
WHY:  Jordan needs to hand a PDF to her C3PAO at the audit meeting
DONE: Click downloads a valid PDF with CMMC control table and SPRS score; works in demo mode
```

## Anti-Patterns (GSD Blocks These)

- Starting to code before the DONE criterion is written
- DONE criterion that requires judgment ("looks good", "works correctly")
- WHY that isn't tied to a real Jordan job ("nice to have", "improves UX")
- Implementing more than the WHAT describes

## HoundShield GSD Checklists

### New API Route
- [ ] Auth: conditional on `isSupabaseConfigured()`
- [ ] Response format: `{ success: true, data }` or `{ success: false, error }`
- [ ] Demo mode: returns meaningful data without Supabase
- [ ] TypeScript: 0 errors after save (PostToolUse hook confirms)

### New UI Component
- [ ] Under 500 lines
- [ ] Dark mode: uses `bg-[#07070b]` or `bg-[#0d0d14]`
- [ ] No `amber-*` or `yellow-*` — uses `brand-400`
- [ ] No fake/animated metrics (`Math.random()` increment)
- [ ] CursorGlow still works after change

### Compliance Engine Change
- [ ] compliance-specialist agent reviewed it
- [ ] Pattern count ≥ 16 (never reduce)
- [ ] SPRS weights sum unchanged
- [ ] All 110 NIST controls still present

### Pre-Ship
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] `npx tsc --noEmit` = 0 errors
- [ ] No `console.log` left in production paths
- [ ] No prompt content in logs (local-only boundary)

## Trigger: `/gsd <task>`

Generates a filled spec for the given task and blocks execution until spec is approved.
