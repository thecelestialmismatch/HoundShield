# Instant AI Risk Snapshot — the self-serve /demo climax

> Ships: 2026-07-18. Surface: `/demo#snapshot` (top of the demo page).
> Component: `components/InstantSnapshot.tsx`. Doc owner: whoever last touched
> `lib/reports/`.

## What it is (one paragraph)

A prospect pastes a real prompt into `/demo#snapshot`, and **in their own
browser** HoundShield's actual detection engines scan it, map every hit to a
NIST 800-171 control, show the exposure on screen, and generate a **branded
preview gap-report PDF** — then a `$499` CTA and an opt-in "email me + a human
review" form. The pasted text never leaves the device. This fixes the one thing
the demo script mandates and the page never delivered: *"the demo ALWAYS ends
with the PDF on screen."* Now every visitor can reach that ending themselves.

## Why it exists (the money-path case)

- The lead product is the **$499 one-time CMMC AI Risk Assessment Report**. The
  fastest way to sell a report is to let the buyer *see their own risk* first.
- Payments are blocked founder-side (`payments: malformed_key`), so the only
  allowed work is "fixing checkout or **selling**." A self-serve funnel that
  turns a cold visitor into a warm, counts-only lead routed to the founder is
  selling — top of funnel, zero founder time.
- It is a **live demonstration of the core moat**: "nothing leaves your
  network." The scan and the PDF are computed client-side. We prove the claim by
  doing it, not by asserting it.

## The privacy boundary (non-negotiable)

The pasted text and every matched substring stay on the device. Two independent
layers enforce it:

1. **On screen + in the PDF, findings carry the pattern NAME and classification
   only** — never the matched string. `blockEventFromFinding()`
   (`lib/reports/category-nist-map.ts`) copies `patternName`, `category`,
   `risk`, `action` and *nothing else*. Browser-verified: with a paste
   containing `SSN 123-45-6789` / `AKIA…` / `CAGE 1ABC2`, the rendered findings
   region contains none of those raw values.
2. **The lead endpoint accepts COUNTS ONLY.** `POST /api/report/snapshot-lead`
   validates with a **`.strict()`** zod schema whose only numeric fields are
   `criticalCount / highCount / mediumCount / totalMatches / promptsScanned`
   (+ name/email/company/vertical/controls). There is deliberately **no field
   for prompt text** — any attempt to smuggle one is a 400, not a silent
   forward. The client body-builder also sends counts only.

Cloud scanners (`lib/reports/risk-engine.ts`, `gemini-scanner.ts`) are
**never imported** into this path — importing one would pull a network call into
the browser bundle and break the boundary. Only the pure-regex engines are used.

## Snapshot vs. the signed report (honesty, per the #205 doctrine)

A browser preview is **not** the tamper-evident deliverable an assessor accepts.
The PDF renderer is honest about which artifact it is via a single flag.

`ReportData.snapshot === true` makes `buildComplianceDoc()`
(`lib/reports/pdf-generator.ts`) strip every claim the preview cannot back:

| Signed 14-day report (`snapshot` absent / `demo`) | Snapshot preview (`snapshot: true`) |
|---|---|
| SHA-256 Merkle audit chain | "No cryptographic audit chain — local browser preview" |
| Tamper-evident / C3PAO-ready evidence | red **PREVIEW SNAPSHOT** band; "not tamper-evident" footer |
| `SPRS score` figure | "Estimated SPRS exposure" (block-event sum only) |
| Audit-trail attestation | "How this preview was generated … never transmitted to any server" |

The on-screen CTA says it in plain English too: *"This is a preview, not the
tamper-evident 14-day signed report an assessor accepts."*

## Architecture / data flow

```
components/InstantSnapshot.tsx  ("use client")
  paste ──▶ scanForSnapshot(text)                lib/reports/snapshot-from-scan.ts
             └ LOCAL_ENGINES = BUILTIN + CMMC + HIPAA patterns  (pure regex, no net)
        ──▶ summarizeFindings()  → on-screen severity + controls + est. SPRS
        ──▶ buildSnapshotReportData(text,{organization,scanMs})  → ReportData{snapshot:true}
        ──▶ (on click) import("@/lib/reports/download")           ← jsPDF lazy-loaded
             └ saveComplianceReport(data,"HoundShield-AI-Risk-Snapshot.pdf")
                └ buildComplianceDoc(data).save(...)              lib/reports/pdf-generator.ts
  opt-in ──▶ POST /api/report/snapshot-lead   (COUNTS ONLY, .strict schema)
             └ Resend: founder alert + requester confirmation; 503+fallback if unconfigured
```

