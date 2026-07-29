import { day7Email } from '../day7';
import { PURCHASABLE_OFFER } from '@/lib/billing/entitlements';

describe('day7Email', () => {
  it('has correct from and subject', () => {
    expect(day7Email.from).toBe('HoundShield <noreply@houndshield.com>');
    expect(day7Email.subject).toContain('week 1');
  });

  it('interpolates orgName into html', () => {
    const html = day7Email.html('Acme Defense', 'pro');
    expect(html).toContain('Acme Defense');
  });

  it('offers the one purchasable report to non-paying accounts', () => {
    // Was "Upgrade to Pro — $199/mo", a tier no checkout can sell since
    // /pricing collapsed to the single one-time offer.
    const html = day7Email.html('ACME', 'free');
    expect(html).toContain(PURCHASABLE_OFFER.ctaLabel);
    expect(html).toContain(PURCHASABLE_OFFER.href);
    expect(html).not.toMatch(/\$\s?\d[\d,]*\s*\/\s*mo/i);
  });

  it('omits the offer block for paid accounts', () => {
    const html = day7Email.html('ACME', 'pro');
    expect(html).not.toContain(PURCHASABLE_OFFER.ctaLabel);
  });

  it('includes compliance dashboard CTA', () => {
    const html = day7Email.html('ACME', 'growth');
    expect(html).toContain('/command-center/shield/assessment');
  });
});
