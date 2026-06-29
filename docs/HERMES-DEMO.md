# HERMES Redesign — Live Site (Steel & Cream)

The HERMES redesign is the **live production site**. Two byte-for-byte static
artifacts are served verbatim by the Next.js app:

1. the **marketing SPA** — the homepage (`/`), and
2. the **Live Command Center** — the after-login dashboard (`/command-center`).

Nothing was reinterpreted as React components. The exact files the design was
signed off on are shipped as-is; only each `<head>` was given production SEO /
metadata. The visible body, inline CSS and inline JS are unchanged.

## Where it lives

| Path | Purpose |
|------|---------|
| `compliance-firewall-agent/public/hermes-demo.html` | Marketing SPA artifact (121,779 bytes, sha256 `a899f5f3…81e45`). Body byte-for-byte from `HERMES-REDESIGN/houndshield-demo.html`; production SEO `<head>`. |
| `compliance-firewall-agent/public/hermes-dashboard.html` | Live Command Center artifact (43,565 bytes, sha256 `1e9ebfdf…325420`). Body byte-for-byte from `HERMES-REDESIGN/houndshield-dashboard.html`; production `<head>` (noindex). |
| `compliance-firewall-agent/public/houndshield-logo.png` | The only image asset both artifacts depend on. |
| `compliance-firewall-agent/next.config.js` → `rewrites()` | Maps `/`, `/command-center` and the clean URLs to the static files. |
| `compliance-firewall-agent/app/__tests__/hermes-demo.test.ts` | Marketing fidelity contract — fails the build if the artifact drifts. |
| `compliance-firewall-agent/app/__tests__/hermes-dashboard.test.ts` | Dashboard fidelity contract — same guarantee. |

## URLs (live after deploy)

| URL | Serves |
|-----|--------|
| `/` | Marketing SPA (homepage) |
| `/hermes`, `/hermes-redesign` | Marketing SPA (aliases) |
| `/command-center` | Live Command Center (after-login dashboard) |
| `/dashboard` → `/command-center` | Redirect → dashboard |
| `/dashboard-live`, `/command-center-demo` | Live Command Center (aliases) |
| `/hermes-demo.html`, `/hermes-dashboard.html` | The raw static files |

The rewrites are in `beforeFiles` so they take precedence over the legacy
`app/page.tsx` and `app/command-center/page.tsx` routes (which remain in the repo,
unshadowed for `/command-center/*` subroutes, and are trivially restorable by
removing the rewrite lines).

## What's included (the whole thing)

Each is a single self-contained document — inline CSS, inline JS, an SVG icon
sprite, zero build step, zero external JS (only Google Fonts over the network).

### Marketing SPA (`/`)
- **Locked to Steel & Cream** (light editorial marketing). The design system
  still carries both `body[data-dir="A"]` (Steel & Cream) and `body[data-dir="B"]`
  (Midnight Command) token sets, but `<body data-dir="A">` is hard-set and the
  floating dev A/B switcher has been removed for production. The dark Midnight
  Command aesthetic lives on in the after-login dashboard, which is dark by design.
- **Hover mega-menus**: Products (by industry), Features, Pricing, Partners, Docs.
- **Marketing surface**: home, how-it-works, features, pricing (monthly/annual
  toggle + comparison table), docs/quickstart, partners.
- **Six industry product pages**: Technology (SOC 2), Healthcare (HIPAA),
  Defense (CMMC L2), Legal & Finance (PCI), Five Eyes/Global (DISP), Government
  (FedRAMP — "coming soon").
- **Embedded command center** (reached via "Start free" / "Sign in"): KPIs,
  animated throughput chart, streaming threat feed, SPRS ring, CMMC assessment,
  Reports, and on-device **Brain AI** chat.

### Live Command Center (`/command-center`)
The dedicated, richer after-login dashboard: live clock, p50 jitter, four KPI
counters, scrolling throughput canvas chart, detection-mix donut, streaming
threat feed (with feed badge), SPRS posture ring + count-up, "fastest wins" and
control-family breakdowns, Reports (SSP / POA&M / evidence export), Settings
(gateway URL, API key, plan & usage), and the on-device **Brain AI** answer
layer (who-are-you, what-is-HoundShield, SPRS, CMMC readiness, DFARS 7012).

All interactivity runs from each document's own inline `<script>`. The app's
Content-Security-Policy already permits it (`script-src`/`style-src` include
`'unsafe-inline'`; `font-src` allows `fonts.gstatic.com`; `img-src 'self'` covers
the logo).

## Why static artifacts (not native components)

The request was an **exact** copy. Re-authoring the design as native Next.js /
React components would inevitably drift (token rounding, animation timing,
markup differences). Shipping the literal files guarantees pixel-for-pixel
fidelity and is provably correct — the tests pin the sha256 of each artifact.

## Re-porting the source

If a `HERMES-REDESIGN/*.html` source changes and you want the update live:

```bash
# Marketing SPA
cp HERMES-REDESIGN/houndshield-demo.html \
   compliance-firewall-agent/public/hermes-demo.html
# Live Command Center
cp HERMES-REDESIGN/houndshield-dashboard.html \
   compliance-firewall-agent/public/hermes-dashboard.html

# Re-apply the production <head> (title/SEO for marketing, noindex for dashboard,
# fonts via CDN, root-absolute logo), then re-pin the tests:
shasum -a 256 compliance-firewall-agent/public/hermes-demo.html
shasum -a 256 compliance-firewall-agent/public/hermes-dashboard.html
```

Update `EXPECTED_BYTES` and `EXPECTED_SHA256` in the matching
`app/__tests__/hermes-*.test.ts`. The tests are intentionally strict so the
served artifacts can never silently diverge from the signed-off source.
