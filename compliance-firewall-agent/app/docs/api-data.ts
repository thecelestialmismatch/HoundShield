/**
 * HoundShield API reference — the source of truth the /docs page renders.
 *
 * These are the REAL endpoints the proxy exposes (proxy/server.ts): the
 * OpenAI-compatible intercept plus the local audit / quarantine / policy
 * management routes. Every entry has a unique anchor id (so the sidebar links
 * actually navigate — the old page pointed every link at one #sdk anchor) and a
 * runnable sample in all three languages we advertise (cURL · JavaScript ·
 * Python). Kept as data, not JSX, so it is unit-testable and can't silently
 * drift from the sidebar. Guarded by app/docs/__tests__/api-data.test.ts.
 *
 * The gateway base is Mode A (hosted trial). For CUI, the customer runs the
 * same API on their own Docker host (Mode B) — base URL is the only change.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT';
export type Lang = 'curl' | 'js' | 'python';

export interface ApiField {
  name: string;
  type: string;
  required?: boolean;
  desc: string;
}

export interface CodeSample {
  curl: string;
  js: string;
  python: string;
}

export interface Endpoint {
  /** Anchor id used by the sidebar + the section (must be unique). */
  id: string;
  method: HttpMethod;
  path: string;
  title: string;
  summary: string;
  /** How the caller authenticates this route. */
  auth: string;
  /** Management route — requires the admin token. */
  admin?: boolean;
  headers?: ApiField[];
  params?: ApiField[];
  request: CodeSample;
  /** Example JSON response body. */
  response: string;
}

export const GATEWAY_BASE = 'https://proxy.houndshield.com';

export const LANG_LABEL: Record<Lang, string> = {
  curl: 'cURL',
  js: 'JavaScript',
  python: 'Python',
};

