/**
 * Scanner latency benchmark — proves the "<10ms local scan" claim with a
 * reproducible artifact instead of a marketing sentence.
 *
 * Runs the real pattern scanner (scanString) over a corpus of realistic
 * prompts — clean traffic, CUI-laden traffic, and long documents — with the
 * cache defeated (every input unique), and asserts the p99 cold-scan latency
 * stays under the 10ms budget. Exits non-zero on breach, so CI fails when a
 * pattern change regresses the latency contract.
 *
 *   npm run bench          (from proxy/)
 */

import { scanString, clearScanCache } from "../scanner";

const ITERATIONS = 2000;
const WARMUP = 200;
const P99_BUDGET_MS = 10;

// Realistic prompt shapes. A unique suffix defeats the scan cache so every
// iteration measures a genuine cold scan.
const TEMPLATES: string[] = [
  // Clean, typical assistant traffic
  "Summarize the following meeting notes and produce three action items for the team: we discussed the Q3 roadmap, hiring plans for two engineers, and the marketing site refresh.",
  // Code-assistant traffic
  "Write a TypeScript function that parses a CSV file, validates each row against a Zod schema, and returns the failed rows with human-readable error messages.",
  // CUI-laden — should trip detection engines (worst-case pattern work)
  "Summarize our CAGE code 1ABC2 contract W15QKN-26-C-0021 for the Navy, including the ITAR-controlled propulsion specifications and the SSN 123-45-6789 of the program lead.",
  // PHI-laden
  "Draft a discharge letter for patient John Q. Sample, MRN 8675309, DOB 04/12/1961, diagnosed with type 2 diabetes (ICD-10 E11.9), insured under member ID XQV-448-2291.",
  // Long-document worst case (~8 KB of mixed text)
  ("The contractor shall deliver the technical data package in accordance with DFARS 252.204-7012 and safeguard all covered defense information. " +
    "Program milestones, procurement-sensitive pricing, and personnel rosters are enclosed. ").repeat(40),
];

function percentile(sorted: number[], p: number): number {
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

function run(): void {
  // Warmup: JIT the regex engines and pattern set.
  for (let i = 0; i < WARMUP; i++) {
    scanString(`${TEMPLATES[i % TEMPLATES.length]} [warmup ${i}]`);
  }
  clearScanCache();

  const samples: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const input = `${TEMPLATES[i % TEMPLATES.length]} [iteration ${i}]`;
    const start = process.hrtime.bigint();
    scanString(input);
    const end = process.hrtime.bigint();
    samples.push(Number(end - start) / 1e6); // ns -> ms
    if (samples.length % 500 === 0) clearScanCache(); // keep memory flat
  }

  samples.sort((a, b) => a - b);
  const p50 = percentile(samples, 50);
  const p95 = percentile(samples, 95);
  const p99 = percentile(samples, 99);
  const max = samples[samples.length - 1];
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;

  console.log("HoundShield scanner latency benchmark");
  console.log("=====================================");
  console.log(`iterations : ${ITERATIONS} cold scans (cache defeated)`);
  console.log(`mean       : ${mean.toFixed(3)} ms`);
  console.log(`p50        : ${p50.toFixed(3)} ms`);
  console.log(`p95        : ${p95.toFixed(3)} ms`);
  console.log(`p99        : ${p99.toFixed(3)} ms  (budget: ${P99_BUDGET_MS} ms)`);
  console.log(`max        : ${max.toFixed(3)} ms`);

  if (p99 > P99_BUDGET_MS) {
    console.error(
      `\nFAIL — p99 cold-scan latency ${p99.toFixed(3)} ms exceeds the ${P99_BUDGET_MS} ms budget.` +
        "\nA pattern or scanner change has regressed the product's core latency claim."
    );
    process.exit(1);
  }
  console.log(`\nPASS — p99 within the ${P99_BUDGET_MS} ms budget.`);
}

run();
