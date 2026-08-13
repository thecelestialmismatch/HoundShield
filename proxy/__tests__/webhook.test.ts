/**
 * Metadata-only webhook tests.
 *
 * `webhook.ts` is the only module that posts anything about a scanned prompt
 * off the customer's network, so its batching and its payload shape are both
 * worth pinning. It had partial coverage: `enqueueEvent` ran because
 * `ooda/loop.ts` calls it, but nothing exercised the flush paths at all.
 *
 * On the payload assertions below, one thing is worth stating plainly rather
 * than implying: the module header promises it "NEVER transmits prompt text,
 * CUI content, user messages, response content." That promise is kept by the
 * `Omit<EventPayload, "timestamp" | "source">` parameter type and by the fact
 * that `ooda/loop.ts:238` was the single call site, NOT by the module: `flush`
 * serialised `{ ...event }` and forwarded whatever keys it was handed.
 *
 * That gap is now closed. `EventSchema` in webhook.ts strips at enqueue time,
 * matching the zod strip posture `schema.ts` uses on the request path for the
 * same reason. `strips an extra field a caller adds …` below is audit finding
 * 14 as an executable regression test — it failed before the schema existed.
 *
 * Delivery is deliberately lossy: a failed POST is swallowed and the batch is
 * dropped rather than re-queued, so a houndshield.com outage can never stall
 * or fail a scan. `webhook failure is swallowed …` pins that, because the
 * obvious "improvement" of re-queuing would put the proxy's latency at the
 * mercy of a remote host.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("node-fetch", () => ({ default: vi.fn() }));

import fetch from "node-fetch";
import { enqueueEvent, setWebhookLicenseKey, flushWebhook } from "../webhook.js";

const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 5000;
const NOW = "2026-08-12T00:00:00.000Z";

type EnqueuedEvent = Parameters<typeof enqueueEvent>[0];

/** A representative BLOCKED event, matching the shape `ooda/loop.ts` sends. */
function event(overrides: Partial<EnqueuedEvent> = {}): EnqueuedEvent {
  return {
    request_id: "req-1",
    org_id: "org-42",
    action: "BLOCKED",
    risk_level: "CRITICAL",
    pattern_name: "CAGE code",
    nist_control: "SC.3.177",
    scan_ms: 7,
    ...overrides,
  };
}

/** The single POST the module makes, decoded. */
function lastPost(): {
  url: string;
  headers: Record<string, string>;
  method: string;
  events: Array<Record<string, unknown>>;
} {
  const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1] as [
    string,
    { method: string; headers: Record<string, string>; body: string },
  ];
  const body = JSON.parse(init.body) as { events: Array<Record<string, unknown>> };
  return { url, headers: init.headers, method: init.method, events: body.events };
}

beforeEach(() => {
  fetchMock.mockReset();
  setWebhookLicenseKey("");
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
});

afterEach(async () => {
  // The queue is module state with no reset export, so drain it or the next
  // test inherits this one's events.
  await flushWebhook();
  vi.useRealTimers();
});

