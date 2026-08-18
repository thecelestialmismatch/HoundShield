import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DEMO_SAMPLES,
  OUTREACH_DRAFTS,
  TEST_IT_YOURSELF_STEPS,
  PREVIEW_CAVEAT,
  renderTestGuide,
  getDraft,
  render,
  healthcareOutreach,
  partnerOutreach,
  defenseSprsOutreach,
  mailboxSmokeTest,
} from '../outreach';
import { founderAddress, founderName } from '../identity';
import { PERSONAL_ACCOUNT_SENSITIVE } from '@/lib/market/netskope';
import { siteUrl } from '@/lib/site-url';

/**
 * The demo URL as the drafts now build it. These assertions used to hardcode
 * `https://houndshield.com/demo` — the apex host, which Vercel 308s to www. The
 * draft was corrected to build from SITE_URL, so the tests follow it rather
 * than pinning the address that redirects.
 */
const DEMO_URL = siteUrl('/demo');

/** Fully-specified real-looking vars, so render() succeeds. */
const VARS = { firstName: 'Dana', organization: 'Ridgeview Family Medicine' };

/** Every buyer-facing draft (the smoke test is internal and excluded). */
const BUYER_DRAFTS = [healthcareOutreach, partnerOutreach, defenseSprsOutreach];

