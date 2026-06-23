import { partnerWelcomeEmail } from '../partner-welcome';

describe('partnerWelcomeEmail', () => {
  it('sends from the Partners address', () => {
    expect(partnerWelcomeEmail.from).toBe('HoundShield Partners <noreply@houndshield.com>');
    expect(partnerWelcomeEmail.subject.toLowerCase()).toContain('partner application');
  });

  it('interpolates applicant name and company', () => {
    const html = partnerWelcomeEmail.html('Jordan', 'Acme C3PAO');
    expect(html).toContain('Jordan');
    expect(html).toContain('Acme C3PAO');
  });

  it('sets a two-business-day expectation', () => {
    expect(partnerWelcomeEmail.html('Jordan', 'Acme')).toContain('two business days');
  });

  it('leads with the local-only DFARS advantage', () => {
    expect(partnerWelcomeEmail.html('Jordan', 'Acme')).toContain('DFARS 7012');
  });
});
