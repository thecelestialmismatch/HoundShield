import { findFaqAnswer } from "@/lib/brain-ai/faq";
import { cleanAnswer } from "@/lib/brain-ai/format-answer";
import { transactionalFrom } from "@/lib/email/identity";
import { emailButton, emailFooter, emailShell, escapeHtml } from "@/lib/email/shell";
import { siteUrl } from "@/lib/site-url";

/**
 * The reply a visitor gets the moment they use the /contact form.
 *
 * WHAT WAS WRONG. `/api/contact` sent exactly one message — an internal alert to
 * the founder — and nothing at all to the person who wrote in. Every other
 * inbound rail already acknowledged its sender (`/api/partners/apply` sends
 * `partner-welcome`, `/api/report/snapshot-lead` sends a summary, the Stripe
 * webhook sends `report-order`); the contact form, the widest-mouthed funnel on
 * the site, was the one that answered with silence. The page promised "we will
 * respond within 4 business hours" and then, until a human sat down, sent no
 * evidence the message had arrived anywhere.
 *
 * WHY IT IS TOPIC-TEMPLATED AND NOT AI-GENERATED. The visitor picks a subject
 * from a fixed five-option `<select>`, so the topic is known exactly — no
 * inference required. Composing the reply through an LLM instead would put a
 * stranger's message on a commercial endpoint (the same spillage class this
 * company sells protection against) and would let a generated sentence make a
 * compliance claim to a buyer that nobody reviewed. Five hand-written blocks
 * are deterministic, testable, and every claim in them is one we already
 * publish on the page each block links to.
 *
 * WHAT EVERY BLOCK OWES THE READER: an answer to the topic they actually chose,
 * their own message quoted back so they can see it arrived intact, and links
 * that go somewhere real. Link targets are asserted against the filesystem by
 * `__tests__/contact-received.test.ts`, because `/answers` — the obvious place
 * to send a curious reader — has no index page, only `/answers/[slug]`, and a
 * confident link to it would 404 the first buyer who clicked.
 *
 * CAN-SPAM. This is a §7702(17) transactional/relationship message — a direct
 * reply to a request the recipient initiated — so it carries no unsubscribe
 * block, exactly as `lib/legal/marketing-email.ts` documents for `report-order`
 * and `partner-welcome`. Attaching `marketingFooter()` would also make it fail
 * closed and send nothing while `MARKETING_POSTAL_ADDRESS` is unset.
 */

const FROM = transactionalFrom("Contact");

/** A link rendered in the "where to go next" list. */
interface TopicLink {
  href: string;
  label: string;
  note: string;
}

interface TopicReply {
  /** Follows "Thanks for getting in touch" in the subject line. */
  subjectSuffix: string;
  /** The substantive answer to this topic. Plain HTML, no untrusted values. */
  answerHtml: string;
  /** The primary call to action. */
  cta: { href: string; label: string };
  links: TopicLink[];
}

const DEMO = siteUrl("/demo");
const PRICING = siteUrl("/pricing");
const ASSESSMENT = siteUrl("/assessment");

/**
 * The five topics are the five `<option value>`s in `app/contact/page.tsx`.
 * `replyForTopic` falls back to General for anything else, so a future option
 * added to the form degrades to a real answer instead of throwing.
 */
