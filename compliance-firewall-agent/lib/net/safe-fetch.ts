import { lookup } from 'dns/promises';
import { isIP } from 'net';

/**
 * SSRF-safe outbound fetch for any URL that originates from a request body.
 *
 * THE HOLE THIS CLOSES. `lib/brain-ai/ingestion.ts` called bare `fetch(url)` on
 * an address supplied by the caller, reachable from `POST /api/brain-ai/ingest`
 * — a route that was unauthenticated and live in production. The fetched body
 * was then stored in the knowledge index and readable back through the same
 * open endpoint, so it was not a blind SSRF: it had an exfiltration channel
 * attached. Anything the Vercel function could reach, a stranger could read.
 *
 * WHY DNS RESOLUTION AND NOT A HOSTNAME REGEX. Blocking the literal strings
 * "localhost" and "169.254.169.254" is the fix people reach for and it does not
 * work. `http://spoofed.example.com` can have an A record pointing at
 * 127.0.0.1; so can a shortener, and so can a domain the attacker controls. The
 * only property worth checking is the address the name actually resolves to, so
 * we resolve first and judge the IP.
 *
 * TOCTOU, stated rather than hidden. Between our `lookup()` and the kernel's
 * own resolution inside `fetch`, a hostile DNS server can change the answer —
 * classic DNS rebinding. Closing that completely means pinning the connection
 * to the address we checked, which Node's fetch does not expose without a
 * custom agent/dispatcher. What we do instead is bound the damage: every
 * redirect hop is re-resolved and re-checked (`redirect: 'manual'`), the
 * response is size-capped, and the whole thing is time-boxed. A rebind attacker
 * gets one request against an internal address whose body we then refuse to
 * grow without bound — not a general-purpose internal HTTP client.
 *
 * ponytail: no dispatcher pinning; add `undici.Agent` with a `connect` hook if
 * an authenticated caller ever gets to supply URLs.
 */

/** Only these schemes. `file:`, `gopher:`, `ftp:` and friends are never fetched. */
const ALLOWED_PROTOCOLS = new Set(['https:', 'http:']);

/** Redirect hops followed before giving up. Each one is re-validated. */
export const MAX_REDIRECTS = 3;

export interface SafeFetchOptions {
  timeoutMs?: number;
  /** Hard cap on the response body. Streams are truncated, not buffered whole. */
  maxBytes?: number;
  headers?: Record<string, string>;
  /** Permit plain http://. Off by default; used only for local development. */
  allowInsecure?: boolean;
}

export class BlockedUrlError extends Error {
  constructor(reason: string) {
    super(`Refused to fetch URL: ${reason}`);
    this.name = 'BlockedUrlError';
  }
}

/**
 * Is this a literal address that must never be dialled from a server?
 *
 * Covers, in order: IPv4 loopback / private / link-local (incl. the cloud
 * metadata address) / CGNAT / broadcast / this-network, then the IPv6
 * equivalents including IPv4-mapped forms, which are the usual way a blocklist
 * written only for dotted-quads gets walked around (`::ffff:169.254.169.254`).
 */
export function isBlockedAddress(ip: string): boolean {
  const addr = ip.trim().toLowerCase();
  const version = isIP(addr);
  if (version === 0) return true; // Not an address at all — refuse.

  if (version === 4) return isBlockedIpv4(addr);

  // IPv4-mapped and IPv4-compatible IPv6 (::ffff:1.2.3.4) — judge the v4 part,
  // or a v6 blocklist silently misses every v4 target.
  const mapped = addr.match(/^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedIpv4(mapped[1]);

  if (addr === '::' || addr === '::1') return true; // unspecified, loopback
  if (addr.startsWith('fe80')) return true; // link-local
  if (/^f[cd]/.test(addr)) return true; // fc00::/7 unique-local
  if (addr.startsWith('ff')) return true; // multicast
  // 64:ff9b::/96 — NAT64, which translates straight back to an IPv4 target.
  if (addr.startsWith('64:ff9b:')) return true;
  return false;
}

function isBlockedIpv4(addr: string): boolean {
  const parts = addr.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;

  if (a === 0) return true; // 0.0.0.0/8 "this network"
  if (a === 10) return true; // private
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local — AWS/GCP/Azure metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 192 && b === 0) return true; // 192.0.0.0/24 IETF protocol assignments
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a >= 224) return true; // multicast + reserved + 255.255.255.255
  return false;
}

