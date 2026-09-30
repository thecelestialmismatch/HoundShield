#!/usr/bin/env node
/**
 * verify-structure.mjs — assert the HoundShield repo matches its documented layout.
 *
 * Zero dependencies (Node stdlib only). Run from anywhere in the repo:
 *
 *   node scripts/verify-structure.mjs
 *   npm run verify:structure        # if wired in root package.json
 *
 * Exit 0 = every documented path exists. Exit 1 = something is missing (CI-friendly).
 *
 * This is the test for the *structure* work (PROJECT-STRUCTURE.md, the canonical
 * .claude control folder, the holding folders, the AgentHarness bridges, the
 * dynamic-workflow template). It does NOT touch the Next.js app — Vercel's build
 * is the app gate.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

/** [path, kind, why] — kind: 'dir' | 'file' */
const REQUIRED = [
  // 🟢 the product (must never go missing)
  ['compliance-firewall-agent', 'dir', 'The Next.js app (Vercel builds this)'],
  ['proxy', 'dir', 'HTTPS intercept proxy (Mode B)'],
  // The repo-root vercel.json is deliberately GONE. It used the legacy
  // `builds`/`routes` keys, which put the deployment into the pre-framework
  // builder pipeline — middleware compiled into the output and was never
  // invoked. Vercel's Root Directory setting now points at the app directory
  // and does natively what that indirection was doing. Requiring the file here
  // would fail the repo the moment the fix lands, so it is required NOT to
  // exist. See docs/DEPLOYMENT-MIDDLEWARE.md.
  ['compliance-firewall-agent/vercel.json', 'file', 'Vercel config Vercel actually reads (crons)'],

  // 🧠 Claude Code control folder — canonical layout
  ['.claude', 'dir', 'Claude Code control folder'],
  ['.claude/README.md', 'file', 'Control-folder map'],
  ['.claude/settings.json', 'file', 'Permissions / hooks / model'],
  ['.claude/agents', 'dir', 'Active subagents'],
  ['.claude/skills', 'dir', 'On-demand skills'],
  ['.claude/commands', 'dir', 'Slash commands'],
  ['.claude/hooks', 'dir', 'Deterministic hooks'],
  ['.claude/rules', 'dir', 'Path-scoped rules'],
  ['.claude/output-styles', 'dir', 'Custom output styles'],
  ['.claude/plugins', 'dir', 'Plugin bundles'],
  ['.claude/workflows', 'dir', 'Dynamic workflows'],
  ['.claude/workflows/README.md', 'file', 'Workflows guide'],
  ['.claude/workflows/_template.dynamic-workflow.js', 'file', 'Reusable dynamic-workflow template'],

  // 📚 root meta libraries
  ['agents', 'dir', 'Subagent library (root)'],
  ['skills', 'dir', 'Skill library (root)'],
  ['commands', 'dir', 'Slash-command library (root)'],
  ['rules', 'dir', 'Rules library (root)'],

  // 🤖 AgentHarness (installed as submodule) + bridges
  ['.gitmodules', 'file', 'Declares the AgentHarness submodule'],
  ['tools/agent-harness', 'dir', 'AgentHarness submodule (run: git submodule update --init)'],
  ['tools/agent-harness-bridge', 'dir', 'HoundShield <-> AgentHarness mission glue'],
  ['agents/agentharness', 'dir', 'AgentHarness agent bridges'],
  ['agents/agentharness/README.md', 'file', 'AgentHarness bridge index'],
  ['agents/agentharness/apodex-react-researcher.md', 'file', 'Deep-research ReAct agent bridge'],
  ['agents/agentharness/apodex-react-researcher-keep5.md', 'file', 'Compacted-context variant'],
  ['agents/agentharness/apodex-gateway-benchmark.md', 'file', 'Gateway benchmark agent'],
  ['agents/agentharness/brain-smoke-eval.md', 'file', 'Brain AI regression agent'],

  // 🗂️ holding folders: OldVersions/, FutureUse/, and FutureApp/ were
  // intentionally removed in the PR #146 repo cleanup (−7,363 files); they are
  // no longer part of the required layout.

  // 📄 the map itself
  ['PROJECT-STRUCTURE.md', 'file', 'Top-level structure map + find index'],
]

/**
 * [path, why] — paths that must NOT exist.
 *
 * A structure guard that only checks for presence cannot protect a deletion.
 * The repo-root `vercel.json` was removed because its legacy `builds`/`routes`
 * keys silently disabled middleware for the whole deployment, and it is exactly
 * the kind of file someone re-adds in good faith ("the repo has no Vercel
 * config?"). Re-adding it while Root Directory points at the app directory
 * would break the build a second time, in a way that compiles and deploys
 * cleanly and only shows up as security controls quietly not running.
 */
const FORBIDDEN = [
  [
    'vercel.json',
    'Repo-root Vercel config must stay deleted — its legacy `builds`/`routes` keys ' +
      'stop middleware from ever being invoked. Vercel Root Directory = ' +
      'compliance-firewall-agent replaces it. See docs/DEPLOYMENT-MIDDLEWARE.md.',
  ],
]

