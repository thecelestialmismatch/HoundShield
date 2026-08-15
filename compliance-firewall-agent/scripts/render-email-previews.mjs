/**
 * Render every outbound email to .html files so a human can LOOK at them.
 *
 * Written because the branded-shell change touched eleven send paths at once,
 * and "the tests pass" does not tell you whether the logo band actually renders
 * or the CTA sits under the fold. Output is gitignored scratch — open the files
 * in a browser, or point a screenshot tool at them.
 *
 * Usage:  node scripts/render-email-previews.mjs [outDir]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { register } from "node:module";
import { pathToFileURL } from "node:url";

// The templates use the "@/..." path alias, which node cannot resolve alone.
register(
  "data:text/javascript," +
    encodeURIComponent(`
      import { fileURLToPath, pathToFileURL } from "node:url";
      const ROOT = ${JSON.stringify(pathToFileURL(process.cwd()).href)} + "/";
      export function resolve(spec, ctx, next) {
        if (spec.startsWith("@/")) return next(ROOT + spec.slice(2), ctx);
        return next(spec, ctx);
      }
    `),
  import.meta.url
);

const outDir = process.argv[2] ?? join(process.cwd(), ".email-previews");
mkdirSync(outDir, { recursive: true });

const { contactReceivedEmail, CONTACT_TOPICS } = await import(
  "../lib/email/templates/contact-received.ts"
);
const { reportOrderEmail } = await import("../lib/email/templates/report-order.ts");
const { partnerWelcomeEmail } = await import("../lib/email/templates/partner-welcome.ts");
const { canceledEmail } = await import("../lib/email/templates/canceled.ts");
const { upgradeEmail } = await import("../lib/email/templates/upgrade.ts");

const SAMPLE_MESSAGE =
  "Hi — we're a 120-person clinic and our nurses keep pasting patient notes into ChatGPT. " +
  "Does this work without sending anything to your servers, and what does it cost?";

const pages = [];

for (const topic of CONTACT_TOPICS) {
  const slug = topic.toLowerCase().replace(/\s+/g, "-");
  pages.push([
    `contact-received--${slug}.html`,
    contactReceivedEmail.html("Dana Whitfield", topic, SAMPLE_MESSAGE),
    `Contact auto-reply — ${topic} — subject: ${contactReceivedEmail.subject(topic)}`,
  ]);
}

pages.push(["report-order.html", reportOrderEmail.html("Dana Whitfield"), "$499 order confirmation"]);
pages.push([
  "partner-welcome.html",
  partnerWelcomeEmail.html("Dana Whitfield", "Ridgeview Compliance"),
  "Partner application acknowledgement",
]);
pages.push(["canceled.html", canceledEmail.html("Ridgeview"), "Subscription canceled"]);
pages.push(["upgrade.html", upgradeEmail.html("Ridgeview", "pro"), "Upgrade receipt"]);

for (const [file, html, label] of pages) {
  writeFileSync(join(outDir, file), html);
  console.log(`${file.padEnd(38)} ${label}`);
}

const index = `<!DOCTYPE html><meta charset="utf-8"><title>Email previews</title>
<body style="font-family:system-ui;padding:40px;max-width:760px;margin:0 auto;">
<h1>HoundShield email previews</h1>
<ul>${pages.map(([f, , l]) => `<li><a href="${f}">${f}</a> — ${l}</li>`).join("")}</ul>`;
writeFileSync(join(outDir, "index.html"), index);
console.log(`\n${pages.length} previews -> ${outDir}`);
