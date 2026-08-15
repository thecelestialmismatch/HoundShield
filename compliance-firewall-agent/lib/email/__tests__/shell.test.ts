import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import {
  DEFAULT_TAGLINE,
  LOGO_URL,
  emailButton,
  emailFooter,
  emailHeader,
  emailShell,
  escapeHtml,
  manageNotificationsFooter,
} from "../shell";

const APP_ROOT = join(__dirname, "..", "..", "..");

describe("emailHeader — the brand mark", () => {
  it("embeds the logo as an absolute https URL", () => {
    const html = emailHeader();
    expect(html).toContain("<img");
    expect(html).toContain(LOGO_URL);
    expect(LOGO_URL).toMatch(/^https:\/\//);
  });

  it("serves the logo from a file that actually ships", () => {
    // A 404 in the header band is worse than no logo: it renders as a broken
    // image icon at the top of every buyer-facing message.
    const path = LOGO_URL.replace(/^https?:\/\/[^/]+/, "");
    expect(path).toBe("/logo.png");
    expect(readdirSync(join(APP_ROOT, "public"))).toContain("logo.png");
  });

  it("never lets the mark appear alone — the wordmark is live text, not baked into the image", () => {
    const html = emailHeader();
    // Founder rule. It also means an image-blocking client still reads the brand.
    expect(html).toContain(">HoundShield<");
    expect(html).toContain('alt="HoundShield"');
  });

  it("pins width and height so an unloaded image does not collapse the band", () => {
    const html = emailHeader();
    expect(html).toContain('width="44"');
    expect(html).toContain('height="44"');
  });

  it("puts the near-black mark on a light ground, where it is actually visible", () => {
    // Both brand assets are a near-black doberman shield. The band used to be
    // #0f172a, which rendered the mark as an invisible smudge — caught by
    // looking at a render, not by any assertion. If the dark band comes back,
    // the logo silently disappears again.
    const html = emailHeader();
    expect(html).toContain("background:#ffffff");
    expect(html).not.toContain("background:#0f172a");
  });

  it("uses the default tagline, or an override when given", () => {
    expect(emailHeader()).toContain(DEFAULT_TAGLINE);
    expect(emailHeader("Partner Program")).toContain("Partner Program");
    expect(emailHeader("Partner Program")).not.toContain(DEFAULT_TAGLINE);
  });
});

describe("escapeHtml", () => {
  it("escapes every character that can break out of an attribute or element", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
    );
    // The apostrophe is the one the old report-order copy missed.
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it("escapes the ampersand first, so escapes are not double-encoded", () => {
    expect(escapeHtml("a & <b>")).toBe("a &amp; &lt;b&gt;");
  });
});

describe("emailShell", () => {
  const html = emailShell({ bodyHtml: "<p>hello</p>" });

  it("produces a complete document with the body inside it", () => {
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
    expect(html).toContain("<p>hello</p>");
  });

  it("carries the header and, by default, the notifications footer", () => {
    expect(html).toContain(LOGO_URL);
    expect(html).toContain("Manage notifications");
  });

  it("lets a caller replace the footer — a stranger has no notifications to manage", () => {
    const plain = emailShell({ bodyHtml: "<p>hi</p>", footerHtml: emailFooter() });
    expect(plain).not.toContain("Manage notifications");
    expect(plain).toContain("www.houndshield.com");
  });
});

describe("emailButton", () => {
  it("renders an anchor with the given href and label", () => {
    const html = emailButton("https://example.com/x", "Go →");
    expect(html).toContain('href="https://example.com/x"');
    expect(html).toContain("Go →");
  });
});

describe("manageNotificationsFooter", () => {
  it("links to settings", () => {
    expect(manageNotificationsFooter()).toContain("/command-center/settings");
  });
});

describe("every template now uses the shared chrome", () => {
  const dir = join(__dirname, "..", "templates");
  const templates = readdirSync(dir).filter((f) => f.endsWith(".ts"));

  it("finds the templates (guards against an empty glob passing vacuously)", () => {
    expect(templates.length).toBeGreaterThanOrEqual(7);
  });

  it.each(templates)("%s renders the brand mark rather than a bare <h1>", (file) => {
    const src = readFileSync(join(dir, file), "utf8");
    // Either directly, or via emailShell — which renders the header itself.
    expect(src).toMatch(/emailHeader|emailShell/);
    // The hand-rolled band this replaced. If it comes back, the logo is gone
    // from that message and nothing else would notice.
    expect(src).not.toContain(
      `<h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">HoundShield</h1>`
    );
  });
});

describe("no email path points at the apex host", () => {
  // Vercel 308s apex -> www. #290 single-sourced 29 copies and missed the ones
  // living inside template literals in API routes; these are those files.
  const files = [
    "lib/email/outreach.ts",
    "app/api/report/snapshot-lead/route.ts",
    "lib/email/templates/contact-received.ts",
  ];

  it.each(files)("%s builds links from SITE_URL", (rel) => {
    const src = readFileSync(join(APP_ROOT, rel), "utf8");
    const withoutComments = src
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");
    expect(withoutComments).not.toMatch(/https:\/\/houndshield\.com/);
  });
});
