---
name: setup-auditor
description: Audit a Claude setup (CLAUDE.md, skills, hooks, settings) against Anthropic's CURRENT published guidance and report what to delete, rewrite, keep and add. Every DELETE must quote the live doc sentence that justifies it. Use when the user says "audit my setup", "six-month audit", "what should I delete from CLAUDE.md", "is my prompt stale", or invokes /setup-auditor.
user-invocable: true
---

# /setup-auditor — The Six-Month Audit

Every instruction in a Claude setup was written to fix a problem some older model had.
Nobody removes them once the model stops having the problem. This finds the ones that now
cost tokens, quality, or both.

When Opus 5 shipped, Anthropic's own Claude Code team deleted **more than 80%** of Claude
Code's system prompt and the model performed **better** without it. The scaffolding had
been compensating for weaknesses that no longer existed.

> **Provenance.** Reconstructed from the published Six-Month Audit spec (delete table §3,
> add table §4, tactics §7, Route B prompt). The author's original `SKILL.md` attachment is
> behind a Notion signed URL and was not retrievable. Behaviour matches the spec; wording is
> not byte-identical.

---

## RULE 0 — Fetch the guidance live. Every run. No exceptions to this one.

Model-specific advice changes every time a model ships. An audit with the rules baked in
becomes exactly the stale artefact it exists to find.

Read these three before forming a single verdict:

| Page | What it gives you |
|---|---|
| `platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices` | The living cross-model reference. Start here |
| The page for the model actually in use — linked from the page above | Where the delete instructions live. **Confirm the model with `/model` first** — these rules are model-specific |
| Anthropic's prompt-engineering blog post | The general craft, and which older techniques are now optional |

Fetch with whatever web tool the host has (`WebFetch`, or TinyFish `fetch_content`).
**If you cannot reach the docs, stop and say so.** Do not audit from memory — an audit that
quotes guidance from recall is auditing against a snapshot, and the snapshot is the problem.

---

## STEP 1 — Inventory

List every file in scope before reading any of them, with line counts:
`CLAUDE.md` · `CLAUDE.local.md` · `.claude/skills/**/SKILL.md` · `.claude/agents/*.md` ·
`.claude/settings.json` (hooks + model/effort pins) · `~/.claude/CLAUDE.md` · output styles.

Report the total. The honest count is part of the deliverable.

---

## STEP 2 — The delete pass (run first; this is where the wins are)

For each pattern, grep the files. For each hit: quote **the line you found**, then quote
**the sentence in Anthropic's docs that condemns it**.

**If you cannot find a supporting line, the verdict is KEEP.** Never guess. Never invent a
source. An audit that never disagrees with itself is not auditing, it is agreeing.

| # | Search for | Why it goes |
|---|---|---|
| 1 | Explicit verification steps — "verify before done", "include a final verification step", "use a subagent to verify", "prove it works", "nothing is done until" | Causes over-verification; wastes tokens with no quality gain. Explicitly includes legacy harness scaffolding that adds a separate verify step |
| 2 | Re-check instructions — "double-check your answer", "re-verify before responding", "challenge your own work" | The model already catches and fixes its own mistakes. These compound with its own behaviour and add cost without improving results |
| 3 | Any rule telling the model not to think or not to reason | Increases internal XML tag leakage into visible output. Remove it |
| 4 | "Only report high-severity issues", "be conservative", "only flag the big ones" | Followed literally, so you get told **less**. Ask for everything, filter in a separate pass |
| 5 | Vision or image workarounds tuned for an older model | Re-validate against your own results — they may no longer be needed |
| 6 | Effort or model defaults carried over from a previous generation (incl. `"model": "..."` pins in `settings.json`) | Re-run an effort sweep. `low` and `medium` now hold quality at a fraction of cost and latency |
| 7 | XML tags and heavy role-play treated as mandatory structure | Once recommended, now optional. Keep where it genuinely separates mixed content; drop where it is ceremony |

Also flag, as REWRITE rather than DELETE:

