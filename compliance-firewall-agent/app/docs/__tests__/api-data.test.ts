import { describe, it, expect } from 'vitest';
import { ENDPOINTS, DOC_NAV, GATEWAY_BASE, LANG_LABEL, type Lang } from '../api-data';

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

  it('curl/http samples target the gateway base', () => {
    for (const e of ENDPOINTS) {
      expect(e.request.curl).toContain(GATEWAY_BASE);
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
