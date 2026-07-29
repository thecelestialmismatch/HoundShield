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
    expect(renderTestGuide()).toContain('houndshield.com/demo');
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
    expect(text).toContain('houndshield.com/demo');
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
    expect(text).toContain('43%');
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
