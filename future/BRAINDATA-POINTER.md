# BrainData.md — pointer (not copied)

**Location:** `/Users/yantr/Desktop/BrainData.md` (outside the repo, ~4 MB, 84,501 lines)

**What it actually is** (scanned, not imported): a master prompt / HERMES OS spec, not
a dataset to ingest. Top of file = the repo list (see `REPOS-TRIAGE.md`). Body = directive
sections: `HERMES OS SUPREME ARCHITECT MODE`, `OODA EXECUTION STANDARD`, `WEBSITE DOMINANCE
RULE`, `UI/UX DEFECT HUNT MODE`, `REPOSITORY INSPECTION MODE`, `RELEASE GATE`, phase plans,
and a GitHub-README design master-prompt.

**Why it was not bulk-loaded into Brain AI:**
1. It's 4 MB — loading it raw would blow context/token budgets on every Brain AI call.
2. It's *instructions*, not *product knowledge*. Brain AI's knowledge graph wants facts
   about HoundShield (pricing, controls, modes), which already live in `lib/brain-ai/`.

**If you want it in Brain AI:** extract only the durable product facts (modes, pricing,
SPRS/controls, positioning) and append them to the Brain AI knowledge graph via
`lib/brain-ai/brain-query.ts → addKnowledge()`. I can do that pass on request — it's a
curation job, not a dump. The HERMES *directives* belong in `CLAUDE.md` / agent prompts,
not in the runtime knowledge graph.
