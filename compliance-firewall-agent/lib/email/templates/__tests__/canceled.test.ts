import { canceledEmail } from '../canceled';

describe('canceledEmail', () => {
  it('has correct from and subject', () => {
    expect(canceledEmail.from).toBe('HoundShield <noreply@houndshield.com>');
    expect(canceledEmail.subject.toLowerCase()).toContain('canceled');
  });

  it('interpolates orgName into html', () => {
    expect(canceledEmail.html('Acme Defense')).toContain('Acme Defense');
  });

  it('states data is retained and offers reactivation', () => {
    const html = canceledEmail.html('ACME');
    expect(html).toContain('Free plan');
    expect(html).toContain('/pricing');
    expect(html).toContain('Reactivate');
  });
});