const TOPIC_REPLIES: Record<string, TopicReply> = {
  General: {
    subjectSuffix: "here's what HoundShield does",
    answerHtml: `
        HoundShield is a local-only AI prompt firewall. It sits in front of ChatGPT, Copilot and
        Claude, scans each prompt on your own infrastructure in under 10 milliseconds for CUI,
        PHI, PII and export-controlled content, blocks what shouldn't leave, and writes a
        SHA-256 hash-chained audit log you can hand an assessor. The scanning happens inside
        your network — prompt content is never sent to us.`,
    cta: { href: DEMO, label: "See the 2-minute demo →" },
    links: [
      { href: DEMO, label: "Live demo", note: "paste a sample prompt and watch it get blocked" },
      { href: PRICING, label: "Pricing", note: "the $499 one-time report and the monthly plans" },
      {
        href: siteUrl("/answers/what-happens-if-you-paste-cui-into-chatgpt"),
        label: "What happens if someone pastes CUI into ChatGPT",
        note: "the incident-response answer, with the reporting clock",
      },
    ],
  },

  Sales: {
    subjectSuffix: "pricing and how to buy",
    answerHtml: `
        Most people start with the <strong>$499 CMMC AI Risk Assessment Report</strong>: a
        one-time engagement, no subscription and no MSA. We run the proxy in your environment
        for 14 days, then deliver a SHA-256-signed PDF that risk-scores every AI prompt event
        against the NIST 800-171 Rev 2 controls. It is a purchase order most teams can approve
        without a procurement review. Monthly plans exist for continuous monitoring once you
        know what the report finds.`,
    cta: { href: PRICING, label: "See pricing →" },
    links: [
      { href: PRICING, label: "Pricing", note: "one grid, no hidden tiers" },
      { href: ASSESSMENT, label: "The $499 report", note: "what you get and the 14-day timeline" },
      {
        href: siteUrl("/answers/how-much-does-cmmc-ai-monitoring-cost"),
        label: "What CMMC AI monitoring costs",
        note: "how we compare to GCC High and the cloud DLP tools",
      },
    ],
  },

  "Assessment Report": {
    subjectSuffix: "your $499 CMMC AI Risk Assessment Report",
    answerHtml: `
        Here's exactly how the <strong>$499 CMMC AI Risk Assessment Report</strong> runs. You
        deploy the proxy in your own environment (Mode B — Docker, about 15 minutes). Your team
        points its AI tools at it and works normally for 14 days; everything is scanned locally,
        and no prompt content leaves your network. On day 14 you get a SHA-256-signed PDF that
        risk-scores every event against NIST 800-171 Rev 2, with an SPRS delta and a Merkle root
        an assessor can verify independently. One payment, no subscription.`,
    cta: { href: ASSESSMENT, label: "Start your report →" },
    links: [
      { href: ASSESSMENT, label: "The $499 report", note: "scope, timeline and what's in the PDF" },
      {
        href: siteUrl("/api/reports/sample"),
        label: "Sample report (PDF)",
        note: "a real generated report, not a mockup",
      },
      {
        href: siteUrl("/answers/what-evidence-does-a-c3pao-accept-for-ai-usage"),
        label: "What evidence a an assessor may review",
        note: "why the signed log is the part that matters",
      },
    ],
  },

  Support: {
    subjectSuffix: "we're on it",
    answerHtml: `
        Your support request is with us and a human will reply — just hit reply on this email to
        add logs, screenshots or anything else that helps. If you're mid-deployment, the two
        things that resolve most issues are the API reference and the Mode B (Docker) setup
        steps: the proxy is an OpenAI-compatible endpoint, so in most stacks the only change is
        the base URL your client points at.`,
    cta: { href: siteUrl("/docs"), label: "Open the API docs →" },
    links: [
      { href: siteUrl("/docs"), label: "API reference", note: "endpoints, auth, cURL/JS/Python samples" },
      { href: siteUrl("/security"), label: "Security & architecture", note: "the three deployment modes explained" },
      { href: siteUrl("/trust"), label: "Trust center", note: "subprocessors, data handling, current posture" },
    ],
  },

  Partnership: {
    subjectSuffix: "partnering with HoundShield",
    answerHtml: `
        We work with RPOs, MSPs and compliance consultants who already advise CMMC and HIPAA
        clients. The co-branded version of the $499 report is <strong>$399 wholesale</strong>
        (a flat $100 partner discount) —
        you set your own client price and keep the margin — and recommending a local-only tool
        never creates a DFARS 7012 exposure for the client you're advising. Applying through the
        partner form is faster than this inbox: it routes straight into the partner queue.`,
    cta: { href: siteUrl("/partners/apply"), label: "Apply to the partner program →" },
    links: [
      { href: siteUrl("/partners"), label: "Partner program", note: "margins, co-branding and how referrals work" },
      { href: siteUrl("/partners/apply"), label: "Apply", note: "two minutes, reviewed within two business days" },
      { href: PRICING, label: "Pricing", note: "what your clients would pay direct" },
    ],
  },
};

/** The topic block for a submitted subject, falling back to General. */
export function replyForTopic(topic: string): TopicReply {
  return TOPIC_REPLIES[topic] ?? TOPIC_REPLIES.General;
}

/**
 * Brain AI's answer to what the visitor ACTUALLY wrote, or null.
 *
 * The topic blocks above answer the dropdown. This answers the sentence. A
 * visitor who picks "General" and then asks "is ChatGPT HIPAA compliant?"
 * should get the HIPAA answer, not the generic one — and Brain AI's FAQ already
 * holds that answer, written and reviewed.
 *
 * WHY THIS IS SAFE, when routing the message to an LLM would not be.
 * `findFaqAnswer` is a pure, in-process keyword matcher over a fixed answer
 * table (`lib/brain-ai/faq.ts`) — the same "zero API calls, pure in-memory
 * lookup" path the knowledge graph documents. It makes NO network call, needs
 * no `OPENROUTER_API_KEY`, and cannot invent a sentence: it either returns one
 * of our own reviewed answers or null.
 *
 * That distinction is the whole point. Composing this reply through
 * OpenRouter would put a stranger's message — possibly containing exactly the
 * PHI or CUI we sell protection against — onto a commercial endpoint, and could
 * put an unreviewed compliance claim in front of a buyer. Retrieval gives the
 * founder what was asked for ("use Brain AI to respond") without either risk.
 *
 * Returns plain text: `cleanAnswer` strips the markdown the FAQ is authored in,
 * because these answers are written for a chat pane, not an HTML email.
 */
