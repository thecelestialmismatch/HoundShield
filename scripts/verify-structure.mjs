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
import { existsSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

/** [path, kind, why] — kind: 'dir' | 'file' */
const REQUIRED = [
  // 🟢 the product (must never go missing)
  ['compliance-firewall-agent', 'dir', 'The Next.js app (Vercel builds this)'],
  ['proxy', 'dir', 'HTTPS intercept proxy (Mode B)'],
  ['vercel.json', 'file', 'Vercel deploy config'],

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

  // 🗂️ holding folders (the three buckets)
  ['OldVersions', 'dir', 'Superseded / stray copies (kept)'],
  ['OldVersions/README.md', 'file', 'OldVersions manifest'],
  ['FutureUse', 'dir', 'Parked-for-later material'],
  ['FutureUse/README.md', 'file', 'FutureUse manifest'],
  ['FutureApp', 'dir', 'Future app surfaces / launchers'],
  ['FutureApp/README.md', 'file', 'FutureApp manifest'],
  ['FutureApp/launch-app.sh', 'file', 'Portable app launcher'],

  // 📄 the map itself
  ['PROJECT-STRUCTURE.md', 'file', 'Top-level structure map + find index'],
]

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

console.log('HoundShield structure verification')
console.log('==================================')
console.log(lines.join('\n'))
console.log('----------------------------------')
console.log(`checked ${REQUIRED.length} paths · ${missing} missing · ${warnings} warning(s)`)

if (missing > 0) {
  console.error('\nFAIL — repo structure does not match PROJECT-STRUCTURE.md.')
  process.exit(1)
}
console.log('\nPASS — repo structure matches the documented layout.')
process.exit(0)
