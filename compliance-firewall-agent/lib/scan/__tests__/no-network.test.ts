import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

/* ──────────────────────────────────────────────────────────────────
 * The local-only boundary, enforced by walking the import graph.
 *
 * "Your prompt never leaves your device" is the product's central claim, and
 * the way it breaks is not a dramatic rewrite — it is one convenient import,
 * added months from now by someone improving detection, that quietly pulls a
 * cloud classifier into the browser bundle. That is exactly how the dashboard
 * scanner this feature replaced came to POST customer text to Bytez and Gemini.
 *
 * So the assertion is structural rather than behavioural: from the scan engine,
 * follow every local import transitively, and fail if the graph reaches a
 * module that performs I/O. A behavioural test would only cover the paths it
 * happened to exercise.
 * ────────────────────────────────────────────────────────────────── */

const APP = join(__dirname, "..", "..", "..");
const ENGINE = join(APP, "lib", "scan", "local-engine.ts");

/** Modules that reach the network. Reaching ANY of them from the engine is a bug. */
const NETWORK_MODULES = [
  "lib/classifier/gemini-scanner",
  "lib/classifier/ai-classifier",
  "lib/classifier/risk-engine",
  "lib/classifier/cloud-assist",
  "lib/reports/risk-engine",
  "lib/supabase/client",
  "lib/supabase/server",
];

/** Resolve a `@/`-aliased or relative import to a real file on disk. */
function resolveImport(spec: string, fromFile: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = join(APP, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(fromFile), spec);
  else return null; // bare package — not our source
  for (const cand of [`${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx"), base]) {
    if (existsSync(cand) && !cand.endsWith("/")) {
      try {
        if (readFileSync(cand, "utf8")) return cand;
      } catch { /* directory — keep looking */ }
    }
  }
  return null;
}

function importsOf(file: string): string[] {
  const src = readFileSync(file, "utf8");
  const specs: string[] = [];
  // static `from "x"` plus dynamic `import("x")`
  for (const m of src.matchAll(/from\s+["']([^"']+)["']/g)) specs.push(m[1]);
  for (const m of src.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)) specs.push(m[1]);
  return specs;
}

/** Transitive closure of local files reachable from `entry`. */
function importGraph(entry: string): { files: Set<string>; specs: Set<string> } {
  const files = new Set<string>();
  const specs = new Set<string>();
  const queue = [entry];
  while (queue.length) {
    const file = queue.pop() as string;
    if (files.has(file)) continue;
    files.add(file);
    for (const spec of importsOf(file)) {
      specs.add(spec);
      const target = resolveImport(spec, file);
      if (target && !files.has(target)) queue.push(target);
    }
  }
  return { files, specs };
}

describe("the local scan engine cannot reach the network", () => {
  const graph = importGraph(ENGINE);

  it("walks a real graph — this guard is not silently inert", () => {
    // If resolution broke, `files` would be just the entry and the test below
    // would pass while checking nothing.
    expect(graph.files.size).toBeGreaterThan(3);
  });

  it("imports no module that performs I/O", () => {
    const reached = [...graph.specs].filter((s) =>
      NETWORK_MODULES.some((n) => s.includes(n.replace("lib/", ""))
        && (s.startsWith("@/lib") || s.startsWith("."))),
    );
    expect(
      reached,
      `the engine's import graph reaches network module(s): ${reached.join(", ")}. ` +
        `The pasted text must never be reachable from an I/O path.`,
    ).toEqual([]);
  });

  it("contains no outbound call in any file it reaches", () => {
    const offenders: string[] = [];
    for (const file of graph.files) {
      const src = readFileSync(file, "utf8")
        // strip comments so prose ABOUT fetch does not trip the check — the
        // engine's own docblock explains the boundary in these words.
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
      if (/\bfetch\s*\(|XMLHttpRequest|sendBeacon|new WebSocket|axios/.test(src)) {
        offenders.push(file.replace(`${APP}/`, ""));
      }
    }
    expect(
      offenders,
      `outbound-capable call found in the engine graph: ${offenders.join(", ")}`,
    ).toEqual([]);
  });
});

describe("the scan UI does not import a cloud classifier", () => {
  const dir = join(APP, "components", "scan");
  const files = readdirSync(dir).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));

  it("has files to check", () => {
    expect(files.length).toBeGreaterThan(3);
  });

  it.each(files)("%s imports no network module", (name) => {
    const specs = importsOf(join(dir, name));
    const bad = specs.filter((s) => NETWORK_MODULES.some((n) => s.includes(n.replace("lib/", ""))));
    expect(bad, `${name} imports ${bad.join(", ")}`).toEqual([]);
  });

  it("never posts the pasted text anywhere", () => {
    // The ONE endpoint the panel may call is the counts-only lead capture, and
    // it is reached through LeadCapture, which has its own strict-schema guard.
    for (const name of files) {
      const src = readFileSync(join(dir, name), "utf8");
      expect(src, `${name} must not reference /api/scan`).not.toContain("/api/scan");
    }
  });
});
