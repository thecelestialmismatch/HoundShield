#!/usr/bin/env node
/**
 * Regenerate the README screenshots from a REAL production build.
 *
 * Why a production build and not `next dev`: this app sets `output: standalone`,
 * and the two servers do not render identically. `next start` against a
 * standalone build fails outright, and `next dev` hides production-only client
 * errors. Shooting the wrong server produces screenshots that do not match what
 * a visitor sees.
 *
 * Usage:
 *   cd compliance-firewall-agent
 *   npm run build
 *   cp -r .next/static .next/standalone/compliance-firewall-agent/.next/static
 *   cp -r public        .next/standalone/compliance-firewall-agent/public
 *   (cd .next/standalone/compliance-firewall-agent && PORT=3212 node server.js) &
 *   node ../scripts/capture-screenshots.mjs
 *
 * Requires `playwright-core` and the preinstalled Chromium at
 * PLAYWRIGHT_BROWSERS_PATH (/opt/pw-browsers). Never run `playwright install`.
 *
 * NOTE: pages that depend on Supabase env vars (the /partner portal) render an
 * error boundary without them. This script SKIPS any page that comes back as an
 * error boundary rather than committing a screenshot of a crash — the check is
 * the point, so do not remove it.
 */
import { chromium } from "playwright-core";
import { mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3212";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "docs", "assets", "screenshots");
mkdirSync(OUT, { recursive: true });

const browsersRoot = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
const chromiumDir = readdirSync(browsersRoot).find((d) => d.startsWith("chromium-"));
if (!chromiumDir) throw new Error(`no chromium found under ${browsersRoot}`);
const executablePath = join(browsersRoot, chromiumDir, "chrome-linux", "chrome");

/** Public pages only — nothing behind auth, nothing needing seeded data. */
const PAGES = [
  ["pricing", "/pricing"],
  ["security", "/security"],
  ["how-it-works", "/how-it-works"],
  ["partners", "/partners"],
  ["cookies", "/cookies"],
];

const browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const skipped = [];

const isErrorBoundary = async () =>
  /Something went wrong/i.test(await page.innerText("body").catch(() => ""));

// First visit shows the consent gate, before any choice is stored.
await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: join(OUT, "cookie-consent.png") });

// Decline analytics, as a privacy-conscious visitor would, then shoot the hero.
const essential = page.getByRole("button", { name: /accept essential/i });
if (await essential.count()) {
  await essential.first().click();
  await page.waitForTimeout(1500);
}
await page.screenshot({ path: join(OUT, "home.png") });

for (const [name, path] of PAGES) {
  const res = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(2000);
  if (res.status() !== 200 || (await isErrorBoundary())) {
    skipped.push(`${path} (status ${res.status()})`);
    continue;
  }
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  console.log(`captured ${name}.png`);
}

await browser.close();

if (skipped.length) {
  console.error(`\nSKIPPED (did not render): ${skipped.join(", ")}`);
  process.exitCode = 1;
}
