"use client";

import { LocalScanPanel } from "@/components/scan/LocalScanPanel";

/**
 * Instant AI Risk Snapshot — the public `/demo` money-path climax.
 *
 * The engine, the findings UI and the proof panel now live in
 * `components/scan/` and are shared with the after-login
 * `/command-center/scanner`. This file keeps its name and its `#snapshot`
 * anchor because both are linked from the homepage, `/assessment`, the sitemap
 * and every outreach email — renaming it would break published URLs to save a
 * file.
 *
 * `commerce` is what distinguishes this surface: the demo must end on the PDF
 * and the $499 CTA. The dashboard mounts the same panel without it.
 */
export function InstantSnapshot() {
  return <LocalScanPanel theme="light" commerce surface="/demo#snapshot" />;
}
