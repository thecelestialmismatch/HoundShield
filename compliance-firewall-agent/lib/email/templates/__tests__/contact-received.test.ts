import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  CONTACT_TOPICS,
  brainAnswerFor,
  contactReceivedEmail,
  replyForTopic,
} from "../contact-received";
import { RISK_REPORT, formatUSD } from "@/lib/pricing/plans";

const APP_ROOT = join(__dirname, "..", "..", "..", "..");

describe("contactReceivedEmail — identity", () => {
  it("comes from the transactional contact sender", () => {
    expect(contactReceivedEmail.from).toBe("HoundShield Contact <noreply@houndshield.com>");
  });
});

describe("the topics match the form exactly", () => {
  // If someone adds an option to the <select> and not here, that visitor
  // silently falls back to the General answer — a reply that does not address
  // what they asked, which is the exact complaint this template exists to fix.
  it("covers every option value in app/contact/page.tsx", () => {
    const page = readFileSync(join(APP_ROOT, "app", "contact", "page.tsx"), "utf8");
    const options = [...page.matchAll(/<option value="([^"]+)"/g)].map((m) => m[1]);

    expect(options.length).toBeGreaterThanOrEqual(5);
    for (const option of options) {
      expect(CONTACT_TOPICS).toContain(option);
    }
  });

  it("falls back to General for an unknown topic instead of throwing", () => {
    expect(replyForTopic("Nonsense")).toBe(replyForTopic("General"));
    expect(() => contactReceivedEmail.html("A", "Nonsense", "hi")).not.toThrow();
  });
});

