---
name: deploy
---

Pre-deploy checklist for Kaelus.Online:

## 1. BUILD
```bash
cd compliance-firewall-agent && npm run build
```
Must pass with zero errors. Fix TypeScript/build errors first.

## 2. SECURITY
- Run security-auditor agent on recent changes
- Verify no hardcoded secrets in changed files
- All new API routes have `supabase.auth.getUser()` check

## 3. MIGRATIONS
- `ls supabase/migrations/` — any new migrations not yet pushed?
- If yes: confirm with user, then `npx supabase db push`

## 4. ENV VARS
- `vercel env ls` — all required vars present?
- `STRIPE_WEBHOOK_SECRET` set?
- All `SUPABASE_*`, `OPENROUTER_API_KEY`, `RESEND_API_KEY` present?

## 5. DEPLOY (requires explicit user confirmation)
Ask: "Ready to deploy to production. Confirm? (yes/no)"
If yes: `vercel --prod`
Watch build logs.

## 6. POST-DEPLOY SMOKE TEST
- https://kaelus.online loads
- Auth flow: signup → onboarding
- Stripe webhook receiving events
- Monitor Sentry first 10 minutes
