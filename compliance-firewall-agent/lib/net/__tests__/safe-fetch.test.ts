/**
 * GUARD: the SSRF blocklist in lib/net/safe-fetch.ts.
 *
 * WHY THIS FILE IS THOROUGH. `POST /api/brain-ai/ingest` fetched a
 * caller-supplied URL from inside the Vercel function and stored the body in an
 * index the same caller could read back — an SSRF with an exfiltration channel
 * attached. The blocklist is the whole defence, and a blocklist with one hole
 * is not a blocklist. Every range below is a range someone has actually used to
 * reach a metadata service, so each gets an explicit case rather than a
 * representative sample.
 *
 * The DNS layer is mocked because the point under test is the JUDGEMENT
 * (does a resolved address get refused?), not the resolver. A test that made a
 * real lookup would be asserting the internet.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const lookupMock = vi.hoisted(() => vi.fn());
// A node: builtin is consumed as both named and default elsewhere in the graph,
// so the mock has to supply both or the import fails before any case runs.
vi.mock('dns/promises', () => ({ lookup: lookupMock, default: { lookup: lookupMock } }));

import {
  isBlockedAddress,
  assertFetchableUrl,
  BlockedUrlError,
  MAX_REDIRECTS,
} from '../safe-fetch';

/** Point every hostname at one address for the duration of a case. */
function resolvesTo(...addresses: string[]) {
  lookupMock.mockResolvedValue(addresses.map((address) => ({ address })));
}

beforeEach(() => {
  lookupMock.mockReset();
});

describe('isBlockedAddress — IPv4', () => {
  const BLOCKED: Array<[string, string]> = [
    ['0.0.0.0', '"this network" 0.0.0.0/8'],
    ['0.1.2.3', '0.0.0.0/8 interior'],
    ['10.0.0.1', 'private 10/8'],
    ['10.255.255.255', 'private 10/8 upper bound'],
    ['127.0.0.1', 'loopback'],
    ['127.1.2.3', 'loopback, non-canonical form'],
    ['169.254.169.254', 'AWS/GCP/Azure instance metadata — the classic SSRF target'],
    ['169.254.0.1', 'link-local generally'],
    ['172.16.0.1', 'private 172.16/12 lower bound'],
    ['172.31.255.255', 'private 172.16/12 upper bound'],
    ['192.168.1.1', 'private 192.168/16'],
    ['192.0.0.1', 'IETF protocol assignments 192.0.0.0/24'],
    ['100.64.0.1', 'CGNAT 100.64/10 lower bound'],
    ['100.127.255.255', 'CGNAT 100.64/10 upper bound'],
    ['224.0.0.1', 'multicast'],
    ['255.255.255.255', 'broadcast'],
  ];

  for (const [addr, why] of BLOCKED) {
    it(`blocks ${addr} (${why})`, () => {
      expect(isBlockedAddress(addr)).toBe(true);
    });
  }

  const ALLOWED: Array<[string, string]> = [
    ['8.8.8.8', 'public resolver'],
    ['1.1.1.1', 'public resolver'],
    ['172.15.255.255', 'just BELOW the private 172.16/12 block'],
    ['172.32.0.1', 'just ABOVE the private 172.16/12 block'],
    ['100.63.255.255', 'just below CGNAT'],
    ['100.128.0.1', 'just above CGNAT'],
    ['192.167.1.1', 'just below 192.168/16'],
    ['192.169.1.1', 'just above 192.168/16'],
    ['223.255.255.255', 'last address before the 224+ multicast cutoff'],
  ];

  for (const [addr, why] of ALLOWED) {
    it(`allows ${addr} (${why})`, () => {
      expect(isBlockedAddress(addr)).toBe(false);
    });
  }

  it('blocks anything that is not an address at all', () => {
    // Refusing to parse must mean refusing to dial, never "allow by default".
    expect(isBlockedAddress('not-an-ip')).toBe(true);
    expect(isBlockedAddress('')).toBe(true);
    expect(isBlockedAddress('999.999.999.999')).toBe(true);
  });
});

describe('isBlockedAddress — IPv6', () => {
  const BLOCKED: Array<[string, string]> = [
    ['::', 'unspecified'],
    ['::1', 'loopback'],
    ['fe80::1', 'link-local'],
    ['fc00::1', 'unique-local fc00::/7'],
    ['fd12:3456::1', 'unique-local, fd half'],
    ['ff02::1', 'multicast'],
    ['64:ff9b::1', 'NAT64 — translates straight back to an IPv4 target'],
  ];

  for (const [addr, why] of BLOCKED) {
    it(`blocks ${addr} (${why})`, () => {
      expect(isBlockedAddress(addr)).toBe(true);
    });
  }

  it('allows a public IPv6 address', () => {
    expect(isBlockedAddress('2606:4700:4700::1111')).toBe(false);
  });

  // The bypass a v6 blocklist written only for colons always misses.
  it('blocks IPv4-mapped IPv6 pointing at metadata (::ffff:169.254.169.254)', () => {
    expect(isBlockedAddress('::ffff:169.254.169.254')).toBe(true);
  });

  it('blocks IPv4-mapped IPv6 pointing at loopback (::ffff:127.0.0.1)', () => {
    expect(isBlockedAddress('::ffff:127.0.0.1')).toBe(true);
  });

  it('allows IPv4-mapped IPv6 pointing at a public address', () => {
    expect(isBlockedAddress('::ffff:8.8.8.8')).toBe(false);
  });
});

