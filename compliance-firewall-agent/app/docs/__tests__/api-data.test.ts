import { describe, it, expect } from 'vitest';
import { ENDPOINTS, DOC_NAV, GATEWAY_BASE, PROXY_BASE, LANG_LABEL, type Lang } from '../api-data';

describe('API reference data integrity', () => {
  it('every endpoint has a unique anchor id', () => {
    const ids = ENDPOINTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('anchor ids are URL-fragment safe', () => {
    for (const e of ENDPOINTS) {
      expect(e.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('every method is a real HTTP verb', () => {
    for (const e of ENDPOINTS) {
      expect(['GET', 'POST', 'PUT']).toContain(e.method);
    }
  });

  it('every endpoint ships a runnable sample in all three languages', () => {
    const langs: Lang[] = ['curl', 'js', 'python'];
    for (const e of ENDPOINTS) {
      for (const l of langs) {
        expect(e.request[l], `${e.id} · ${l}`).toBeTruthy();
        expect(e.request[l].length).toBeGreaterThan(10);
      }
      expect(e.response.length).toBeGreaterThan(2);
      expect(e.summary.length).toBeGreaterThan(20);
      expect(e.auth.length).toBeGreaterThan(0);
    }
  });

  // Two products, two base URLs. `/v1/stats` and `/v1/events` live in
  // proxy/server.ts and answer 404 on the hosted rail; documenting them against
  // GATEWAY_BASE handed every reader an unrunnable curl — and implied that an
  // unauthenticated stats route was public on a MULTI-TENANT host, which it
  // must never be. The scope flag is what keeps the two apart.
  const langs: Lang[] = ['curl', 'js', 'python'];

  it('hosted endpoints target the hosted base, and only that', () => {
    for (const e of ENDPOINTS.filter((x) => !x.selfHosted)) {
      for (const l of langs) {
        expect(e.request[l], `${e.id} · ${l}`).toContain(GATEWAY_BASE);
        expect(e.request[l], `${e.id} · ${l} points at a proxy`).not.toContain(PROXY_BASE);
      }
    }
  });

  it("self-hosted endpoints target the customer's own proxy, never the shared host", () => {
    const selfHosted = ENDPOINTS.filter((e) => e.selfHosted);
    // If this drops to zero the guard below stops guarding anything.
    expect(selfHosted.length).toBeGreaterThan(0);
    for (const e of selfHosted) {
      for (const l of langs) {
        expect(e.request[l], `${e.id} · ${l}`).toContain(PROXY_BASE);
        expect(e.request[l], `${e.id} · ${l} leaks onto the hosted rail`).not.toContain(
          GATEWAY_BASE
        );
      }
    }
  });

  it('an unauthenticated endpoint is never advertised on the shared host', () => {
    // No-auth on your own single-tenant container is fine. No-auth on the
    // multi-tenant host would expose one customer's volume to every other.
    for (const e of ENDPOINTS.filter((x) => !x.selfHosted)) {
      if (/^none\.?$/i.test(e.auth.trim())) {
        expect(['health'], `${e.id} is public on the shared host`).toContain(e.id);
      }
    }
  });

  it('the language switcher has a label for every language', () => {
    expect(Object.keys(LANG_LABEL).sort()).toEqual(['curl', 'js', 'python']);
  });
});

describe('sidebar navigation has no dead links', () => {
  it('every Endpoints link resolves to a real endpoint anchor', () => {
    const anchors = new Set(ENDPOINTS.map((e) => `#${e.id}`));
    const endpointsGroup = DOC_NAV.find((g) => g.group === 'Endpoints');
    expect(endpointsGroup).toBeTruthy();
    for (const item of endpointsGroup!.items) {
      expect(anchors.has(item.href), `dead link: ${item.label} → ${item.href}`).toBe(true);
    }
  });

  it('every Endpoints link is unique (no two links to the same anchor — the old bug)', () => {
    const endpointsGroup = DOC_NAV.find((g) => g.group === 'Endpoints')!;
    const hrefs = endpointsGroup.items.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('Guide links point to real on-page sections', () => {
    const guide = DOC_NAV.find((g) => g.group === 'Guide')!;
    const validGuideAnchors = new Set(['#quickstart', '#authentication', '#detected']);
    for (const item of guide.items) {
      expect(validGuideAnchors.has(item.href)).toBe(true);
    }
  });
});
