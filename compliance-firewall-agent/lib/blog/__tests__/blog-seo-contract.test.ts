import { describe, it, expect } from "vitest";
import { getAllPosts, getPostBySlug, getFeaturedPosts } from "../posts";
import { ANSWER_SLUGS } from "../../../app/answers/_answers";
import { COMPARISON_SLUGS } from "../../comparisons/competitors";
import { CONTROL_SLUGS } from "../../../app/controls/_meta";

/**
 * SEO contract for the blog corpus (mirrors the /compare and /answers guards):
 *  - structural integrity (unique slugs, snippet-sized metadata, valid dates),
 *  - the Tier-1 article set from the HERMES SEO priority list stays published,
 *  - editorial NEVER-DO guardrails (no fabricated metrics, no hosted-CUI-safe
 *    pairing, $499 report never undercut),
 *  - zero internal link rot: every href="/..." inside post content must
 *    resolve to a route this app actually serves.
 *
 * Limits note: frozen pre-2026-07-10 posts run up to 191-char descriptions;
 * the corpus-wide ceilings below accommodate them, while posts dated
 * 2026-07-10+ are held to the stricter documented limits (≤160 / ≤300).
 */

const TIER1_SLUGS = [
  "gcc-high-copilot-vs-third-party-ai-proxy-cmmc-cost",
  "chatgpt-and-hipaa-what-privacy-officers-need-to-know-2026",
  "employee-pasted-cui-into-chatgpt-incident-response-playbook",
  "nist-800-171-controls-that-map-to-ai-prompt-monitoring",
  "cmmc-ai-use-policy-template",
];

const STRICT_FROM = new Date("2026-07-10").getTime();

// Static public routes that post content may link to.
const STATIC_ROUTES = new Set([
  "/",
  "/features",
  "/pricing",
  "/assessment",
  "/hipaa",
  "/docs",
  "/demo",
  "/blog",
  "/answers",
  "/compare",
  "/partners",
  "/about",
  "/contact",
  "/security",
  "/how-it-works",
  "/roadmap",
  "/trust",
  "/controls",
  "/partners/kit",
]);

function isKnownInternalRoute(href: string): boolean {
  const path = href.split("#")[0].split("?")[0];
  if (STATIC_ROUTES.has(path)) return true;
  const blog = path.match(/^\/blog\/([a-z0-9-]+)$/);
  if (blog) return getPostBySlug(blog[1]) !== undefined;
  const answer = path.match(/^\/answers\/([a-z0-9-]+)$/);
  if (answer) return ANSWER_SLUGS.includes(answer[1]);
  const compare = path.match(/^\/compare\/([a-z0-9-]+)$/);
  if (compare) return COMPARISON_SLUGS.includes(compare[1]);
  const control = path.match(/^\/controls\/([a-z0-9-]+)$/);
  if (control) return CONTROL_SLUGS.includes(control[1]);
  return false;
}

describe("blog corpus integrity", () => {
  const posts = getAllPosts();

  it("has unique kebab-case slugs", () => {
    const slugs = posts.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("keeps every Tier-1 priority article published", () => {
    for (const slug of TIER1_SLUGS) {
      expect(getPostBySlug(slug), `Tier-1 article missing: ${slug}`).toBeDefined();
    }
  });

  it("sorts newest-first and exposes featured posts", () => {
    for (let i = 1; i < posts.length; i++) {
      expect(new Date(posts[i - 1].date).getTime()).toBeGreaterThanOrEqual(
        new Date(posts[i].date).getTime()
      );
    }
    expect(getFeaturedPosts().length).toBeGreaterThanOrEqual(1);
  });

  it.each(posts.map((p) => [p.slug, p] as const))(
    "%s has snippet-ready metadata and substantive content",
    (_slug, p) => {
      expect(p.title.length).toBeGreaterThan(20);
      expect(p.title.length).toBeLessThanOrEqual(90);
      expect(p.description.length).toBeGreaterThan(50);
      expect(p.excerpt.length).toBeGreaterThan(80);
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(new Date(p.date).getTime())).toBe(false);
      expect(p.readingTime).toBeGreaterThanOrEqual(3);
      expect(p.content.length).toBeGreaterThan(1500);
      expect(p.tags.length).toBeGreaterThanOrEqual(3);
      // Corpus-wide ceilings (frozen posts run long); strict for new posts.
      expect(p.description.length).toBeLessThanOrEqual(200);
      expect(p.excerpt.length).toBeLessThanOrEqual(400);
      if (new Date(p.date).getTime() >= STRICT_FROM) {
        expect(p.description.length, `${p.slug} description over 160`).toBeLessThanOrEqual(160);
        expect(p.excerpt.length, `${p.slug} excerpt over 300`).toBeLessThanOrEqual(300);
      }
    }
  );

  it("has zero internal link rot in post content", () => {
    for (const p of posts) {
      const hrefs = [...p.content.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
      for (const href of hrefs) {
        if (!href.startsWith("/")) continue; // external links out of scope
        expect(
          isKnownInternalRoute(href),
          `${p.slug} links to unknown internal route: ${href}`
        ).toBe(true);
      }
    }
  });
});

describe("editorial NEVER-DO guardrails (blog)", () => {
  const posts = getAllPosts();
  const allText = posts
    .flatMap((p) => [p.title, p.description, p.excerpt, p.content])
    .join("\n");
  const newText = posts
    .filter((p) => new Date(p.date).getTime() >= STRICT_FROM)
    .flatMap((p) => [p.title, p.description, p.excerpt, p.content])
    .join("\n");

  it("never publishes fabricated usage metrics", () => {
    expect(allText).not.toMatch(/\b\d+[KM]?\+\s*(teams|customers|users|companies|orgs)\b/i);
    expect(allText).not.toMatch(/\b2M\+|\b500\+\s*(teams|customers)/i);
    expect(allText).not.toMatch(/trusted by \d/i);
  });

  it("never claims the hosted/trial endpoint is CUI-safe", () => {
    expect(allText).not.toMatch(/hosted[^.]{0,40}cui[- ]?safe/i);
    expect(allText).not.toMatch(/trial[^.]{0,40}cui[- ]?safe/i);
    expect(allText).not.toMatch(/vercel[^.]{0,40}cui[- ]?safe/i);
  });

  it("anchors new content on the $499 report and never undercuts it", () => {
    expect(newText).toMatch(/\$499/);
    expect(allText).not.toMatch(/\$(?:9|9\d|1\d\d|2\d\d|3\d\d|4[0-8]\d)\b.{0,30}report/i);
  });

  it("new CUI-safety claims stay scoped to self-hosted deployment", () => {
    // Every new post that makes the local/boundary claim must also say
    // self-hosted / Docker / own infrastructure — the Mode B distinction.
    for (const p of posts.filter((x) => new Date(x.date).getTime() >= STRICT_FROM)) {
      if (/never leaves? (your|the) network|inside your (network|boundary)/i.test(p.content)) {
        expect(
          /self-hosted|own infrastructure|Docker/i.test(p.content),
          `${p.slug} claims boundary safety without the self-hosted (Mode B) qualifier`
        ).toBe(true);
      }
    }
  });
});