### Files

| File | Role |
|---|---|
| `components/InstantSnapshot.tsx` | Hero component + inline `LeadCapture`. `id="snapshot"`, textarea `id="snapshot-input"`. |
| `lib/reports/snapshot-from-scan.ts` | `scanForSnapshot`, `splitPrompts`, `buildSnapshotReportData`, `summarizeFindings`. Combines the 3 local engines. |
| `lib/reports/category-nist-map.ts` | `CATEGORY_NIST_MAP` (category → control), `CATEGORY_LABEL`, `sprsImpactForRisk`, `isDcsaReportable`, `blockEventFromFinding` (name-only). |
| `lib/reports/download.ts` | `saveComplianceReport()` — browser save via `buildComplianceDoc().save()`. |
| `lib/reports/pdf-generator.ts` | `buildComplianceDoc()` branches on `data.snapshot`; `generateCompliancePDF()` unchanged (server Buffer). |
| `app/api/report/snapshot-lead/route.ts` | Counts-only lead capture, `.strict()` schema, Resend, 503-with-fallback. |
| `app/demo/page.tsx` | Mounts `<InstantSnapshot/>` above the existing scanner. |

### Category → NIST 800-171 map

| Category | Control | Label |
|---|---|---|
| IP | SC.L2-3.13.1 | CUI / IP |
| HIPAA_PHI | AC.L2-3.1.3 | PHI |
| PII | AC.L2-3.1.1 | PII |
| FINANCIAL | AU.L2-3.3.1 | Financial |
| STRATEGIC | SC.L2-3.13.8 | Strategic |

Estimated SPRS impact per finding: CRITICAL −5, HIGH −3, MEDIUM −1, else 0.

## Performance

`jsPDF` (~130 kB) is loaded **on demand** via dynamic `import()` inside
`generatePdf()` — only when a visitor actually clicks generate. That keeps the
top-of-funnel `/demo` route light: First Load JS `190 kB` (vs `332 kB` if jsPDF
were static). The scan itself is synchronous regex, measured with
`performance.now()` and surfaced as the "Local scan Xms" stat (a live proof of
the <10 ms local-scan claim — observed ~8 ms on the example).

## Tests (all green — 1313 total at ship)

| Suite | Guards |
|---|---|
| `lib/reports/__tests__/category-nist-map.test.ts` | map completeness, name-only block events, SPRS/DCSA rules |
| `lib/reports/__tests__/snapshot-from-scan.test.ts` | scan counts/dedupe/sort, segment split, `snapshot:true` + `demo:false`, no `sprs_score`, internal consistency (BLOCKED+QUARANTINED = violations) |
| `lib/reports/__tests__/pdf-generator.test.ts` | `SIGNED_ONLY_CLAIMS` absent in snapshot / present in signed; `SNAPSHOT_CLAIMS` present in snapshot |
| `components/__tests__/InstantSnapshot.test.tsx` | local-only copy, findings show control not raw substrings, generate calls downloader with `snapshot:true`, lead posts counts-only (no `inputText`, no raw strings) |
| `app/api/report/snapshot-lead/__tests__/route.test.ts` | strict schema rejects `inputText`, 503+fallback when Resend unconfigured, counts-only emails, `FOUNDER_EMAIL` routing |

## Live browser verification (2026-07-18, dev server)

Type prompt → **Scan locally** (8 ms) → findings render: 4 critical, mapped to
3 NIST controls (SC.L2-3.13.1, AC.L2-3.1.3, AC.L2-3.1.1), −20 est. SPRS →
findings region leaks **no** raw SSN/key/CAGE (pattern names only) →
**Generate my gap-report PDF** → "generated on this device" confirm, PDF built →
`$499` CTA + counts-only lead form present. Zero console errors throughout.

## Gotchas / notes

- **Sandbox input quirk:** the in-app browser's synthetic input-event dispatch
  and cold-hydration `computer type` can leave a React controlled `<textarea>`
  at value 0 (state doesn't update). Real keystrokes after warm hydration work.
  Verify by real input, not JS-set values — same class of gotcha logged for the
  FAQ deep-link scroll. Only ONE `#snapshot-input` exists (no streaming-buffer
  duplicate here), but the demo page also has the legacy scanner's textarea.
- The snapshot **omits `sprs_score`** on purpose — a one-paste preview measures
  nothing over time; the block-event sum is labelled "estimated exposure."
- `demo: false` on snapshot data keeps it distinct from the sample/demo report,
  which retains full attestation.
