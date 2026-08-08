import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import path from 'node:path'

/**
 * No source file the app imports may be invisible to git.
 *
 * This is the check that would have caught the 2026-08-07 red CI in one second
 * instead of one push.
 *
 * `.gitignore` carried an unanchored `brain/`, written to exclude a 47MB local
 * archive at the repository root. An unanchored pattern matches a directory of
 * that name at ANY depth, so it also swallowed
 * `compliance-firewall-agent/components/brain/` — a real source directory. It
 * went unnoticed for as long as it did because the one file already in there was
 * tracked before the rule landed, and git keeps tracking what it already tracks.
 *
 * The next file added there was ignored silently. Nothing warned. `tsc`, the test
 * suite and `npm run build` all passed locally, because the file was on disk;
 * CI checked out a repository that did not contain it and died with TS2307 on a
 * module that did not exist.
 *
 * That failure mode — green locally, broken in CI, on a file you can see in your
 * editor — is worth a permanent guard. It generalises: any future ignore rule
 * that shadows a source path fails here.
 */

const CFA = path.resolve(__dirname, '../..')
const REPO = path.resolve(CFA, '..')

/** Directories whose contents ship as part of the app. */
const SOURCE_DIRS = ['app', 'components', 'lib', 'hooks', 'scripts', 'test', 'proxy']

/**
 * Path segments that are generated, never authored. Anything under one of
 * these is ignored on purpose in every package, and is not "hidden source".
 */
const ARTIFACT_DIRS = ['node_modules', 'dist', '.next', 'build', 'coverage', 'out']

function ignoredSourceFiles(): string[] {
  // `--others --ignored --exclude-standard` lists exactly the files git is
  // hiding: untracked AND matched by an ignore rule. Tracked files never appear,
  // which is the point — a tracked file inside an ignored directory still works
  // and is not what broke.
  const out = execFileSync(
    'git',
    ['ls-files', '--others', '--ignored', '--exclude-standard'],
    { cwd: REPO, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  )

  return out
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((file) => /\.(ts|tsx|js|jsx|mjs|cjs|css)$/.test(file))
    .filter((file) => {
      // Dependencies and build output are ignored deliberately and must stay
      // that way. This has to run FIRST, ahead of the proxy short-circuit
      // below, and it has to cover artifacts from EVERY package rather than
      // just the app's .next — the check previously did neither.
      //
      // The consequence was that the guard only held while the proxy happened
      // to be neither installed nor built. `cd proxy && npm ci` and
      // `npm run build` are both steps in our own CI and quickstart, so
      // following the documentation turned this suite red with hundreds of
      // phantom "hidden source files". A guard that fails when you do the
      // documented thing is one people learn to skip — which defeats the
      // real bug it exists to catch.
      if (ARTIFACT_DIRS.some((dir) => file.split('/').includes(dir))) return false

      const rel = path.relative('compliance-firewall-agent', file)
      // Only the app's own source trees, plus the proxy package.
      if (file.startsWith('proxy/')) return true
      if (rel.startsWith('..')) return false
      return SOURCE_DIRS.some((dir) => rel === dir || rel.startsWith(`${dir}/`))
    })
}

describe('no source file is hidden from git', () => {
  it('finds nothing in the app source tree that git is ignoring', () => {
    const hidden = ignoredSourceFiles()

    expect(
      hidden,
      'these files exist on disk and would NOT be committed — every local gate ' +
        'passes and CI fails on a module that is not in the repository. Check ' +
        '.gitignore for an unanchored pattern (`foo/` matches at any depth; ' +
        `\`/foo/\` matches only the root):\n${hidden.join('\n')}`,
    ).toEqual([])
  })

  it('still hides the things that are meant to be hidden', () => {
    // Anchoring the rule must not have opened the archive or the decks back up.
    // A guard that passes because the ignore file stopped working is worthless.
    const check = (p: string) => {
      try {
        execFileSync('git', ['check-ignore', '-q', p], { cwd: REPO })
        return true
      } catch {
        return false
      }
    }

    expect(check('brain/anything.md'), 'the root brain/ archive must stay ignored').toBe(true)
    expect(check('docs/decks/x/deck.pptx'), 'pitch decks must stay ignored').toBe(true)
    expect(
      check('compliance-firewall-agent/components/brain/AnswerText.tsx'),
      'components/brain/ is real source and must NOT be ignored',
    ).toBe(false)
  })
})