export function brainAnswerFor(message: string): string | null {
  const answer = findFaqAnswer(message);
  if (!answer) return null;
  const text = cleanAnswer(answer).trim();
  return text.length > 0 ? text : null;
}

/** Every topic key, for tests and for callers that want to validate a subject. */
export const CONTACT_TOPICS = Object.keys(TOPIC_REPLIES);

function renderLinks(links: TopicLink[]): string {
  return links
    .map(
      (l) => `
        <p style="color:#475569;font-size:14px;margin:0 0 10px;line-height:1.6;">
          <a href="${l.href}" style="color:#ea580c;font-weight:600;text-decoration:none;">${l.label}</a>
          <span style="color:#94a3b8;"> — ${l.note}</span>
        </p>`
    )
    .join("");
}

export const contactReceivedEmail = {
  from: FROM,

  subject: (topic: string) => `Thanks for getting in touch — ${replyForTopic(topic).subjectSuffix}`,

  /**
   * `name`, `topic` and `message` all originate with an anonymous visitor and
   * are escaped here. `message` is quoted back so the reader can see we have
   * the text they actually sent.
   */
  html: (name: string, topic: string, message: string) => {
    const reply = replyForTopic(topic);
    const greeting = name && name.trim() ? escapeHtml(name.trim()) : "there";
    const quoted = escapeHtml(message).replace(/\n/g, "<br />");

    // Brain AI's answer to their actual sentence, when it recognises one. Sits
    // ABOVE the topic block: the specific question they typed outranks the
    // category they picked from a dropdown.
    const brain = brainAnswerFor(message);
    const brainBlock = brain
      ? `
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px;margin:0 0 24px;">
        <p style="color:#1e40af;font-weight:600;margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Answering your question directly</p>
        <p style="color:#1e3a8a;font-size:14px;margin:0;line-height:1.65;">${escapeHtml(brain).replace(/\n/g, "<br />")}</p>
      </div>`
      : "";

    return emailShell({
      tagline: "AI Compliance Firewall — local-only prompt scanning",
      bodyHtml: `
      <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Thanks, ${greeting} — we've got your message</h2>

      <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
        A real person reads every message and will reply within 4 business hours during the
        working week. In the meantime, here's a straight answer to what you asked about.
      </p>

      <div style="background:#f8fafc;border-left:3px solid #cbd5e1;border-radius:6px;padding:16px 20px;margin:0 0 24px;">
        <p style="color:#64748b;font-weight:600;margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">You wrote</p>
        <p style="color:#475569;font-size:14px;margin:0;line-height:1.6;font-style:italic;">${quoted}</p>
      </div>
${brainBlock}
      <p style="color:#475569;line-height:1.6;margin:0 0 24px;">${reply.answerHtml}
      </p>
${emailButton(reply.cta.href, reply.cta.label)}

      <div style="border-top:1px solid #e2e8f0;padding-top:24px;margin-top:8px;">
        <p style="color:#64748b;font-weight:600;margin:0 0 14px;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Where to go next</p>
${renderLinks(reply.links)}
      </div>

      <p style="color:#64748b;font-size:13px;line-height:1.6;margin:24px 0 0;">
        Reply to this email and it reaches us directly — it is not a no-reply address.
      </p>`,
      // No "Manage notifications": the reader has no account to manage. This is
      // a one-off reply to a message they sent us, not list mail.
      footerHtml: emailFooter(),
    });
  },

  /** Plain-text alternative. Some corporate gateways strip HTML entirely. */
  text: (name: string, topic: string, message: string) => {
    const reply = replyForTopic(topic);
    const greeting = name && name.trim() ? name.trim() : "there";
    const stripped = reply.answerHtml.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const links = reply.links.map((l) => `- ${l.label} — ${l.note}\n  ${l.href}`).join("\n");
    const brain = brainAnswerFor(message);
    const brainBlock = brain ? `Answering your question directly:\n${brain}\n\n` : "";

    return `Thanks, ${greeting} — we've got your message

A real person reads every message and will reply within 4 business hours during the working week. In the meantime, here's a straight answer to what you asked about.

You wrote:
${message}

${brainBlock}${stripped}

Where to go next:
${links}

Reply to this email and it reaches us directly — it is not a no-reply address.

HoundShield — AI Compliance Firewall
${siteUrl("/")}`;
  },
};
