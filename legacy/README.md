# Legacy — Deprecated Code Archive

Files moved here have been superseded. Nothing here is in the active build.
Each entry explains what it was and why it was retired.

---

## Deprecated Approaches

### `unoptimized: true` in next.config.js
**Removed:** 2026-04-16 (PR #38)  
**What it was:** `images: { unoptimized: true }` — disabled Next.js image optimization.  
**Why removed:** Was added to unblock the initial build. Left in by mistake. Disabling
optimization means Vercel serves raw PNG/JPEG instead of WebP/AVIF, wasting bandwidth
on every page load.  
**Replaced with:** `formats: ["image/avif", "image/webp"]` + `remotePatterns` for
Supabase and kaelus.online. Vercel auto-serves smallest format the browser supports.

---

## Known Technical Debt (not yet moved here)

These are in the active codebase but flagged for future cleanup:

| Item | Location | Why It's Debt |
|------|----------|---------------|
| `google/gemini-2.0-flash-exp:free` as scanner model | `lib/agent/agents.ts:58` | Free/experimental tier — switch to stable model before enterprise launch |
| Committed bundle artifacts | `cli.bundle.mjs`, `server.bundle.mjs` (context-mode pattern) | Should be generated at publish, not committed |
| GDPR cookie banner | Not implemented | Required for EU users, flagged in LAUNCH-CHECKLIST.md |
| PostHog funnel events | `NEXT_PUBLIC_POSTHOG_KEY` missing in Vercel | No conversion tracking until this is set |

---

## How to Archive Code Here

When retiring a significant approach:
1. Move files to `legacy/[feature-name]/`
2. Add entry to this README explaining what + why
3. Keep a reference in the relevant `advisory/architecture.md` ADR