describe("enqueueEvent — batching", () => {
  it("does not post immediately; it waits for the batch window", () => {
    enqueueEvent(event());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the queue once the batch delay elapses", async () => {
    enqueueEvent(event());

    await vi.advanceTimersByTimeAsync(BATCH_DELAY_MS);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(lastPost().events).toHaveLength(1);
  });

  it("holds a partial batch for the full window, not a moment less", async () => {
    enqueueEvent(event());

    await vi.advanceTimersByTimeAsync(BATCH_DELAY_MS - 1);
    expect(fetchMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("posts immediately, without waiting, once the batch is full", () => {
    for (let i = 0; i < BATCH_SIZE - 1; i += 1) {
      enqueueEvent(event({ request_id: `req-${i}` }));
    }
    expect(fetchMock).not.toHaveBeenCalled();

    enqueueEvent(event({ request_id: "req-49" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(lastPost().events).toHaveLength(BATCH_SIZE);
  });

  it("caps a post at BATCH_SIZE and keeps the overflow queued", async () => {
    for (let i = 0; i < BATCH_SIZE + 10; i += 1) {
      enqueueEvent(event({ request_id: `req-${i}` }));
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(lastPost().events).toHaveLength(BATCH_SIZE);

    await flushWebhook();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(lastPost().events).toHaveLength(10);
    // The overflow is the tail, in order — nothing is dropped or reordered.
    expect(lastPost().events[0]?.["request_id"]).toBe("req-50");
    expect(lastPost().events[9]?.["request_id"]).toBe("req-59");
  });
});

describe("flushWebhook — shutdown drain", () => {
  it("posts a partial batch on demand", async () => {
    enqueueEvent(event());

    await flushWebhook();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(lastPost().events).toHaveLength(1);
  });

  it("makes no request when there is nothing queued", async () => {
    await flushWebhook();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("cancels the pending timer, so the drained batch is not posted twice", async () => {
    enqueueEvent(event());

    await flushWebhook();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(BATCH_DELAY_MS * 2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("the request itself", () => {
  it("POSTs JSON to the ingest endpoint with the source header", async () => {
    enqueueEvent(event());
    await flushWebhook();

    const post = lastPost();
    expect(post.url).toBe("https://houndshield.com/api/events/ingest");
    expect(post.method).toBe("POST");
    expect(post.headers["Content-Type"]).toBe("application/json");
    expect(post.headers["X-HoundShield-Source"]).toBe("docker-proxy");
  });

  it("authenticates with the licence key set at startup", async () => {
    setWebhookLicenseKey("hs_live_abc123");
    enqueueEvent(event());
    await flushWebhook();

    expect(lastPost().headers["Authorization"]).toBe("Bearer hs_live_abc123");
  });
});

describe("the payload is metadata only", () => {
  it("carries exactly the declared metadata fields and nothing else", async () => {
    enqueueEvent(event());
    await flushWebhook();

    const [sent] = lastPost().events;

    expect(sent).toEqual({
      request_id: "req-1",
      org_id: "org-42",
      action: "BLOCKED",
      risk_level: "CRITICAL",
      pattern_name: "CAGE code",
      nist_control: "SC.3.177",
      scan_ms: 7,
      source: "docker_proxy",
      timestamp: NOW,
    });
  });

  it("strips an extra field a caller adds, even one that gets past TypeScript", async () => {
    // This is audit finding 14, now closed and pinned.
    //
    // The pattern NAME belongs on the wire; the substring that matched it must
    // never appear. `ooda/loop.ts` honours that and TypeScript rejects the
    // object literal below without the cast — but before EventSchema existed,
    // `flush` serialised `{ ...event }`, so a cast, a spread of a wider object,
    // or a JS consumer of the built `dist/` silently POSTed CUI to
    // houndshield.com. This assertion failed then. It must never fail again.
    //
    // Why it matters beyond hygiene: in Mode B this webhook is the only channel
    // leaving the customer's network, so whether it can carry content decides
    // HIPAA Business Associate status under 45 CFR 160.103.
    enqueueEvent({ ...event(), matched_text: "CAGE code 1ABC2" } as EnqueuedEvent);
    await flushWebhook();

    const wire = JSON.stringify(lastPost().events);
    expect(wire).toContain("CAGE code"); // the pattern name still ships
    expect(wire).not.toContain("1ABC2"); // the matched content never does
    expect(lastPost().events[0]).not.toHaveProperty("matched_text");
  });

  it("drops an event that does not satisfy the schema rather than sending a partial", async () => {
    // A malformed event is worth less than the guarantee that only enumerated
    // fields leave the network, so the queue rejects it outright.
    enqueueEvent({ ...event(), scan_ms: "fast" as unknown as number } as EnqueuedEvent);
    await flushWebhook();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("omits the optional fields when a scan matched no pattern", async () => {
    enqueueEvent(
      event({ action: "ALLOWED", risk_level: "NONE", pattern_name: undefined, nist_control: undefined })
    );
    await flushWebhook();

    const [sent] = lastPost().events;
    expect(sent).not.toHaveProperty("pattern_name");
    expect(sent).not.toHaveProperty("nist_control");
    expect(sent?.["action"]).toBe("ALLOWED");
  });

  it("stamps the source and the time of the event, not the time of the post", async () => {
    enqueueEvent(event());

    // Four seconds pass inside the batch window before the POST goes out.
    await vi.advanceTimersByTimeAsync(4000);
    await flushWebhook();

    const [sent] = lastPost().events;
    expect(sent?.["source"]).toBe("docker_proxy");
    expect(sent?.["timestamp"]).toBe(NOW);
  });
});

describe("delivery failure never reaches the scan path", () => {
  it("swallows a rejected POST", async () => {
    fetchMock.mockRejectedValueOnce(new Error("ENOTFOUND houndshield.com"));

    enqueueEvent(event());

    await expect(flushWebhook()).resolves.toBeUndefined();
  });

  it("drops the failed batch rather than re-queuing it", async () => {
    fetchMock.mockRejectedValueOnce(new Error("ENOTFOUND houndshield.com"));
    enqueueEvent(event());
    await flushWebhook();

    // Deliberate, documented data loss: a retry queue would let a remote
    // outage grow unboundedly in a proxy that must never stall a scan.
    await flushWebhook();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps accepting events after a failure", async () => {
    fetchMock.mockRejectedValueOnce(new Error("ENOTFOUND houndshield.com"));
    enqueueEvent(event({ request_id: "req-fails" }));
    await flushWebhook();

    enqueueEvent(event({ request_id: "req-recovers" }));
    await flushWebhook();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(lastPost().events[0]?.["request_id"]).toBe("req-recovers");
  });
});
