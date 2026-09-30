# What To Delete

Written 2026-09-08. Every claim below was verified by reading the files, not
assumed. Nothing here has been executed. The script at
scripts/cleanup-strategy-sprawl.sh performs the file deletions in one command
when the decision is made.

## Why this exists

The HoundShield repository contains 645 markdown files. The docs directory
alone holds 146,076 words, which is roughly two novels, describing a company
with zero customers. Every hour spent writing one of them was an hour not spent
in contact with a person who could pay.

Deleting them is not tidiness. It removes the option to do it again. A person
who cannot find the old roadmap cannot spend Tuesday revising it.

## Tier one: archive an entire project today

### VibeFlow

Action. Archive the repository on GitHub. Settings, then Danger Zone, then
Archive. This is reversible and preserves everything.

Evidence.

1. package.json declares the project name as "leakwall," which is neither
   VibeFlow nor anything on the site.
2. The README claims an autonomous B2B revenue engine and an AI compliance
   officer for businesses.
3. The actual contents are a Polymarket prediction market trading bot across
   four phase directories, plus a partially built compliance scanner sharing
   the same src tree.
4. CLAUDE.md in that repository describes only the Polymarket bot and never
   mentions compliance.
5. AUDIT.md and FIX_PLAN.md both describe unfinished Phase 2 gating work that
   was never completed.
6. Last commit 2026-05-24. Untouched for over three months.
7. A zero byte file named polymarket-mvp-phase2-livelive.yaml sits in the root.

This is three abandoned ideas sharing a folder. It cannot become a business, it
answers no question a customer has, and its presence makes the answer to "what
do you do" three sentences long instead of one. Archive it.

### RipoDoc

Action. Park. Do not archive, do not delete, do not develop.

Keep the domain, keep the site online, keep the repository. Write no new code
and no new strategy. It costs nothing to leave standing.

Reasoning. Its thesis is independently validated: the Kaseya 2026 State of the
MSP Report found 71 percent of MSPs name winning new customers as their biggest
challenge and 19 percent name their own inability to quickly demonstrate value.
That is precisely the problem RipoDoc addresses. It also sells to the same MSP
that HoundShield outreach is already contacting, so it can be revived by a
customer request rather than by a plan.

Revisit only when HoundShield has three paying customers, or when HoundShield
is declared dead on 2026-11-08, or when an MSP asks for it unprompted. Not
before, and not because a quiet week made it look appealing.

## Tier two: delete duplicate strategy documents

Thirteen competing master prompt and strategy documents exist, totalling
roughly 247,000 characters. Two pairs are byte identical, verified by checksum.

Delete these. CLAUDE.md at the repository root is the surviving single source
of truth.

1. docs/MASTER-PROMPT.md, 75KB, superseded by root CLAUDE.md
2. docs/BEAST-FINAL-SYNTHESIS.md, 46KB
3. docs/beast-prompt-v100.md, 38KB
4. docs/BEAST_PROMPT.md, 11KB
5. docs/LeakWall_Mega_Prompt.md, 12KB, refers to a product name no longer used
6. docs/GODMODE_ACTIVATION.md, 11KB
7. docs/CLAUDE_v2_draft.md, byte identical to docs/CLAUDE.md, checksum e8811d28
8. docs/CLAUDE 2.md, byte identical to docs/CLAUDE_1.md, checksum 4f82561d
9. docs/CLAUDE_1.md, the other half of that identical pair
10. docs/CLAUDE.md, superseded by root CLAUDE.md
11. docs/CLAUDE-CODE-PROMPT.md
12. docs/CLAUDE-CODE-ULTIMATE-PROMPT.md
13. docs/CLAUDE-CODE-LAYOUT.md

Keep GEMINI.md, .cursorrules and .windsurfrules even though all three are
byte identical. Different editors read different filenames, so that duplication
is functional rather than accidental.

## Tier three: delete superseded plans

Five roadmaps, four PRDs and four launch checklists exist for a company that
has never launched anything to a paying customer. Keep one of each.

Delete.

1. docs/ROADMAP.md and docs/ROADMAP-12-MONTH.md and docs/HOUNDSHIELD_ROADMAP_24M.md.
   A 24 month roadmap for a company with no customers is fiction. Root
   ROADMAP.md survives, and even that is not read again until there is revenue.
2. docs/PRD.md, docs/PRD-V3-5K-MRR.md, docs/KAELUS-PRD.md. Kaelus is a former
   product name. docs/HOUNDSHIELD_PRD_v1.md survives.
3. docs/LAUNCH-CHECKLIST.md, docs/LAUNCH-CHECKLIST-2026-06.md,
   compliance-firewall-agent/LAUNCH-CHECKLIST.md. Nothing is launching; the
   sites are already live.
4. docs/AUDIT-2026-05-12.md, docs/VALIDATION.md, docs/VALIDATION-2026-07-12.md,
   docs/SEO-AEO-GEO-AUDIT-2026-06-21.md, docs/PRE-LAUNCH-AUDIT-2026-08-15.md,
   docs/SECURITY-PHASE-2-AUDIT.md. Six audits, all superseded, none acted upon
   in a way that produced revenue. Findings that still matter belong in
   tasks/todo.md as tasks, not in a file describing findings.
5. docs/FOUNDER-ACTIONS-2026-07-04.md and docs/REPO-CLEANUP-2026-07-04.md. A
   previous cleanup plan that was written and not executed, which is itself the
   pattern this document exists to end.
6. docs/SEO_REMEDIATION_PLAN.md. docs/SEO-PLAN-2026.md survives.
7. docs/ALL MY DATA .md, docs/Untitled document.pdf. Unnamed and unowned.
8. docs/AI-Workflow-Resource-Audit.md, 32KB of tooling evaluation for a company
   with no customers.

## Tier four: keep, but stop adding

Three outreach packs already contain finished, ready to send messages:
docs/OUTREACH-PACK.md, docs/OUTREACH-HEALTHCARE.md, docs/EMAIL-SEQUENCES.md,
plus advisory/cold-outreach-batch-1.md and docs/OUTREACH-SOURCING-RUNBOOK.md.

Keep all of them and delete none. They are not the problem.

advisory/cold-outreach-batch-1.md was created 2026-04-19 with a stated target
of "30 emails sent by 2026-04-24," and there is no record in the repository of
any being sent. The material was never the constraint. Writing a sixth outreach
document is forbidden by 06-THE-LOOP.md; sending from the five that exist is
the entire job.

## Tier five: what must never be deleted

Listed explicitly so that a future cleanup does not overreach.

1. CLAUDE.md at the repository root. Single source of truth.
2. tasks/todo.md and tasks/lessons.md. Live working state.
3. docs/RUNBOOK-MONEY-PATH.md. The money path failure map, and the reference
   behind the Stripe Rescue package in the cash lane.
4. docs/gtm/MSP-CHANNEL-RESEARCH.md. The most honest document in the
   repository, and the one that produced the correction in 04-ASSET-90-DAYS.md.
5. lib/pricing/plans.ts, lib/compliance/cmmc-status.ts, lib/market/netskope.ts
   and their guard tests. Canonical facts with tests attached.
6. This folder.
7. All application and proxy code. No code is touched by any of this.

## Counting the result

Deleting tiers two and three removes 32 files and roughly 400,000 characters of
superseded strategy from the docs directory, leaving the operating documents,
the runbooks, the surviving research, and this folder.

The measure of whether it worked is not the file count. It is whether the next
quiet Tuesday gets spent revising a roadmap or sending twenty emails. Removing
the roadmap is how that question gets answered in advance.
