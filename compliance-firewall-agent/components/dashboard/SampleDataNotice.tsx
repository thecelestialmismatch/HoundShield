import { FlaskConical } from 'lucide-react'
import { KIND_META } from './dataProvenance'

/**
 * "What you are looking at is not your data."
 *
 * Three pages a signed-in customer can actually reach render hardcoded datasets
 * and issue no request at all: `/command-center/team` (`team-view`),
 * `/command-center/tasks` (`tasks-board`) and `/command-center/agents` (the
 * page's own `AGENTS`/`EDGES` constants). They show invented colleagues,
 * invented remediation work and an invented agent topology, presented exactly
 * like the real panels next door. On a product sold as C3PAO audit evidence
 * that is the same defect as the seeded overview charts deleted on 2026-07-29:
 * not a cosmetic problem, a credibility one.
 *
 * Reachability was traced rather than assumed, and it matters: seven other
 * mockup components (`content-pipeline`, `calendar-view`, `agent-builder`,
 * `agent-workspace`, `memory-view`, `knowledge-base`, `execution-trace`) are
 * mounted by no page at all, and `pipeline`, `workspace` and `knowledge` are
 * bare redirects to `/command-center`. Labelling those would have been
 * decorating dead code.
 *
 * The honest fix for a mockup is to say so. Building real backends for agent
 * simulation, content pipelines and calendars is building products that do not
 * exist yet, and faking them harder is not an option — so the surfaces stay,
 * clearly marked, until they are real.
 *
 * The wording is NOT written here. It comes from `KIND_META.simulated`, the same
 * copy the provenance dialog shows for a simulated metric, so the product says
 * one thing about sample data in one voice. Extending that vocabulary rather
 * than inventing a second one is the whole point.
 *
 * `app/__tests__/tools-sample-data-guard.test.ts` fails if a page renders a
 * hardcoded dataset without either a real fetch or this notice, so the next
 * mockup cannot land unlabelled.
 */
export function SampleDataNotice({
  surface,
  className = '',
}: {
  /** What this page shows, in the operator's words: "team roster", "task board". */
  surface: string
  className?: string
}) {
  return (
    <div
      role="note"
      aria-label="Sample data notice"
      className={`mb-5 flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 ${className}`}
    >
      <FlaskConical
        className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400"
        aria-hidden="true"
      />
      <p className="text-sm leading-relaxed text-[var(--hs-ink-secondary)]">
        <span className="font-semibold text-amber-400">
          {KIND_META.simulated.label}
        </span>{' '}
        — this {surface} is a preview of an upcoming feature, populated with
        example content. It is not read from your account and nothing here
        affects your gateway, your audit log or your SPRS score.
      </p>
    </div>
  )
}
