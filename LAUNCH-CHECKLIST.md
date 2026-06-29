# Hound Shield — SaaS Launch Checklist

**68 items · 10 categories · Updated: 2026-03-28**
Status key:  Done ·  Needed · ️ Partial ·  Needs key/config

---

##  Analytics & Tracking

-  Product analytics installed — PostHog (NEXT_PUBLIC_POSTHOG_KEY set)
- ️ Key activation & retention events defined — pageviews only; funnel events (signup→activation→upgrade) not yet defined
-  Google Search Console verified and sitemap submitted
-  Bing Webmaster Tools set up
-  Session replay enabled — PostHog session replay
-  Funnel tracking: signup → activation → conversion — PostHog funnels not configured

---

##  SEO & Discoverability

-  XML sitemap generated and submitted
- ️ robots.txt — check if exists at /public/robots.txt
-  OpenGraph images for all key pages
-  Twitter / X card meta tags
-  Structured data / JSON-LD (Organization, Product, FAQ)
-  Canonical URLs on every page
- ️ Meta titles & descriptions — homepage has them; other pages need audit
-  Social previews tested

---

##  Branding & Assets

-  Favicon — Logo component used (check /public/favicon.ico exists)
-  Apple Touch Icon (180×180)
-  Web App Manifest
-  Custom 404 page — using Next.js default
- ️ Loading skeletons — some pages have them
- ️ Empty states — Command Center needs first-time user empty states
- ️ Images optimized — Next.js image optimization on (unoptimized: true in config — fix this)

---

## ️ Legal & Compliance

-  Privacy Policy — /privacy page exists (linked from signup)
-  Terms of Service — /terms page exists (linked from signup)
-  Cookie consent banner (GDPR) — not implemented
-  Data Processing Agreement — needed for B2B defense/healthcare clients
-  GDPR data export / deletion flow
-  Acceptable Use Policy

---

##  Security

-  HTTPS everywhere — Vercel handles HTTPS + HSTS in middleware
-  Security headers — CSP, HSTS, X-Frame-Options, X-XSS in middleware.ts + next.config.js
-  Input validation — password length check, email type validation
-  Rate limiting — middleware.ts rate limiter (60 req/min)
-  security.txt — add to /public/.well-known/security.txt
-  Secrets in env vars — .gitignore hardened, no secrets in code
-  Dependency vulnerability scanning — run npm audit

---

## ️ Email & Communications

-  Support email — no support@houndshield.com routing visible
-  Transactional email — Resend (RESEND_API_KEY set in production)
-  SPF, DKIM, DMARC records — check DNS configuration
- ️ Welcome email — /api/email/welcome route exists; verify it fires on signup
-  Password reset — /forgot-password page linked from login
-  Email templates tested across clients
-  Unsubscribe link in marketing emails

---

##  Monitoring & Reliability

-  Error tracking — Sentry (NEXT_PUBLIC_SENTRY_DSN set, sentry.client.config.ts exists)
-  Uptime monitoring — no BetterStack/UptimeRobot configured
-  Structured logging in production — Sentry captures errors but no structured request logs
-  Public status page
-  Alerting (Slack/email/PagerDuty)
-  Database backup strategy — Supabase has daily backups on Pro plan; verify plan

---

##  Billing & Payments

-  Stripe integrated — STRIPE_SECRET_KEY + price IDs all set in production
- ️ Upgrade/downgrade flows — implemented; needs E2E test
-  Failed payment & dunning — STRIPE_WEBHOOK_SECRET set 4d ago; webhook endpoint /api/stripe/webhook exists; needs production test
- ️ Cancellation flow — webhook handles subscription.deleted; no in-app cancel button
-  Invoice generation — Stripe auto-generates invoices
- ️ Free trial edge cases — gating implemented; needs test
-  Tax handling — Stripe Tax not configured

---

##  Performance

-  Lighthouse score > 90 — not measured; images.unoptimized: true hurts score
-  Core Web Vitals passing — not measured
-  CDN for static assets — Vercel Edge Network
- ️ Lazy loading — PlatformDashboard is dynamic/ssr:false; other heavy components need audit
-  Compression — compress: true in next.config.js

---

##  Launch Day

-  Changelog / What's New page
-  Feedback widget (Canny/Featurebase/plain form)
-  Documentation — /docs page with CMMC quickstart exists
-  Onboarding flow tested with a real person
-  Production smoke test E2E — BLOCKER: signup "Failed to fetch" must be fixed first
-  Social sharing copy & visuals prepared
-  Launch post ready (Product Hunt, HN, Reddit, X)
-  Rollback plan — Vercel instant rollback via dashboard

---

##  IMMEDIATE BLOCKERS (Fix Before Any Launch)

1. **Signup "Failed to fetch"** — Go to Supabase → Auth → URL Configuration → add `https://houndshield.com` and `https://houndshield.com/**` to Redirect URLs
2. **Supabase migrations 003+004** — Run `npx supabase db push` to apply to production DB
3. **Cookie consent banner** — Required for GDPR compliance (EU users)
4. **SPF/DKIM/DMARC** — Email deliverability for confirmation/welcome emails
5. **Stripe webhook E2E test** — Confirm invoice.paid → subscription upgrade flow works

##  WEEK 2 PRIORITIES

1. XML sitemap + Google Search Console
2. OG images for all pages
3. Uptime monitoring (BetterStack free tier)
4. Lighthouse audit + fix images.unoptimized
5. PostHog funnel events for activation tracking
6. Support email routing (support@houndshield.com)
7. Cancellation in-app flow
