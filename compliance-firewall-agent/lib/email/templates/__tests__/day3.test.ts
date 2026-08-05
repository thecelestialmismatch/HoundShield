import { day3Email } from '../day3';
import { GATEWAY_BASE_URL } from '@/lib/gateway/base-url';

describe('day3Email', () => {
  it('has correct from and subject', () => {
    expect(day3Email.from).toBe('HoundShield <noreply@houndshield.com>');
    expect(day3Email.subject).toContain('first AI query');
  });

  it('interpolates orgName into html', () => {
    const html = day3Email.html('Acme Defense');
    expect(html).toContain('Acme Defense');
  });

  it('includes the gateway URL snippet', () => {
    const html = day3Email.html('ACME');
    expect(html).toContain(GATEWAY_BASE_URL);
  });

  it('includes the quickstart CTA link', () => {
    const html = day3Email.html('ACME');
    expect(html).toContain('/command-center/shield/quickstart');
  });
});
