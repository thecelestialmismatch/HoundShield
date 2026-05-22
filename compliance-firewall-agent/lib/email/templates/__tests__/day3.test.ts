import { day3Email } from '../day3';

describe('day3Email', () => {
  it('has correct from and subject', () => {
    expect(day3Email.from).toBe('Hound Shield <noreply@houndshield.com>');
    expect(day3Email.subject).toContain('first AI query');
  });

  it('interpolates orgName into html', () => {
    const html = day3Email.html('Acme Defense');
    expect(html).toContain('Acme Defense');
  });

  it('includes the gateway URL snippet', () => {
    const html = day3Email.html('ACME');
    expect(html).toContain('gateway.houndshield.com/v1');
  });

  it('includes the quickstart CTA link', () => {
    const html = day3Email.html('ACME');
    expect(html).toContain('/command-center/shield/quickstart');
  });
});