describe('draft registry', () => {
  it('exposes all four drafts with unique ids', () => {
    const ids = OUTREACH_DRAFTS.map((d) => d.id);
    expect(ids).toEqual(['smoke-test', 'healthcare', 'partner', 'defense']);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('looks a draft up by id and returns undefined for an unknown one', () => {
    expect(getDraft('healthcare')).toBe(healthcareOutreach);
    expect(getDraft('nope')).toBeUndefined();
  });

  it('every draft documents its audience and rationale', () => {
    for (const d of OUTREACH_DRAFTS) {
      expect(d.audience.length).toBeGreaterThan(10);
      expect(d.rationale.length).toBeGreaterThan(30);
    }
  });
});

describe('the non-technical test guide', () => {
  it('has sequentially numbered steps', () => {
    expect(TEST_IT_YOURSELF_STEPS.length).toBeGreaterThanOrEqual(5);
    TEST_IT_YOURSELF_STEPS.forEach((s, i) => expect(s.n).toBe(i + 1));
  });

  it('points at the real demo URL', () => {
    expect(renderTestGuide()).toContain(DEMO_URL);
  });

  it('promises no install, no account and no IT involvement', () => {
    const guide = renderTestGuide().toLowerCase();
    expect(guide).toContain('nothing to install');
    expect(guide).toContain('no account');
    expect(guide).toContain('no it help needed');
  });

  it('names the real on-page controls a reader will look for', () => {
    // If the page's button label changes, this guide is wrong and must change too.
    const guide = renderTestGuide();
    expect(guide).toContain('Scan for Threats');
    expect(guide).toContain('Patient Record');
  });

  it('includes the offline proof — the step that lets a buyer verify local-only themselves', () => {
    const guide = renderTestGuide().toLowerCase();
    expect(guide).toMatch(/turn off your wi-?fi/);
    expect(guide).toContain('own browser');
  });

  it('uses no jargon a non-technical reader would stumble on', () => {
    const guide = renderTestGuide();
    for (const jargon of ['regex', 'API', 'proxy', 'Docker', 'CLI', 'endpoint', 'SDK']) {
      expect(guide).not.toContain(jargon);
    }
  });

  it('states the preview boundary honestly', () => {
    expect(PREVIEW_CAVEAT).toMatch(/preview/i);
    expect(PREVIEW_CAVEAT).toContain('$499');
    expect(renderTestGuide()).toContain(PREVIEW_CAVEAT);
  });
});

describe('every buyer-facing draft carries the guide', () => {
  it.each(BUYER_DRAFTS.map((d) => [d.id, d] as const))('%s includes the step-by-step guide', (_id, draft) => {
    const { text } = render(draft, VARS);
    expect(text).toContain('How to try it yourself');
    expect(text).toContain(DEMO_URL);
    expect(text).toContain(PREVIEW_CAVEAT);
  });
});

describe('honesty guards — claims that would cost us the sale if false', () => {
  const allText = () =>
    OUTREACH_DRAFTS.map((d) => {
      try {
        const r = render(d, VARS);
        return `${r.subject}\n${r.text}`;
      } catch {
        return '';
      }
    }).join('\n\n');

  it('never sells against the suspended November 2026 CMMC deadline', () => {
    const text = allText();
    expect(text).not.toMatch(/november\s+2026|nov\s+10|10\s+nov/i);
    expect(text).not.toMatch(/deadline/i);
  });

  it('never names a subscription tier or a monthly price', () => {
    const text = allText();
    expect(text).not.toMatch(/\/mo\b|per month|monthly|HoundShield Pro|Starter|Growth|Enterprise tier/i);
  });

  it('never claims SOC 2, which is not started', () => {
    expect(allText()).not.toMatch(/SOC\s?2/i);
  });

  it('never claims the hosted site is CUI-safe', () => {
    const text = allText();
    expect(text).not.toMatch(/FedRAMP/i);
    // "nothing leaves your network" is only claimed about local/in-environment scanning
    expect(text).not.toMatch(/our (cloud|servers?) (is|are) cui.safe/i);
  });

  it('never pitches a C3PAO as a referral channel (32 CFR 170 / ISO 17020)', () => {
    // C3PAO may appear as the AUDIENCE for the PDF, never as the partner.
    const partner = render(partnerOutreach, VARS).text;
    expect(partner).not.toMatch(/c3pao/i);
  });

  it('never fabricates usage metrics', () => {
    expect(allText()).not.toMatch(/\d+[KM]?\+\s*(teams|customers|scans|users|clients)/i);
  });

  it('quotes only the $499 retail and $299 wholesale prices', () => {
    // Anchor on a digit at the end so trailing prose punctuation ("$299, your
    // client pays…") is not captured as part of the price.
    const prices = allText().match(/\$\d(?:[\d,]*\d)?(?:\.\d+)?[KM]?/g) ?? [];
    const allowed = new Set(['$499', '$299', '$999', '$4.6M', '$507,144']);
    for (const p of prices) expect(allowed).toContain(p);
  });
});

describe('draft-specific content', () => {
  it('healthcare cites Netskope with its year, because buyers verify', () => {
    const { text } = render(healthcareOutreach, VARS);
    expect(text).toMatch(/Netskope/);
    expect(text).toMatch(/2025/);
    expect(text).toContain('89%');
  });

  /**
   * REGRESSION GUARD. The draft shipped "43% of healthcare workers use personal
   * AI accounts at work". 43% is Netskope's figure for organisations
   * EXPERIMENTING WITH LOCAL GENAI INFRASTRUCTURE — it says nothing about
   * personal accounts. A compliance buyer who checks the source finds the
   * mismatch, and the credibility of every other number in the email dies with
   * it. These assertions make that specific mistake unshippable.
   */
  it('healthcare never pairs 43% with personal accounts', () => {
    const { text } = render(healthcareOutreach, VARS);
    expect(text).not.toContain('43%');
  });

  it('healthcare states the personal-account claim with the correct figure', () => {
    const { text } = render(healthcareOutreach, VARS);
    expect(text).toContain(PERSONAL_ACCOUNT_SENSITIVE.value);
    expect(text).toMatch(/personal AI account/i);
  });

  it('healthcare scopes 89% to generative AI, not to all violations', () => {
    const { text } = render(healthcareOutreach, VARS);
    const idx = text.indexOf('89%');
    expect(idx).toBeGreaterThan(-1);
    // The denominator must travel with the number, in the same sentence.
    const sentence = text.slice(idx, text.indexOf('.', idx) + 1);
    expect(sentence).toMatch(/generative AI/i);
  });

  it('no draft quotes a bare Netskope percentage without a denominator', () => {
    for (const draft of OUTREACH_DRAFTS) {
      let text = '';
      try {
        text = render(draft, VARS).text;
      } catch {
        continue; // draft needs vars this fixture does not supply
      }
      for (const pct of ['89%', '81%', '71%', '31%']) {
        if (!text.includes(pct)) continue;
        const idx = text.indexOf(pct);
        const window = text.slice(idx, idx + 200);
        expect(window).toMatch(
          /violations|healthcare genAI users|organisations|organizations/i,
        );
      }
    }
  });

  it('healthcare asks for time, not money', () => {
    const { text } = render(healthcareOutreach, VARS);
    expect(text).toMatch(/15 minutes/);
    expect(text).toMatch(/not selling/i);
  });

  it('partner states the wholesale economics in real numbers', () => {
    const { text } = render(partnerOutreach, VARS);
    expect(text).toContain('$299');
    expect(text).toContain('$499');
  });

  it('defense sells FCA liability with verifiable settlements', () => {
    const { text } = render(defenseSprsOutreach, { firstName: 'Jordan' });
    expect(text).toMatch(/False Claims Act/);
    expect(text).toContain('MORSECORP');
    expect(text).toContain('$4.6M');
    expect(text).toContain('LOGZONE');
    expect(text).toContain('$507,144');
    expect(text).toMatch(/suspended/i);
  });

  it('the smoke test tests the RECEIVING half, not just sending', () => {
    const { text } = render(mailboxSmokeTest, {});
    expect(text).toMatch(/hit reply/i);
    expect(text).toContain(founderAddress());
    expect(text).toMatch(/spam/i);
  });
});

describe('render() — sender identity', () => {
  it('always sends from the founder, never a noreply address', () => {
    const r = render(healthcareOutreach, VARS);
    // Identity comes from env; with FOUNDER_NAME/FOUNDER_EMAIL set this is the
    // real sender. Unconfigured it degrades impersonally — never to noreply.
    expect(r.from).toBe(`${founderName()} <${founderAddress()}>`);
    expect(r.from).not.toMatch(/noreply/i);
  });

  it('sets reply-to to the founder mailbox so replies reach a human', () => {
    expect(render(healthcareOutreach, VARS).replyTo).toBe(founderAddress());
  });

  it('signs every draft with the configured sender and the role title', () => {
    for (const d of OUTREACH_DRAFTS) {
      const vars = d.id === 'defense' ? { firstName: 'Jordan' } : VARS;
      expect(render(d, vars).text).toContain(`${founderName()}\nFounder, HoundShield`);
    }
  });
});

describe('render() — refuses template residue (the "no flukes" rule)', () => {
  it('throws when a required variable is missing', () => {
    expect(() => render(healthcareOutreach, {})).toThrow(/requires firstName/);
    expect(() => render(healthcareOutreach, { firstName: 'Dana' })).toThrow(/requires organization/);
  });

  it('throws on a blank-but-present variable', () => {
    expect(() => render(healthcareOutreach, { firstName: '   ', organization: 'X' })).toThrow(
      /requires firstName/,
    );
  });

  it.each(['[First name]', '{{firstName}}', '<name>', 'First name', 'FIRSTNAME'])(
    'throws on placeholder value %s',
    (bad) => {
      expect(() => render(healthcareOutreach, { firstName: bad, organization: 'Ridgeview' })).toThrow(
        /placeholder/i,
      );
    },
  );

  it('renders cleanly with real values', () => {
    expect(() => render(healthcareOutreach, VARS)).not.toThrow();
    const { subject, text } = render(healthcareOutreach, VARS);
    expect(subject).toContain('Ridgeview Family Medicine');
    expect(text).toContain('Hi Dana,');
    expect(text).not.toMatch(/\[|\]|\{\{/);
  });

  it('leaves no bracketed placeholder anywhere in any rendered draft', () => {
    for (const d of OUTREACH_DRAFTS) {
      const vars = d.id === 'defense' ? { firstName: 'Jordan' } : VARS;
      const { subject, text } = render(d, vars);
      expect(`${subject}${text}`).not.toMatch(/\[[A-Za-z ]+\]|\{\{|\}\}/);
    }
  });
});

describe('the test guide names a sample button that /demo actually has', () => {
  // Reads the page source rather than importing it: app/demo/page.tsx is a
  // client component and importing it would pull the whole scanner into this
  // suite. The invariant is about what the page SAYS, so the test reads that.
  const demo = readFileSync(join(process.cwd(), 'app', 'demo', 'page.tsx'), 'utf8');

  it.each(Object.entries(DEMO_SAMPLES))('%s → "%s" is really on /demo', (_audience, sample) => {
    expect(demo, `no sample button named "${sample}" in app/demo/page.tsx`).toContain(
      `name: "${sample}"`,
    );
  });

  it('offers exactly the four buttons the guide claims are there', () => {
    // Step 1 tells the reader there are "four sample buttons". Add a fifth and
    // every outreach email becomes wrong — fail here, not in a buyer's inbox.
    const count = [...demo.matchAll(/name: "[^"]+",\s*\n\s*icon:/g)].length;
    expect(count, 'the guide promises four sample buttons').toBe(4);
  });

  it('links with an explicit https:// scheme, never a bare domain', () => {
    // Pasted into Gmail, the scheme-less "houndshield.com/demo" was rewritten to
    // a google.com/url?q=http://… redirect: the buyer sees a tracking link and
    // takes an extra insecure hop. Both read as bulk mail, which is the one
    // thing a founder-to-buyer email cannot look like.
    for (const d of OUTREACH_DRAFTS) {
      const vars = d.id === 'defense' ? { firstName: 'Jordan' } : VARS;
      const { text } = render(d, vars);
      // Strip every fully-schemed URL, then assert no mention of the domain
      // survives. The previous form — a lookbehind for "//" — silently stopped
      // biting the moment the link moved to www: in "www.houndshield.com" the
      // character before the domain is ".", not "/", so the negative lookbehind
      // passed and a genuinely scheme-less link would no longer be caught.
      const withoutUrls = text.replace(/https:\/\/[^\s)]+/g, '');
      expect(withoutUrls, `${d.id} must not contain a bare-domain URL`).not.toMatch(
        /houndshield\.com\//,
      );
      expect(text).not.toContain('http://houndshield');
    }
  });

  it('sends each audience the sample it would actually care about', () => {
    // The defect this prevents: a DoD security manager told to click "Patient
    // Record", which reads as an untargeted mail merge.
    const defenseGuide = renderTestGuide(DEMO_SAMPLES.defense);
    expect(defenseGuide).toContain(DEMO_SAMPLES.defense);
    expect(defenseGuide).not.toContain(DEMO_SAMPLES.healthcare);

    const defenseBody = render(defenseSprsOutreach, { firstName: 'Jordan' }).text;
    expect(defenseBody).toContain(DEMO_SAMPLES.defense);
    expect(defenseBody).not.toContain(DEMO_SAMPLES.healthcare);

    const partnerBody = render(partnerOutreach, VARS).text;
    expect(partnerBody).toContain(DEMO_SAMPLES.technical);
    expect(partnerBody).not.toContain(DEMO_SAMPLES.healthcare);

    // Healthcare keeps the patient-information wording; the others must not,
    // because it is meaningless to an MSP or a defense contractor.
    expect(render(healthcareOutreach, VARS).text).toContain('real patient information');
    expect(defenseBody).not.toContain('real patient information');
    expect(partnerBody).not.toContain('real patient information');
  });
});