describe('assertFetchableUrl — scheme and authority', () => {
  it('refuses a non-http(s) scheme', async () => {
    await expect(assertFetchableUrl('file:///etc/passwd')).rejects.toThrow(BlockedUrlError);
    await expect(assertFetchableUrl('gopher://example.com/')).rejects.toThrow(BlockedUrlError);
    await expect(assertFetchableUrl('ftp://example.com/')).rejects.toThrow(BlockedUrlError);
  });

  it('refuses a string that is not an absolute URL', async () => {
    await expect(assertFetchableUrl('/relative/path')).rejects.toThrow(BlockedUrlError);
    await expect(assertFetchableUrl('nonsense')).rejects.toThrow(BlockedUrlError);
  });

  it('refuses plain http when allowInsecure is false', async () => {
    resolvesTo('8.8.8.8');
    await expect(assertFetchableUrl('http://example.com/', false)).rejects.toThrow(BlockedUrlError);
  });

  it('permits plain http when allowInsecure is true (local development)', async () => {
    resolvesTo('8.8.8.8');
    await expect(assertFetchableUrl('http://example.com/', true)).resolves.toBeInstanceOf(URL);
  });

  it('refuses credentials embedded in the authority', async () => {
    // user:pass@host confuses downstream parsers about which host is real.
    resolvesTo('8.8.8.8');
    await expect(
      assertFetchableUrl('https://user:pass@example.com/'),
    ).rejects.toThrow(BlockedUrlError);
  });
});

describe('assertFetchableUrl — address judgement', () => {
  it('refuses a literal private address without any DNS round-trip', async () => {
    await expect(assertFetchableUrl('https://169.254.169.254/latest/meta-data/')).rejects.toThrow(
      BlockedUrlError,
    );
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it('refuses a bracketed IPv6 literal for loopback', async () => {
    await expect(assertFetchableUrl('https://[::1]/')).rejects.toThrow(BlockedUrlError);
  });

  it('allows a public hostname', async () => {
    resolvesTo('93.184.216.34');
    await expect(assertFetchableUrl('https://example.com/page')).resolves.toBeInstanceOf(URL);
  });

  // The reason the guard resolves instead of pattern-matching hostnames.
  it('refuses a public-looking hostname whose A record points at loopback', async () => {
    resolvesTo('127.0.0.1');
    await expect(assertFetchableUrl('https://totally-legit.example.com/')).rejects.toThrow(
      BlockedUrlError,
    );
  });

  it('refuses a hostname that resolves to the cloud metadata address', async () => {
    resolvesTo('169.254.169.254');
    await expect(assertFetchableUrl('https://shortener.example/abc')).rejects.toThrow(
      BlockedUrlError,
    );
  });

  // A first-address-only check would pass this and then connect to whichever
  // record the OS resolver happened to pick.
  it('refuses when ANY resolved address is private, not just the first', async () => {
    resolvesTo('93.184.216.34', '10.0.0.5');
    await expect(assertFetchableUrl('https://dual-record.example/')).rejects.toThrow(
      BlockedUrlError,
    );
  });

  it('refuses a hostname that does not resolve', async () => {
    lookupMock.mockRejectedValue(new Error('ENOTFOUND'));
    await expect(assertFetchableUrl('https://nope.invalid/')).rejects.toThrow(BlockedUrlError);
  });

  it('refuses a hostname that resolves to an empty address set', async () => {
    lookupMock.mockResolvedValue([]);
    await expect(assertFetchableUrl('https://empty.example/')).rejects.toThrow(BlockedUrlError);
  });
});

describe('BlockedUrlError', () => {
  it('carries a reason but is never echoed to a caller verbatim', async () => {
    // The reason is for OUR logs. Asserting the shape keeps it diagnosable.
    const err = new BlockedUrlError('address is private or reserved');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('BlockedUrlError');
    expect(err.message).toContain('Refused to fetch URL');
  });
});

describe('redirect bound', () => {
  it('caps redirect hops at a small number', () => {
    // Each hop is re-resolved and re-judged, so the cap bounds work, not trust.
    expect(MAX_REDIRECTS).toBeGreaterThan(0);
    expect(MAX_REDIRECTS).toBeLessThanOrEqual(5);
  });
});
