import { day14Email } from '../day14';

describe('day14Email', () => {
  it('has correct from and a report-focused subject', () => {
    expect(day14Email.from).toBe('HoundShield <noreply@houndshield.com>');
    expect(day14Email.subject.toLowerCase()).toContain('report');
  });

  it('interpolates orgName into html', () => {
    expect(day14Email.html('Acme Defense')).toContain('Acme Defense');
  });

  it('links to the reports generator', () => {
    expect(day14Email.html('ACME')).toContain('/command-center/shield/reports');
  });

  it('reinforces the local-only moat', () => {
    expect(day14Email.html('ACME')).toContain('never leaves your network');
  });
});