export const ENDPOINTS: readonly Endpoint[] = [
  {
    id: 'chat-completions',
    method: 'POST',
    path: '/v1/chat/completions',
    title: 'Gateway intercept',
    summary:
      'The main endpoint. OpenAI-compatible chat completions that pass through HoundShield first — every message is scanned for CUI, CAGE codes, contract numbers, PHI/PII and secrets in <10ms before the request reaches the upstream provider. Point any OpenAI-compatible SDK at the gateway and your code is unchanged.',
    auth: 'Bearer <your provider key> — the proxy validates its own license server-side.',
    headers: [
      { name: 'Authorization', type: 'string', required: true, desc: 'Bearer <provider API key> (e.g. your OpenAI key).' },
      { name: 'X-Provider', type: 'string', desc: 'Upstream provider: openai (default), anthropic, openrouter.' },
      { name: 'X-Provider-Api-Key', type: 'string', desc: 'Override the upstream key per request.' },
      { name: 'X-User-Id', type: 'string', desc: 'Attribute the event to a user (audit trail).' },
      { name: 'X-Session-Id', type: 'string', desc: 'Group events into a session.' },
    ],
    request: {
      curl: `curl ${GATEWAY_BASE}/v1/chat/completions \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "X-User-Id: alex@acme-defense.com" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      { "role": "user", "content": "Summarize our CAGE 1ABC2 contract" }
    ]
  }'`,
      js: `import OpenAI from "openai";

// Drop-in replacement — only the baseURL changes.
const client = new OpenAI({
  baseURL: "${GATEWAY_BASE}/v1",
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: { "X-User-Id": "alex@acme-defense.com" },
});

const res = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Summarize our CAGE 1ABC2 contract" }],
});
// HoundShield detects the CAGE code and blocks it locally
// before the request ever reaches OpenAI.`,
      python: `from openai import OpenAI

client = OpenAI(
    base_url="${GATEWAY_BASE}/v1",
    api_key=os.environ["OPENAI_API_KEY"],
    default_headers={"X-User-Id": "alex@acme-defense.com"},
)

res = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Summarize our CAGE 1ABC2 contract"}],
)`,
    },
    response: `// When the prompt is CLEAN, you get the normal OpenAI response.
// When a violation is detected, the request is blocked locally:
{
  "id": "chatcmpl-hs-9f3c1a",
  "object": "chat.completion",
  "houndshield": {
    "action": "BLOCKED",
    "risk_level": "CRITICAL",
    "detections": [
      { "engine": "CUI", "pattern": "CAGE code", "nist_control": "SC.L2-3.13.1" }
    ],
    "message": "Blocked before leaving your perimeter. Logged to the audit chain."
  }
}`,
  },
  {
    id: 'health',
    method: 'GET',
    path: '/health',
    title: 'Health check',
    summary: 'Liveness probe. No auth — safe for load balancers and uptime monitors.',
    auth: 'None.',
    request: {
      curl: `curl ${GATEWAY_BASE}/health`,
      js: `const r = await fetch("${GATEWAY_BASE}/health");
const health = await r.json();`,
      python: `import requests

health = requests.get("${GATEWAY_BASE}/health").json()`,
    },
    response: `{ "status": "ok", "version": "2.0.0", "source": "houndshield-proxy", "ooda": true }`,
  },
  {
    id: 'stats',
    method: 'GET',
    path: '/v1/stats',
    title: 'Live stats',
    summary: 'Aggregate counters for the gateway — total scanned, blocked, quarantined, and average detection latency.',
    auth: 'None (aggregate counts only, no prompt content).',
    request: {
      curl: `curl ${GATEWAY_BASE}/v1/stats`,
      js: `const r = await fetch("${GATEWAY_BASE}/v1/stats");
const { data } = await r.json();`,
      python: `import requests

data = requests.get("${GATEWAY_BASE}/v1/stats").json()["data"]`,
    },
    response: `{ "success": true, "data": { "scanned": 14388, "blocked": 512, "quarantined": 37, "avg_ms": 8 } }`,
  },
  {
    id: 'events',
    method: 'GET',
    path: '/v1/events',
    title: 'Audit log',
    summary: 'The tamper-evident, SHA-256 hash-chained event log — the C3PAO evidence trail. Filter by action or time window and page through with limit/offset.',
    auth: 'Admin token.',
    admin: true,
    params: [
      { name: 'limit', type: 'int', desc: 'Max rows (default 100, max 500).' },
      { name: 'offset', type: 'int', desc: 'Pagination offset.' },
      { name: 'action', type: 'string', desc: 'Filter: BLOCKED | QUARANTINED | ALLOWED.' },
      { name: 'since', type: 'ISO 8601', desc: 'Only events at/after this timestamp.' },
    ],
    request: {
      curl: `curl "${GATEWAY_BASE}/v1/events?action=BLOCKED&limit=50" \\
  -H "x-admin-token: $HOUNDSHIELD_ADMIN_TOKEN"`,
      js: `const r = await fetch("${GATEWAY_BASE}/v1/events?action=BLOCKED&limit=50", {
  headers: { "x-admin-token": process.env.HOUNDSHIELD_ADMIN_TOKEN },
});
const { data } = await r.json();`,
      python: `import os, requests

r = requests.get(
    "${GATEWAY_BASE}/v1/events",
    params={"action": "BLOCKED", "limit": 50},
    headers={"x-admin-token": os.environ["HOUNDSHIELD_ADMIN_TOKEN"]},
)
events = r.json()["data"]`,
    },
    response: `{
  "success": true,
  "data": [
    {
      "request_id": "9f3c1a…",
      "action": "BLOCKED",
      "risk_level": "CRITICAL",
      "engine": "CUI",
      "nist_control": "SC.L2-3.13.1",
      "hash": "a3f1…",
      "prev_hash": "77c8…",
      "ts": "2026-07-18T14:22:33Z"
    }
  ]
}`,
  },
  {
    id: 'quarantine',
    method: 'GET',
    path: '/v1/quarantine',
    title: 'Quarantine queue',
    summary: 'List requests held for human review. Scoped to one org; filter by status.',
    auth: 'Admin token.',
    admin: true,
    params: [
      { name: 'org_id', type: 'string', required: true, desc: 'Organization to scope to.' },
      { name: 'status', type: 'string', desc: 'pending (default) | released | blocked.' },
      { name: 'limit', type: 'int', desc: 'Max rows (default 100, max 500).' },
    ],
    request: {
      curl: `curl "${GATEWAY_BASE}/v1/quarantine?org_id=acme-defense&status=pending" \\
  -H "x-admin-token: $HOUNDSHIELD_ADMIN_TOKEN"`,
      js: `const r = await fetch(
  "${GATEWAY_BASE}/v1/quarantine?org_id=acme-defense&status=pending",
  { headers: { "x-admin-token": process.env.HOUNDSHIELD_ADMIN_TOKEN } },
);
const { data } = await r.json();`,
      python: `import os, requests

r = requests.get(
    "${GATEWAY_BASE}/v1/quarantine",
    params={"org_id": "acme-defense", "status": "pending"},
    headers={"x-admin-token": os.environ["HOUNDSHIELD_ADMIN_TOKEN"]},
)
queue = r.json()["data"]`,
    },
    response: `{ "success": true, "data": [ { "request_id": "9f3c1a…", "risk_level": "HIGH", "engine": "PHI", "ts": "2026-07-18T14:20:01Z" } ] }`,
  },
  {
    id: 'quarantine-review',
    method: 'PUT',
    path: '/v1/quarantine/:requestId',
    title: 'Review a quarantined request',
    summary: 'Release (allow through) or block a held request. The decision and reviewer are written to the audit chain.',
    auth: 'Admin token.',
    admin: true,
    params: [
      { name: 'status', type: 'string', required: true, desc: 'released | blocked (body).' },
      { name: 'reviewed_by', type: 'string', desc: 'Who made the call (body).' },
    ],
    request: {
      curl: `curl -X PUT ${GATEWAY_BASE}/v1/quarantine/9f3c1a \\
  -H "x-admin-token: $HOUNDSHIELD_ADMIN_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{ "status": "released", "reviewed_by": "alex@acme-defense.com" }'`,
      js: `await fetch("${GATEWAY_BASE}/v1/quarantine/9f3c1a", {
  method: "PUT",
  headers: {
    "x-admin-token": process.env.HOUNDSHIELD_ADMIN_TOKEN,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ status: "released", reviewed_by: "alex@acme-defense.com" }),
});`,
      python: `import os, requests

requests.put(
    "${GATEWAY_BASE}/v1/quarantine/9f3c1a",
    headers={"x-admin-token": os.environ["HOUNDSHIELD_ADMIN_TOKEN"]},
    json={"status": "released", "reviewed_by": "alex@acme-defense.com"},
)`,
    },
    response: `{ "success": true }`,
  },
  {
    id: 'policy',
    method: 'PUT',
    path: '/v1/policy/:orgId',
    title: 'Update org policy',
    summary: "Read (GET) or update (PUT) an organization's detection policy — which engines are active and how each risk level is handled (block vs quarantine).",
    auth: 'Admin token.',
    admin: true,
    request: {
      curl: `curl -X PUT ${GATEWAY_BASE}/v1/policy/acme-defense \\
  -H "x-admin-token: $HOUNDSHIELD_ADMIN_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{ "engines": { "CUI": "block", "PHI": "block", "PII": "quarantine" } }'`,
      js: `await fetch("${GATEWAY_BASE}/v1/policy/acme-defense", {
  method: "PUT",
  headers: {
    "x-admin-token": process.env.HOUNDSHIELD_ADMIN_TOKEN,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ engines: { CUI: "block", PHI: "block", PII: "quarantine" } }),
});`,
      python: `import os, requests

requests.put(
    "${GATEWAY_BASE}/v1/policy/acme-defense",
    headers={"x-admin-token": os.environ["HOUNDSHIELD_ADMIN_TOKEN"]},
    json={"engines": {"CUI": "block", "PHI": "block", "PII": "quarantine"}},
)`,
    },
    response: `{ "success": true, "org_id": "acme-defense" }`,
  },
];

/** Sidebar sections, each linking to a REAL anchor on the page. */
export const DOC_NAV: Array<{ group: string; items: Array<{ label: string; href: string }> }> = [
  {
    group: 'Guide',
    items: [
      { label: 'Quickstart', href: '#quickstart' },
      { label: 'Authentication', href: '#authentication' },
      { label: 'What gets detected', href: '#detected' },
    ],
  },
  {
    group: 'Endpoints',
    items: ENDPOINTS.map((e) => ({ label: e.title, href: `#${e.id}` })),
  },
];
