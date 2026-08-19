# Screenshot assets

`screenshots/*.png` are captured from a **production build of this repository**,
not designed mockups. They are committed so the README renders on GitHub without
depending on the live site. Re-capture them whenever the landing page changes —
a screenshot that predates a redesign is worse than none, because it still looks
authoritative.

## Regenerate

```bash
cd compliance-firewall-agent
npm run build

# The standalone output needs static assets and public/ copied in by hand.
cp -r .next/static .next/standalone/compliance-firewall-agent/.next/static
cp -r public        .next/standalone/compliance-firewall-agent/public

(cd .next/standalone/compliance-firewall-agent && PORT=3212 node server.js) &
node ../scripts/capture-screenshots.mjs
```

## Why a production build specifically

This app sets `output: standalone`. The three ways of serving it are **not**
interchangeable, and using the wrong one produces misleading screenshots:

| Server | Result |
|---|---|
| `next start` | refuses — warns `"next start" does not work with "output: standalone"` and misrenders routes |
| `next dev` | renders, but hides production-only client errors and adds dev overlays |
| `node .next/standalone/.../server.js` | ✅ what a visitor actually gets |

## Pages that need environment variables

The `/partner` portal reads Supabase config at render time and shows the error
boundary (`supabaseUrl is required`) when `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are absent. That is a **local environment
artifact, not a product defect** — Vercel supplies these in production.

`capture-screenshots.mjs` therefore captures the public `/partners` program page
and skips anything that renders an error boundary, exiting non-zero so a
silently-crashing page can never be committed as a screenshot. Do not remove
that check.
