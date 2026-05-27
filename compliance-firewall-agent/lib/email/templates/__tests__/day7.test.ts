import { day7Email } from '../day7';

describe('day7Email', () => {
  it('has correct from and subject', () => {
    expect(day7Email.from).toBe('Hound Shield <noreply@houndshield.com>');
    expect(day7Email.subject).toContain('week 1');
  });

  it('interpolates orgName into html', () => {
    const html = day7Email.html('Acme Defense', 'pro');
    expect(html).toContain('Acme Defense');
  });

  it('includes upgrade block for free tier', () => {
    const html = day7Email.html('ACME', 'free');
    expect(html).toContain('Upgrade to Pro');
    expect(html).toContain('/pricing');
  });

  it('omits upgrade block for paid tiers', () => {
    const html = day7Email.html('ACME', 'pro');
    expect(html).not.toContain('Upgrade to Pro');
  });

  it('includes compliance dashboard CTA', () => {
    const html = day7Email.html('ACME', 'growth');
    expect(html).toContain('/command-center/shield/assessment');
  });
});
