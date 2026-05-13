# LeakWall — Admin Dashboard

AI data leakage prevention for teams of 5–50 people. This repo contains the admin dashboard, API routes, Supabase schema, and weekly email digest.

---

## File structure

```
leakwall/
├── supabase/
│   ├── schema.sql          ← Run first in Supabase SQL Editor
│   └── seed.sql            ← Run second for dev data
├── pages/
│   ├── api/
│   │   ├── dashboard/
│   │   │   └── stats.js    ← GET /api/dashboard/stats?days=7
│   │   └── weekly-digest.js ← POST (Vercel Cron, hourly)
│   └── dashboard/
│       └── index.jsx       ← Admin dashboard page
├── components/dashboard/   ← Reusable dashboard components
├── lib/
│   ├── supabase.js         ← Client + typed query helpers
│   └── buildDigestHtml.js  ← Email HTML builder
├── emails/
│   └── weekly-digest-preview.html ← Open in browser to preview email
├── vercel.json             ← Cron: fires /api/weekly-digest hourly
├── .env.example            ← Copy to .env.local
└── README.md
```

---

## Setup in 20 minutes

### 1. Supabase (5 min)
1. Create project at [supabase.com](https://supabase.com) (free)
2. Dashboard → SQL Editor → New query
3. Paste contents of `supabase/schema.sql` → Run
4. Paste contents of `supabase/seed.sql` → Run
5. Copy `Project URL` and `anon` key from Settings → API

### 2. Resend (2 min)
1. Create account at [resend.com](https://resend.com) (free: 100 emails/day)
2. Add and verify your domain (or use `onboarding@resend.dev` for testing)
3. Copy API key

### 3. Local dev (3 min)
```bash
cp .env.example .env.local
# Fill in SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
npm install
npm run dev
# Open http://localhost:3000/dashboard
```

### 4. Deploy to Vercel (5 min)
```bash
npx vercel
# Add env vars in Vercel dashboard → Settings → Environment Variables
```

The `vercel.json` cron fires `/api/weekly-digest` every hour. The route checks which orgs have a digest scheduled for this day + hour and sends only those.

### 5. Test the email
Open `emails/weekly-digest-preview.html` in any browser to see the email design. To send a real test:
```bash
curl -X POST http://localhost:3000/api/weekly-digest \
  -H "Authorization: Bearer your-CRON_SECRET"
```

---

## Chrome extension → dashboard data flow

```
Employee pastes in ChatGPT
  → Content script detects pattern (API key, SSN, etc.)
  → Checks member's policy (block/warn/log)
  → POSTs event to Supabase via service_role key:
      POST https://your-project.supabase.co/rest/v1/leak_events
      { org_id, member_id, ai_tool_name, severity, category,
        category_label, char_count, was_blocked, was_warned }
  → Admin opens dashboard
  → /api/dashboard/stats fetches events, aggregates, returns JSON
  → Dashboard renders: member table, event feed, chart, policies
  → Monday 9am UTC: Vercel Cron fires weekly-digest API
  → Admin email received with weekly summary
```

---

## Adding the extension token to each member

When a new member joins (via invite link), the extension receives their `extension_token` from `organization_members`. The extension stores this in `chrome.storage.local` and sends it with every event POST. The API validates the token against Supabase to get `member_id` and `org_id` — no auth credentials stored in the extension.

---

## Revenue milestones checklist

- [ ] First team onboarded (Day 30) → $49/month Founder's Deal
- [ ] 5 paying teams → $245/month
- [ ] 20 paying teams → $980/month — switch to $9/user/month pricing
- [ ] 100 paying teams × 10 avg seats → $9,000/month MRR
- [ ] Add Stripe webhook → auto-provision seats, auto-suspend non-payers
- [ ] Add annual plan at 20% discount → improves cash flow
