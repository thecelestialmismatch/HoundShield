/**
 * `recordGatewayDecision` — the single write path for a gateway decision.
 *
 * Two bugs are pinned here, and both were silent:
 *
 *   1. ONE EVENT PER DECISION. `handleQuarantine` used to insert its own
 *      `compliance_events` row and the caller then inserted a second, so every
 *      quarantined prompt counted twice in every dashboard total, chart, and
 *      audit export — on a product whose deliverable IS the audit log.
 *
 *   2. THE WRITE NEVER BREAKS THE PROXY. The safety decision is made and
 *      enforced before this runs, so a database blip must degrade the record,
 *      never 500 a customer's production AI traffic and never throw into a
 *      caller that would treat the throw as "request failed, retry".
 */

const { mockLogEvent, mockHandleQuarantine } = vi.hoisted(() => ({
  mockLogEvent: vi.fn(),
  mockHandleQuarantine: vi.fn(),
}));

vi.mock('@/lib/audit/logger', () => ({
  logComplianceEvent: (input: unknown) => mockLogEvent(input),
}));

vi.mock('@/lib/quarantine/handler', () => ({
  handleQuarantine: (req: unknown, cls: unknown, eventId: string) =>
    mockHandleQuarantine(req, cls, eventId),
}));

import { createHash } from 'crypto';
import { recordGatewayDecision } from '@/lib/audit/record-decision';
import type { ClassificationResult } from '@/lib/supabase/types';

const PROMPT = 'My SSN is 123-45-6789';

const classification: ClassificationResult = {
  risk_level: 'CRITICAL',
  classifications: ['PII'],
  entities: [{ type: 'SSN', value: '[redacted]', position: 11 }] as never,
  confidence: 0.98,
  should_block: true,
  should_quarantine: false,
  matched_rules: ['us-ssn'],
};

const decision = (over: Partial<Parameters<typeof recordGatewayDecision>[0]> = {}) => ({
  userId: 'user-abc',
  prompt: PROMPT,
  destination: 'openai',
  classification,
  action: 'BLOCKED' as const,
  processingTimeMs: 7,
  requestId: 'req-1',
  ...over,
});

describe('recordGatewayDecision', () => {
  beforeEach(() => {
    mockLogEvent.mockReset().mockResolvedValue('event-1');
    mockHandleQuarantine.mockReset().mockResolvedValue('quarantine-1');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it('writes exactly ONE compliance event per decision', async () => {
    await recordGatewayDecision(decision());
    expect(mockLogEvent).toHaveBeenCalledTimes(1);
  });

  it('records ALLOWED decisions too — a log of only violations cannot show the control was operating', async () => {
    await recordGatewayDecision(
      decision({
        action: 'ALLOWED',
        classification: { ...classification, risk_level: 'NONE', should_block: false },
      })
    );
    expect(mockLogEvent).toHaveBeenCalledTimes(1);
    expect(mockLogEvent.mock.calls[0][0]).toMatchObject({ action_taken: 'ALLOWED' });
  });

  it('stores the prompt HASH, never the prompt', async () => {
    await recordGatewayDecision(decision());
    const written = mockLogEvent.mock.calls[0][0] as Record<string, unknown>;
    expect(written.prompt_hash).toBe(createHash('sha256').update(PROMPT).digest('hex'));
    expect(JSON.stringify(written)).not.toContain('123-45-6789');
  });

  it('carries the SERVER-resolved identity and the scanned provider onto the row', async () => {
    await recordGatewayDecision(decision());
    expect(mockLogEvent.mock.calls[0][0]).toMatchObject({
      user_id: 'user-abc',
      destination_provider: 'openai',
      risk_level: 'CRITICAL',
      processing_time_ms: 7,
    });
  });

  it('does NOT touch the quarantine queue for a non-quarantined decision', async () => {
    await recordGatewayDecision(decision());
    expect(mockHandleQuarantine).not.toHaveBeenCalled();
  });

  // ── The double-count regression ────────────────────────────────────────────
  it('QUARANTINED attaches the queue entry to the SAME event — no second event', async () => {
    const result = await recordGatewayDecision(decision({ action: 'QUARANTINED' }));

    expect(mockLogEvent).toHaveBeenCalledTimes(1);
    expect(mockHandleQuarantine).toHaveBeenCalledTimes(1);
    // The third argument is the id of the one event we wrote. Before the fix
    // handleQuarantine took two arguments and minted its own event.
    expect(mockHandleQuarantine.mock.calls[0][2]).toBe('event-1');
    expect(result).toEqual({
      eventId: 'event-1',
      quarantineId: 'quarantine-1',
      error: null,
    });
  });

  it('hands the quarantine handler the prompt it must encrypt, under the same request id', async () => {
    await recordGatewayDecision(decision({ action: 'QUARANTINED' }));
    expect(mockHandleQuarantine.mock.calls[0][0]).toMatchObject({
      prompt: PROMPT,
      user_id: 'user-abc',
      destination: 'openai',
      request_id: 'req-1',
    });
  });

  // ── Failure policy ─────────────────────────────────────────────────────────
  it('NEVER throws when the event write fails — it degrades and reports', async () => {
    mockLogEvent.mockRejectedValue(new Error('db down'));

    const result = await recordGatewayDecision(decision());

    expect(result.eventId).toBeNull();
    expect(result.error).toBe('db down');
  });

  it('NEVER throws when the quarantine write fails', async () => {
    mockHandleQuarantine.mockRejectedValue(new Error('queue down'));

    const result = await recordGatewayDecision(decision({ action: 'QUARANTINED' }));

    expect(result.eventId).toBeNull();
    expect(result.error).toBe('queue down');
  });

  it('logs the degradation rather than swallowing it silently', async () => {
    mockLogEvent.mockRejectedValue(new Error('db down'));
    await recordGatewayDecision(decision());
    expect(console.error).toHaveBeenCalled();
  });
});
