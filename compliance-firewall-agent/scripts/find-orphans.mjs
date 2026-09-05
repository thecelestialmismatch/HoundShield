#!/usr/bin/env node
/**
 * Report source files that nothing imports.
 *
 * Run from `compliance-firewall-agent/`:  node scripts/find-orphans.mjs
 *
 * ─── Why this is a script and not a one-off ────────────────────────────────
 *
 * The 2026-09-02 cleanup removed 29 files and 9 runtime dependencies that
 * nothing referenced. Finding them by hand took three passes, and the first two
 * were WRONG in ways worth encoding:
 *
 *   1. Barrels. `@/components/scroll-effects` resolves to
 *      `scroll-effects/index.ts`, so matching only the full path called every
 *      barrel in the repo dead.
 *   2. Side-effect imports. `lib/agent/tools/index.ts` registers eight tools
 *      with bare `import './web-search';` — no `from`. A regex requiring `from`
 *      declared all eight dead. They are load-bearing.
 *   3. Dynamic imports. `PlatformDashboardClient` reaches PlatformDashboard
 *      through `dynamic(() => import('./PlatformDashboard'))`.
 *
 * All three are handled below. One class deliberately is NOT, and the tool
 * cannot fix it: reachability from outside the scanned roots. `server.ts` at the
 * app root imports `lib/gateway/ws-handler.ts`, which this script does not scan,
 * so ws-handler appeared dead and was staged for deletion. `tsc` caught it.
 *
 * THE RULE THAT FOLLOWS FROM THAT: this script proposes, the compiler disposes.
 * Never delete from its output alone. Delete, then run `npx tsc --noEmit`,
 * the test suite and `npm run build` — those three see reachability this
 * script cannot, and they are what actually establishes a file is dead.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, basename, dirname } from "node:path";
const ROOT = process.cwd();
function walk(dir, acc = []) {
  let es; try { es = readdirSync(dir) } catch { return acc }
  for (const e of es) {
    if (e === "node_modules" || e.startsWith(".")) continue;
    const f = join(dir, e);
    if (statSync(f).isDirectory()) walk(f, acc); else if (/\.(ts|tsx)$/.test(e)) acc.push(f);
  }
  return acc;
}
const all = ["app","components","lib","hooks"].flatMap(d => walk(join(ROOT,d)));
const isTest = f => f.includes("__tests__") || f.includes(".test.");
const text = new Map(all.map(f => [f, readFileSync(f,"utf8")]));
const ENTRY = /(^|\/)(page|layout|route|loading|error|not-found|template|default|sitemap|robots|manifest|opengraph-image|icon|middleware|instrumentation)\.(ts|tsx)$/;

/**
 * Every specifier that can resolve to `file`, matched against ANY import form:
 *   import x from "spec"      import "spec"      await import("spec")
 *   require("spec")           export * from "spec"
 */
function isImported(file) {
  const rel = relative(ROOT, file).replace(/\.(tsx|ts)$/, "");
  const aliases = new Set(["@/" + rel]);
  if (basename(rel) === "index") aliases.add("@/" + dirname(rel));
  const base = basename(rel);
  const parent = basename(dirname(rel));
  const names = base === "index" ? [base, parent] : [base];
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // any quoted specifier whose final segment matches, in any import/require form
  const relRe = new RegExp(`["'][^"']*?(?:^|/)(?:${names.map(esc).join("|")})(?:\\.js)?["']`);
  const hits = [];
  for (const g of all) {
    if (g === file) continue;
    const t = text.get(g);
    if ([...aliases].some(a => t.includes(`"${a}"`) || t.includes(`'${a}'`))) { hits.push(g); continue; }
    // only count a relative match when the importer could actually resolve it
    if (relRe.test(t) && (dirname(g) === dirname(file) || dirname(file).startsWith(dirname(g)) || dirname(g).startsWith(dirname(file)))) hits.push(g);
  }
  return hits;
}
const orphan = [], testOnly = [];
for (const f of all) {
  if (isTest(f) || ENTRY.test(relative(ROOT,f))) continue;
  const imp = isImported(f);
  if (imp.filter(g => !isTest(g)).length === 0) (imp.length ? testOnly : orphan).push(relative(ROOT,f));
}
const size = f => statSync(join(ROOT,f)).size;
const fmt = a => a.map(f=>[f,size(f)]).sort((x,y)=>y[1]-x[1]);
for (const [label, arr] of [["NO IMPORTER AT ALL", orphan], ["IMPORTED ONLY BY TESTS", testOnly]]) {
  console.log(`\n=== ${label} (${arr.length}) ===`);
  let t=0; for (const [f,s] of fmt(arr)) { t+=s; console.log(`${String(Math.round(s/1024)).padStart(4)}K  ${f}`); }
  console.log(`TOTAL ${Math.round(t/1024)}K`);
}