describe("every link goes somewhere that exists", () => {
  /** Map a site path to the file that would serve it, or null if unroutable. */
  function resolves(path: string): boolean {
    if (path === "/") return true;
    const clean = path.replace(/^\//, "");
    if (existsSync(join(APP_ROOT, "app", clean, "page.tsx"))) return true;
    if (existsSync(join(APP_ROOT, "app", clean, "route.ts"))) return true;
    return false;
  }

  const allLinks = CONTACT_TOPICS.flatMap((topic) => {
    const reply = replyForTopic(topic);
    return [reply.cta.href, ...reply.links.map((l) => l.href)];
  });

  it("collected the links (guards against a vacuous pass)", () => {
    expect(allLinks.length).toBeGreaterThanOrEqual(15);
  });

  it.each([...new Set(allLinks)])("%s is a real route", (href) => {
    const path = href.replace(/^https:\/\/[^/]+/, "");

    // /answers has NO index page — only /answers/[slug]. A link to the bare
    // path would 404, so slugs are checked against the answer data instead.
    if (path.startsWith("/answers/")) {
      const slug = path.slice("/answers/".length);
      const answers = readFileSync(join(APP_ROOT, "app", "answers", "_answers.ts"), "utf8");
      expect(answers).toContain(`slug: "${slug}"`);
      return;
    }

    expect(resolves(path)).toBe(true);
  });

  it("never links the /answers index, which does not exist", () => {
    expect(existsSync(join(APP_ROOT, "app", "answers", "page.tsx"))).toBe(false);
    for (const href of allLinks) {
      expect(href).not.toMatch(/\/answers\/?$/);
    }
  });
});

describe("the reply answers the question that was asked", () => {
  it.each(CONTACT_TOPICS)("%s gets a subject naming its own topic", (topic) => {
    const subject = contactReceivedEmail.subject(topic);
    expect(subject).toContain("Thanks for getting in touch");
    expect(subject).toBe(`Thanks for getting in touch — ${replyForTopic(topic).subjectSuffix}`);
  });

  it("gives each topic a distinct subject line", () => {
    const subjects = new Set(CONTACT_TOPICS.map((t) => contactReceivedEmail.subject(t)));
    expect(subjects.size).toBe(CONTACT_TOPICS.length);
  });

  it("answers Sales with the price and Assessment Report with the process", () => {
    expect(contactReceivedEmail.html("A", "Sales", "how much?")).toContain("$499");
    const report = contactReceivedEmail.html("A", "Assessment Report", "how does it work?");
    expect(report).toContain("14 days");
    expect(report).toContain("NIST 800-171");
    // Mode B is the only CUI-safe deployment; saying so is load-bearing.
    expect(report).toContain("Mode B");
  });

  it("answers Partnership with the wholesale price, not the retail one alone", () => {
    expect(contactReceivedEmail.html("A", "Partnership", "?")).toContain(
      formatUSD(RISK_REPORT.wholesalePrice),
    );
  });

  it("quotes the visitor's own message back to them", () => {
    const html = contactReceivedEmail.html("Dana", "General", "Do you support Azure OpenAI?");
    expect(html).toContain("Do you support Azure OpenAI?");
    expect(html).toContain("You wrote");
  });

  it("carries the logo and a working demo and pricing link on the General reply", () => {
    const html = contactReceivedEmail.html("Dana", "General", "hi");
    expect(html).toContain("/logo-mark-white.png");
    expect(html).toContain("/demo");
    expect(html).toContain("/pricing");
  });
});

describe("Brain AI answers the sentence, not just the dropdown", () => {
  it("answers a specific question even when the topic is General", () => {
    // The exact case this exists for: a visitor picks "General" and then asks
    // something specific. The dropdown must not outrank what they typed.
    const html = contactReceivedEmail.html(
      "Dana",
      "General",
      "Is ChatGPT HIPAA compliant for our clinic?"
    );
    expect(html).toContain("Answering your question directly");
    expect(html).toMatch(/HIPAA/);
  });

  it.each([
    ["How much does it cost?", /\$499/],
    ["What is CUI?", /Controlled Unclassified Information/i],
    ["Can I get a PDF report for my C3PAO?", /PDF/i],
  ])("recognises %s", (question, expected) => {
    const answer = brainAnswerFor(question);
    expect(answer).not.toBeNull();
    expect(answer as string).toMatch(expected);
  });

  it("returns null rather than guessing when it does not know", () => {
    expect(brainAnswerFor("asdfgh qwerty zzz")).toBeNull();
    expect(brainAnswerFor("")).toBeNull();
  });

  it("omits the block entirely on no match, leaving the topic answer intact", () => {
    const html = contactReceivedEmail.html("Dana", "Sales", "asdfgh qwerty zzz");
    expect(html).not.toContain("Answering your question directly");
    expect(html).toContain("$499"); // the Sales topic block still answers
  });

  it("returns plain text, not the markdown the FAQ is authored in", () => {
    const answer = brainAnswerFor("What is CUI?") as string;
    expect(answer).not.toMatch(/\*\*/);
    expect(answer).not.toMatch(/^#+ /m);
  });

  it("escapes the answer on its way into the email", () => {
    // The FAQ is our own content, but it is interpolated into HTML like any
    // other value — the escape is not conditional on trusting the source.
    const html = contactReceivedEmail.html("Dana", "General", "What is CUI?");
    expect(html).not.toMatch(/<script/i);
  });

  it("makes no network call and needs no LLM key", async () => {
    // The load-bearing property. If this ever routes through OpenRouter, a
    // stranger's message — possibly containing the PHI or CUI we sell
    // protection against — leaves the building, and an unreviewed sentence can
    // reach a buyer. Proven by the absence of a key, not by reading the code.
    const saved = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    try {
      expect(brainAnswerFor("How much does it cost?")).not.toBeNull();
    } finally {
      if (saved !== undefined) process.env.OPENROUTER_API_KEY = saved;
    }
  });
});

describe("safety and correctness", () => {
  it("escapes untrusted name and message", () => {
    const html = contactReceivedEmail.html(
      "<script>alert(1)</script>",
      "General",
      "<script>alert(2)</script>"
    );
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<script>alert(2)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("greets an empty name gracefully", () => {
    expect(contactReceivedEmail.html("", "General", "hi")).toContain("Thanks, there");
    expect(contactReceivedEmail.html("   ", "General", "hi")).toContain("Thanks, there");
  });

  it("never claims the hosted endpoint is CUI-safe", () => {
    for (const topic of CONTACT_TOPICS) {
      const html = contactReceivedEmail.html("A", topic, "x");
      expect(html).not.toMatch(/FedRAMP[- ]authorized/i);
      expect(html).not.toMatch(/hosted.{0,40}CUI[- ]safe/i);
    }
  });

  it("carries no unsubscribe block — it is a transactional reply, not list mail", () => {
    // §7702(17): a direct reply to a request the recipient initiated. Adding an
    // unsubscribe would also make it fail closed while MARKETING_POSTAL_ADDRESS
    // is unset, i.e. send nothing at all.
    const html = contactReceivedEmail.html("A", "General", "x");
    expect(html).not.toMatch(/unsubscribe/i);
  });

  it("says replies reach a human, and does not send from a no-reply promise it breaks", () => {
    expect(contactReceivedEmail.html("A", "General", "x")).toContain("not a no-reply address");
  });
});

describe("plain-text alternative", () => {
  it.each(CONTACT_TOPICS)("%s has a text part with the same links and no HTML tags", (topic) => {
    const text = contactReceivedEmail.text("Dana", topic, "my question");
    expect(text).toContain("Dana");
    expect(text).toContain("my question");
    expect(text).not.toMatch(/<[a-z][^>]*>/i);
    for (const link of replyForTopic(topic).links) {
      expect(text).toContain(link.href);
    }
  });
});
