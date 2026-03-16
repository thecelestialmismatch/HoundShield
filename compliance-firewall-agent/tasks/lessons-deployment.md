# Kaelus.ai — Deployment Log

Read this at the START of every session. Never repeat a deployment failure twice.
Format: [date] | what happened | exact files changed | rule to prevent next time

---

## DEPLOYMENT RULES (always check before ANY push to Vercel)

### Pre-Deployment Checklist
- [ ] ALL env vars filled in Vercel dashboard (not just .env.local)
- [ ] `npm run build` passes locally with zero errors
- [ ] Supabase migrations applied to production DB
- [ ] NEXT_PUBLIC_APP_URL set to production URL (not localhost)
- [ ] STRIPE_WEBHOOK_SECRET matches the webhook configured in Stripe dashboard
- [ ] `git config user.email` matches thecelestialmismatch@gmail.com (Vercel account owner's GitHub email)
- [ ] User has reviewed exact file list and confirmed deployment is safe
- [ ] WebSocket note acknowledged: Vercel = SSE only, WS needs Docker/Railway

### Known Vercel Constraints for This Project
1. **WebSocket**: `server.ts` custom WS server does NOT run on Vercel. Use SSE endpoints only.
2. **standalone output**: `output: "standalone"` in next.config.js — verify this is compatible with Vercel (it is, but adds complexity; Docker builds use it directly).
3. **Environment**: Vercel requires ALL env vars set in dashboard → Settings → Environment Variables for each environment (Production, Preview, Development).
4. **Build root**: Vercel must be configured to build from `compliance-firewall-agent/` subdirectory, NOT the repo root.

---

## DEPLOYMENT HISTORY

| Date | Status | Environment | What changed | Errors | Prevention rule |
|------|--------|-------------|--------------|--------|-----------------|
| 2026-03-16 | BLOCKED | Preview | Branch feat/branding-shieldready-polish, commit 2ae7928 | "Deployment blocked — GitHub could not associate the committer with a GitHub user. Hobby teams do not support collaboration." | Set git identity to thecelestialmismatch@gmail.com |
| 2026-03-16 | PUSHED ✅ | Preview | Empty commit 3072fed — git identity fix | zsh: harmless comment paste errors; push succeeded | Always paste commands one at a time to avoid shell comment errors |
| 2026-03-16 | PENDING ⏳ | Preview | Awaiting Vercel to process commit 3072fed | TBD — will update after Vercel build result | Check Vercel dashboard within 2 min of push |

### RULE: Git committer identity must match Vercel account owner's GitHub identity
**Root cause:** Commits were made with a git user identity (name/email) that does not match the GitHub account connected to Vercel (thecelestialmismatch). Vercel Hobby plan treats unrecognised committers as "collaboration" and blocks the deploy.

**Fix (run once in the repo):**
```bash
git config user.name "thecelestialmismatch"
git config user.email "thecelestialmismatch@gmail.com"
```
Then either:
- Make a new empty commit to trigger a fresh deployment: `git commit --allow-empty -m "fix: correct committer identity for Vercel"`
- OR amend recent commits: `git rebase HEAD~N --exec 'git commit --amend --reset-author --no-edit'` (risky — prefer empty commit)

**Prevention rule:** Before ANY push, verify `git config user.email` matches the GitHub account email linked to Vercel. Add this check to the pre-deployment checklist.

---

## TEMPLATE FOR NEW ENTRIES
[YYYY-MM-DD] | [success/failure] | [environment: production/preview/local] | [files changed] | [error message if failed] | [rule to prevent next time]
