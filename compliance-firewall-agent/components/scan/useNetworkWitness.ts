"use client";

import { useCallback, useRef } from "react";

/**
 * Watches every outbound-capable browser API for the duration of a scan and
 * reports what it saw.
 *
 * WHY THIS IS AN INSTRUMENT AND NOT A BADGE. "Your data never leaves your
 * device" is the product's central claim, and until now the page asserted it in
 * prose — which is exactly the shape of claim a security buyer discounts,
 * because prose cannot fail. This measures it: the four APIs a page could
 * actually use to exfiltrate text are wrapped for the scan window, and the
 * result is rendered. If the claim ever stopped being true, the number on
 * screen would change by itself.
 *
 * SCOPED TO THE SCAN WINDOW, ON PURPOSE. A counter running for the lifetime of
 * the page would eventually catch Next.js route prefetching or an analytics
 * beacon and report a non-zero count for something that has nothing to do with
 * the pasted text — an alarm that cries wolf teaches the operator to ignore it
 * (lessons.md, 2026-08-14). The honest measurement is "between pressing Scan
 * and seeing the result", which is precisely the interval the text exists in.
 *
 * AND IT RECORDS URLS, NOT JUST A COUNT. A bare "0" is unfalsifiable theatre.
 * Anything observed is captured and displayed, so the panel is inspectable
 * rather than reassuring.
 */

export interface NetworkWitnessReport {
  /** Total outbound calls observed during the watched window. */
  count: number;
  /** What was observed, so a non-zero result can be investigated, not guessed at. */
  calls: Array<{ api: "fetch" | "xhr" | "sendBeacon" | "websocket"; url: string }>;
  /** Wall-clock length of the watched window, ms. */
  windowMs: number;
}

type Patchable = {
  fetch?: typeof fetch;
  XMLHttpRequest?: typeof XMLHttpRequest;
  WebSocket?: typeof WebSocket;
  navigator?: Navigator;
};

/** Best-effort URL extraction; never throws, never blocks the real call. */
function describe(input: unknown): string {
  try {
    if (typeof input === "string") return input;
    if (input instanceof URL) return input.href;
    if (input && typeof input === "object" && "url" in input) {
      return String((input as { url: unknown }).url);
    }
  } catch {
    /* fall through */
  }
  return "<unknown>";
}

export function useNetworkWitness() {
  const active = useRef(false);

  /**
   * Run `work` with every outbound API under observation.
   *
   * The originals are always restored in a `finally`. Patching a global and
   * failing to put it back would break the rest of the application, so the
   * restore is unconditional and re-entrancy is refused rather than nested.
   */
  const watch = useCallback(
    async <T,>(work: () => T | Promise<T>): Promise<{ result: T; report: NetworkWitnessReport }> => {
      const calls: NetworkWitnessReport["calls"] = [];
      const started = typeof performance !== "undefined" ? performance.now() : 0;

      const g = (typeof globalThis !== "undefined" ? globalThis : {}) as Patchable & typeof globalThis;

      // Re-entrancy guard: a nested watch would restore the OUTER patches early
      // and silently stop observing. Refuse instead of half-measuring.
      if (active.current || typeof window === "undefined") {
        const result = await work();
        return {
          result,
          report: {
            count: 0,
            calls: [],
            windowMs: (typeof performance !== "undefined" ? performance.now() : 0) - started,
          },
        };
      }
      active.current = true;

      const realFetch = g.fetch;
      const RealXHR = g.XMLHttpRequest;
      const RealWS = g.WebSocket;
      const realBeacon = g.navigator?.sendBeacon?.bind(g.navigator);

      try {
        if (realFetch) {
          g.fetch = function patchedFetch(this: unknown, ...args: Parameters<typeof fetch>) {
            calls.push({ api: "fetch", url: describe(args[0]) });
            return realFetch.apply(this, args);
          } as typeof fetch;
        }

        if (RealXHR) {
          class WitnessedXHR extends RealXHR {
            override open(method: string, url: string | URL, ...rest: unknown[]) {
              calls.push({ api: "xhr", url: describe(url) });
              // @ts-expect-error — forwarding the native variadic signature
              return super.open(method, url, ...rest);
            }
          }
          g.XMLHttpRequest = WitnessedXHR as unknown as typeof XMLHttpRequest;
        }

        if (RealWS) {
          class WitnessedWS extends RealWS {
            constructor(url: string | URL, protocols?: string | string[]) {
              calls.push({ api: "websocket", url: describe(url) });
              super(url, protocols);
            }
          }
          g.WebSocket = WitnessedWS as unknown as typeof WebSocket;
        }

        if (realBeacon && g.navigator) {
          g.navigator.sendBeacon = ((url: string | URL, data?: BodyInit | null) => {
            calls.push({ api: "sendBeacon", url: describe(url) });
            return realBeacon(url, data);
          }) as Navigator["sendBeacon"];
        }

        const result = await work();
        return {
          result,
          report: {
            count: calls.length,
            calls,
            windowMs: (typeof performance !== "undefined" ? performance.now() : 0) - started,
          },
        };
      } finally {
        // Unconditional restore — a leaked patch would outlive the scan and
        // instrument the whole application.
        if (realFetch) g.fetch = realFetch;
        if (RealXHR) g.XMLHttpRequest = RealXHR;
        if (RealWS) g.WebSocket = RealWS;
        if (realBeacon && g.navigator) g.navigator.sendBeacon = realBeacon;
        active.current = false;
      }
    },
    [],
  );

  return { watch };
}
