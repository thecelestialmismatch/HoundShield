# HERMES Redesign Demo — Live Port

Byte-for-byte reproduction of `HERMES-REDESIGN/houndshield-demo.html`, served live
inside the Next.js app. Nothing was reinterpreted — the exact file the design was
signed off on is shipped verbatim.

## Where it lives

| Path | Purpose |
|------|---------|
| `compliance-firewall-agent/public/hermes-demo.html` | The artifact — exact copy of the source (120,300 bytes, sha256 `b4d6db4a…d49f11`). |
| `compliance-firewall-agent/public/houndshield-logo.png` | The only asset the demo depends on (referenced relatively as `houndshield-logo.png`). |
| `compliance-firewall-agent/next.config.js` → `rewrites()` | Maps the clean URLs to the static file. |
| `compliance-firewall-agent/app/__tests__/hermes-demo.test.ts` | Fidelity contract — fails the build if the artifact drifts. |

## URLs (live after deploy)

- `/hermes` — clean URL (rewrite → `/hermes-demo.html`)
- `/hermes-redesign` — alias (rewrite → `/hermes-demo.html`)
- `/hermes-demo.html` — the raw static file

## What's included (the whole thing)

It is a single self-contained document — inline CSS, inline JS, an SVG icon
sprite, zero build step, zero external JS (only Google Fonts over the network).

- **Two design directions**, toggled by the floating switcher (`body[data-dir]`):
  - **A — Steel & Cream** (light editorial marketing)
  - **B — Midnight Command** (dark tactical SOC)
- **Marketing surface**: home, how-it-works, features, pricing (with monthly/annual
  toggle + comparison table), docs/quickstart, partners.
- **Six industry product pages**: Technology (SOC 2), Healthcare (HIPAA),
  Defense (CMMC L2), Legal & Finance (PCI), Five Eyes/Global (DISP), Government
  (FedRAMP — "coming soon").
- **Full live command center** (reached via "Start free" / "Sign in"): Overview
  KPIs, animated throughput canvas chart, streaming threat feed, SPRS posture
  ring, CMMC assessment, Reports (SSP / POA&M / evidence), and an on-device
  **Brain AI** chat with a keyword answer layer (who-are-you, what-is-HoundShield,
  SPRS, CMMC readiness, DFARS 7012, HIPAA, pricing, NIST).

All interactivity (client-side routing, billing toggle, direction toggle, live
counters, threat-feed streaming, Brain AI, the throughput chart) runs from the
demo's own inline `<script>`. The app's Content-Security-Policy already permits
it (`script-src` and `style-src` include `'unsafe-inline'`; `font-src` allows
`fonts.gstatic.com`).

## Why a static port (not native components)

The request was an **exact** copy. Re-authoring the demo as native Next.js /
React components would inevitably drift (token rounding, animation timing,
markup differences). Shipping the literal file guarantees pixel-for-pixel
fidelity and is provably correct — the test pins the sha256.

## Promote to homepage (optional, one line)

`/hermes` is live but does **not** replace the production homepage. To make this
the site root, add one rewrite to `next.config.js`:

```js
async rewrites() {
  return [
    { source: '/', destination: '/hermes-demo.html' }, // <- make it home
    { source: '/hermes', destination: '/hermes-demo.html' },
    { source: '/hermes-redesign', destination: '/hermes-demo.html' },
  ];
}
```

## Re-porting the source

If `HERMES-REDESIGN/houndshield-demo.html` changes and you want the update live:

```bash
cp HERMES-REDESIGN/houndshield-demo.html \
   compliance-firewall-agent/public/hermes-demo.html
shasum -a 256 compliance-firewall-agent/public/hermes-demo.html  # update the test
```

Then update `EXPECTED_BYTES` and `EXPECTED_SHA256` in
`app/__tests__/hermes-demo.test.ts`. The test is intentionally strict so the
served artifact can never silently diverge from the signed-off source.
