# Founder Actions — 2026-07-04

Two items found during the audit that **only the founder can resolve** (secrets / infra
dashboards). Neither is code; both are important.

## 1. Rotate exposed recovery codes (SECURITY — do first)

`FUTUREPARK/Backup_/` contained committed recovery/backup codes. They're now removed from
tracking, but **git history still has them**. Rotate:

- [ ] GitHub two-factor **recovery codes** (Settings → Password and authentication → Recovery codes → Regenerate)
- [ ] Vercel **recovery codes** (Account → Authentication)
- [ ] Stripe **backup code** (Dashboard → Profile → Two-step authentication → regenerate backup code)

Optional hard purge of history (rewrites history, force-push, breaks open clones):
```bash
git filter-repo --path FUTUREPARK/Backup_ --invert-paths
```

## 2. Fix the www / non-www canonicalization split (SEO)

**Problem.** `houndshield.com` 308-redirects to **`www.houndshield.com`** (a Vercel domain
setting), but the app disagrees with itself about which is canonical:

- `next.config.js` `redirects()` sends **www → non-www** (opposite of what prod does)
- Page `<link rel="canonical">` tags point at **non-www** (`https://houndshield.com/…`)
- `sitemap.ts` / `robots.ts` default `baseUrl` is **non-www**
- `CLAUDE.md` + primer call **www** the canonical URL

So search engines and AI crawlers see the site served at www while every canonical signal
points at non-www — a duplicate-content / signal-split that suppresses ranking and AI citation.

**Decide one canonical host, then make everything agree.** Recommended: **non-www**
(`houndshield.com`) — it's what the code already targets. Then:

- [ ] In the **Vercel dashboard** → Project → Domains: set `houndshield.com` as the primary
      and redirect `www` → `houndshield.com` (currently reversed).
- [ ] Confirm `curl -sIL https://www.houndshield.com` ends at `https://houndshield.com` (200), no loop.

If you prefer **www** as canonical instead, flip the code: `next.config.js` redirect direction,
all `canonical`/OG URLs, and `NEXT_PUBLIC_APP_URL`. Don't leave the two pointing opposite ways.

## 3. Deploy = redeploys prod

Vercel auto-deploys `main` on merge (`vercel.json` builds `compliance-firewall-agent/`).
Merging this PR redeploys production — no manual `vercel --prod` needed. After merge, verify:

- [ ] `curl -sI https://houndshield.com/compare | grep -i x-frame-options` → `DENY` (static-page header fix live)
- [ ] `/compare` and `/compare/nightfall` load and render.