/**
 * Every gitlink in the index must be a DECLARED submodule.
 *
 * A gitlink is a tree entry with mode 160000 — a pointer to a commit in another
 * repository. Git only knows how to fetch one if `.gitmodules` declares a URL
 * for its path. An undeclared gitlink is not inert: `git submodule foreach`,
 * which `actions/checkout` runs during post-job cleanup, exits 128 on it, so
 * every CI job in the repo ends with
 *
 *   fatal: No url found for submodule path '<path>' in .gitmodules
 *   ##[warning]The process '/usr/bin/git' failed with exit code 128
 *
 * and a `--recurse-submodules` clone fails outright. That is how the real one
 * got here: `.claude/worktrees/nostalgic-lamport-6568bb`, a local agent
 * worktree, was committed as a bare gitlink in #265 (219a8b3, 2026-08-07)
 * pointing at a commit that exists in no remote. It sat in every job log for a
 * month as a permanent red herring — the same "noise trains people to stop
 * reading the log" failure the npm-audit gate was fixed for on 2026-09-03.
 *
 * Undetermined is reported as a WARNING, not a failure, and says so: unlike the
 * security gate (where unknown must never read as clean), this script is a
 * layout linter that must still run from an unpacked tarball with no git.
 */
function checkGitlinks(root) {
  const out = []
  let stage
  try {
    stage = execFileSync('git', ['ls-files', '--stage'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch {
    return [{ level: 'warn', text: '  ⚠️  SKIPPED gitlink check — `git ls-files` unavailable here' }]
  }

  const gitlinks = stage
    .split('\n')
    .filter((l) => l.startsWith('160000 '))
    .map((l) => l.split('\t')[1])
    .filter(Boolean)

  const gitmodules = join(root, '.gitmodules')
  const declared = new Set(
    existsSync(gitmodules)
      ? readFileSync(gitmodules, 'utf8')
          .split('\n')
          .map((l) => l.match(/^\s*path\s*=\s*(.+?)\s*$/))
          .filter(Boolean)
          .map((m) => m[1])
      : [],
  )

  for (const path of gitlinks) {
    if (declared.has(path)) {
      out.push({ level: 'ok', text: `  ✅ ${path} gitlink declared in .gitmodules` })
    } else {
      out.push({
        level: 'fail',
        text:
          `  ❌ UNDECLARED gitlink ${path} — committed as mode 160000 with no .gitmodules ` +
          `entry. Breaks \`git submodule foreach\` (exit 128) in every checkout cleanup. ` +
          `Fix: git rm --cached ${path}`,
      })
    }
  }
  if (gitlinks.length === 0) out.push({ level: 'ok', text: '  ✅ no gitlinks in the index' })
  return out
}

let missing = 0
let warnings = 0
const lines = []

for (const [rel, kind, why] of REQUIRED) {
  const abs = join(ROOT, rel)
  if (!existsSync(abs)) {
    // The submodule dir can be present-but-empty before `git submodule update --init`.
    lines.push(`  ❌ MISSING  ${rel}  — ${why}`)
    missing++
    continue
  }
  const st = statSync(abs)
  const ok = kind === 'dir' ? st.isDirectory() : st.isFile()
  if (!ok) {
    lines.push(`  ❌ WRONGTYPE ${rel} (expected ${kind}) — ${why}`)
    missing++
    continue
  }
  // Soft check: submodule materialized?
  if (rel === 'tools/agent-harness') {
    const initialized = existsSync(join(abs, 'agent_harness'))
    if (!initialized) {
      lines.push(`  ⚠️  EMPTY   ${rel} — run: git submodule update --init --recursive ${rel}`)
      warnings++
      continue
    }
  }
  lines.push(`  ✅ ${rel}`)
}

for (const [rel, why] of FORBIDDEN) {
  if (existsSync(join(ROOT, rel))) {
    lines.push(`  ❌ FORBIDDEN ${rel}  — ${why}`)
    missing++
  } else {
    lines.push(`  ✅ ${rel} absent, as required`)
  }
}

const gitlinkResults = checkGitlinks(ROOT)
for (const r of gitlinkResults) {
  lines.push(r.text)
  if (r.level === 'fail') missing++
  else if (r.level === 'warn') warnings++
}

console.log('HoundShield structure verification')
console.log('==================================')
console.log(lines.join('\n'))
console.log('----------------------------------')
console.log(
  `checked ${REQUIRED.length + FORBIDDEN.length} paths + ${gitlinkResults.length} gitlink check(s)` +
    ` · ${missing} problem(s) · ${warnings} warning(s)`,
)

if (missing > 0) {
  console.error('\nFAIL — repo structure does not match PROJECT-STRUCTURE.md.')
  process.exit(1)
}
console.log('\nPASS — repo structure matches the documented layout.')
process.exit(0)