- **Aggressive language.** "CRITICAL: You MUST…", "MANDATORY", "no exceptions". Current
  models over-trigger on it. Normal prompting — "Use this when…" — works better.
- **Role padding.** "You are an expert with 20 years of experience." Keep a role only where
  it genuinely changes the output.
- **Stale examples.** Examples written for an old model teach old habits. One current
  example beats ten stale ones.

### The false-positive guard — read before deleting anything

Two traps, both of which produced real errors in the author's own run:

**Trap 1 — truth rules are not severity filters.** "Only claim what you verified", "only
report work you can point to evidence for", "never forward an agent's summary as fact",
"say `unknown` rather than inventing a number". These stop **fabrication**. The guidance
targets instructions that narrow reporting *by severity* and instructions that make the
model *redo work it already does* — not instructions that keep it honest. **These stay,
whatever else goes.**

**Trap 2 — environment facts hiding inside a verification section.** A "verify before done"
block often has real, unrecoverable knowledge fused into it: which command lies about its
exit code, which flag silently passes while testing nothing, which build step corrupts
state. That is not ceremony — the model cannot re-derive it. **Delete the mandate framing,
migrate the facts to a neutral heading.** Losing them is a worse outcome than the
over-verification you were fixing.

---

## STEP 3 — The add pass

Newer models are more verbose and more eager than the ones the file was written for. That
opens five gaps. Give the **exact wording to paste**, not a description of it.

| # | What is missing | Why it is needed now |
|---|---|---|
| 1 | An explicit conciseness instruction | Default responses run longer. Effort controls how much the model **thinks**, not how much it **says** — length has to be asked for directly |
| 2 | Written-deliverable length calibration | Files written to disk come out longer and padded with boilerplate unless calibrated |
| 3 | A narration cadence for agentic work | It announces what it is about to do. Describe the cadence you want — **positive examples beat prohibitions** |
| 4 | A task-scope constraint | It expands scope and adds steps nobody asked for. Constrain narrow tasks explicitly |
| 5 | A subagent delegation cap | It delegates readily, multiplying cost and time on small tasks. Cap it, or name which scenarios justify it |

---

## STEP 4 — Report

Required shape. Anything less is a skim, not an audit.

1. **A table, one row per instruction:** the line found · verdict (DELETE / REWRITE / KEEP /
   ADD) · the reason in plain English · **Anthropic's quoted line**.
2. **Exact paste-able wording** for each of the five additions.
3. **The honest count** — "307 lines in. 4 deletes, 4 rewrites, 5 additions."
4. **`NOT RUN`** for anything you could not check — an unreachable doc, a file you lacked
   permission to read, a claim you could not source. Never issue a clean bill you did not
   earn.
5. **Checks that came back clean, named individually.** "Delete checks 3, 4, 5 and 7 return
   no hits" is a finding. Silence reads as an unrun check.

**Be blunt.** If most of the file should go, say so in the first sentence. The scaffolding
the user is proudest of writing is the likeliest casualty — that is the normal result, not
an insult.

### The one check that proves the audit was real

Pick any DELETE row and ask: *which page did that quote come from?* If the answer cannot
name the page and repeat the sentence, nothing was fetched and the row was guessed. Start
over.

---

## STEP 5 — Recommend the park experiment

The strongest signal, and almost nobody runs it. Rename — never delete:

```
mv CLAUDE.md CLAUDE.md.parked
```

Work a normal week. Add back only what was actually missed. Most people restore a fraction.

---

## Tactics worth knowing

| Lever | What it does |
|---|---|
| `/effort low`, `/effort medium` | Primary control for cost and latency. Quality holds on most work — the single biggest saving available |
| `/model` | Confirm the model **before** auditing. The delete rules are model-specific |
| Fetch, don't remember | Any audit quoting from memory is auditing against a snapshot |
| Positive examples | For narration and tone, showing the wanted style beats listing what to avoid |

**Run order:** inventory → fetch the three pages live → delete pass → add pass → park for a
week. Start with the delete pass on one file. If a single "always verify your work" line
comes out, the audit has paid for itself.
