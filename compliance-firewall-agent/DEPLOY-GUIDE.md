# Deployment Guide — Compliance Firewall Agent

## Option A: Vercel (Recommended, free)

1. Push your code to GitHub:
   ```bash
   cd compliance-firewall-agent
   git init
   git add .
   git commit -m "Initial commit: Compliance Firewall Agent"
   ```

2. Go to github.com → New Repository → push your code

3. Go to vercel.com → Sign up free with GitHub

4. Click "Import Project" → select your repo

5. Add environment variables (same as your .env.local):
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - ENCRYPTION_KEY
   - NEXT_PUBLIC_APP_URL (set to your Vercel URL after first deploy)

6. Click Deploy → done. You get a URL like:
   `https://compliance-firewall-agent.vercel.app`

## Option B: Railway (free trial, then $5/mo)

1. Go to railway.app → sign up
2. New Project → Deploy from GitHub
3. Add env vars → Deploy
4. Get a custom URL

## Option C: Render (free tier)

1. Go to render.com → sign up
2. New Web Service → connect GitHub repo
3. Build command: `npm run build`
4. Start command: `npm run start`
5. Add env vars → Deploy

---

## After Deployment

Update NEXT_PUBLIC_APP_URL in your env vars to match
your live URL (e.g., https://your-app.vercel.app).

Your live endpoints:
- Dashboard: https://your-app.vercel.app/dashboard
- Gateway API: POST https://your-app.vercel.app/api/gateway/intercept
- Events: GET https://your-app.vercel.app/api/compliance/events
- Reports: GET https://your-app.vercel.app/api/reports/generate

---

## Cost Summary

| Service         | Cost    |
|-----------------|---------|
| Vercel hosting  | $0/mo   |
| Supabase DB     | $0/mo   |
| Custom domain   | $10/yr (optional) |
| **Total**       | **$0/mo** |
