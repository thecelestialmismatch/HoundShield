---
description: Build then ship a Vercel PREVIEW deploy of the app. Never touches production.
---
Run a safe preview deployment of `compliance-firewall-agent`:

1. `cd compliance-firewall-agent && npm run build` — must pass.
2. `vercel deploy` (preview). Capture the preview URL.
3. Smoke-check `/api/health` on the preview URL.
4. Report the URL. **Do not** run `vercel --prod` — production deploys require explicit owner approval (see CLAUDE.md).
