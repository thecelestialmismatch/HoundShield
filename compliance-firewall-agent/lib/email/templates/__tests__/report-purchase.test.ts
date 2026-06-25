import { reportPurchaseEmail } from '../report-purchase';

describe('reportPurchaseEmail', () => {
  it('has correct from and an order-confirmation subject', () => {
    expect(reportPurchaseEmail.from).toBe('HoundShield <noreply@houndshield.com>');
    expect(reportPurchaseEmail.subject).toContain('Risk Assessment Report');
  });

  it('interpolates orgName into html', () => {
    expect(reportPurchaseEmail.html('Acme Clinic')).toContain('Acme Clinic');
  });

  it('names the $499 lead product and the next steps', () => {
    const html = reportPurchaseEmail.html('ACME');
    expect(html).toContain('$499');
    expect(html).toContain('What happens next');
  });

  it('reinforces the Mode B local-only boundary', () => {
    expect(reportPurchaseEmail.html('ACME')).toContain('never leaves your network');
  });

  it('links to the report workspace', () => {
    expect(reportPurchaseEmail.html('ACME')).toContain('/command-center/shield/reports');
  });
});