/**
 * Parse, then resolve, then judge. Returns the validated URL or throws
 * `BlockedUrlError` with a reason safe to log (never echoed to a caller).
 */
export async function assertFetchableUrl(raw: string, allowInsecure = false): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new BlockedUrlError('not a valid absolute URL');
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new BlockedUrlError(`scheme ${url.protocol} is not permitted`);
  }
  if (url.protocol === 'http:' && !allowInsecure) {
    throw new BlockedUrlError('plain http is not permitted');
  }
  // Credentials in the authority are a classic way to confuse a downstream
  // parser about which host is really being contacted.
  if (url.username || url.password) {
    throw new BlockedUrlError('embedded credentials are not permitted');
  }

  const host = url.hostname.replace(/^\[|\]$/g, ''); // strip IPv6 brackets

  // A literal address needs no DNS round-trip.
  if (isIP(host) !== 0) {
    if (isBlockedAddress(host)) throw new BlockedUrlError('address is private or reserved');
    return url;
  }

  let resolved: { address: string }[];
  try {
    resolved = await lookup(host, { all: true });
  } catch {
    throw new BlockedUrlError('hostname does not resolve');
  }
  if (resolved.length === 0) throw new BlockedUrlError('hostname does not resolve');

  // EVERY address, not just the first. A hostname with both a public and a
  // private A record would otherwise pass on the public one and connect to
  // whichever the OS resolver happens to pick.
  for (const { address } of resolved) {
    if (isBlockedAddress(address)) {
      throw new BlockedUrlError('hostname resolves to a private or reserved address');
    }
  }

  return url;
}

/**
 * Fetch a caller-supplied URL with SSRF, redirect, size and time bounds.
 *
 * Redirects are handled here rather than by `fetch` because the platform
 * follows them without telling us where it went — and a 302 to
 * `http://169.254.169.254/` is the single most common way an allow-list that
 * only checks the first URL is defeated.
 */
export async function safeFetchText(
  rawUrl: string,
  options: SafeFetchOptions = {},
): Promise<string> {
  const {
    timeoutMs = 10_000,
    maxBytes = 500_000,
    headers = {},
    allowInsecure = process.env.NODE_ENV !== 'production',
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let current = await assertFetchableUrl(rawUrl, allowInsecure);

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const res = await fetch(current, {
        signal: controller.signal,
        redirect: 'manual',
        headers,
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) throw new BlockedUrlError('redirect without a Location header');
        // Re-validate the hop. Relative Locations resolve against the current URL.
        current = await assertFetchableUrl(new URL(location, current).toString(), allowInsecure);
        continue;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      // Trust the header when it is present and honest…
      const declared = Number(res.headers.get('content-length') ?? '');
      if (Number.isFinite(declared) && declared > maxBytes) {
        throw new BlockedUrlError(`response too large (${declared} > ${maxBytes})`);
      }
      // …but never rely on it. A server can lie or omit it, so the stream is
      // what actually enforces the cap.
      return await readCapped(res, maxBytes);
    }

    throw new BlockedUrlError(`more than ${MAX_REDIRECTS} redirects`);
  } finally {
    clearTimeout(timer);
  }
}

/** Read a response body, aborting as soon as it exceeds `maxBytes`. */
async function readCapped(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return '';
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        throw new BlockedUrlError(`response exceeded ${maxBytes} bytes`);
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
  } finally {
    reader.releaseLock();
  }

  chunks.push(decoder.decode());
  return chunks.join('');
}
