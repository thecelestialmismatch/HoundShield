import { upgradeEmail } from '../upgrade';

describe('upgradeEmail', () => {
  it('has correct from address', () => {
    expect(upgradeEmail.from).toBe('HoundShield <noreply@houndshield.com>');
  });

  it('names the tier in the subject', () => {
    expect(upgradeEmail.subject('growth')).toContain('Growth');
    expect(upgradeEmail.subject('enterprise')).toContain('Enterprise');
  });

  it('falls back to Pro for an unknown tier', () => {
    expect(upgradeEmail.subject('mystery')).toContain('Pro');
    expect(upgradeEmail.html('ACME', 'mystery')).toContain('Pro');
  });

  it('interpolates orgName and tier-specific unlocks', () => {
    const html = upgradeEmail.html('Acme Defense', 'agency');
    expect(html).toContain('Acme Defense');
    expect(html).toContain('white-label');
  });

  it('confirms payment without upselling', () => {
    const html = upgradeEmail.html('ACME', 'pro');
    expect(html).toContain('Payment confirmed');
  });
});
