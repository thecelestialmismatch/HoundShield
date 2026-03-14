# 🛠️ Recommended Tech Stack Reference

> Source: User-provided best practices for vibe-coding apps.

---

## Current Kaelus.ai Stack

| Layer | Tool | Status |
|-------|------|--------|
| **IDE** | Antigravity (Cursor-based) + Claude Code | ✅ Active |
| **Web Framework** | Next.js 15 (App Router) | ✅ Active |
| **Database** | Supabase (Postgres) | ✅ Active |
| **Authentication** | Supabase Auth | ✅ Active |
| **Payments** | Stripe | ⚠️ Partially integrated |
| **Hosting** | Vercel (planned) | ❌ Not deployed yet |
| **Version Control** | GitHub | ✅ Active |
| **Animation** | Framer Motion | ✅ Active |
| **UI Components** | Custom + shadcn patterns | ✅ Active |
| **Styling** | Tailwind CSS + CSS Variables | ✅ Active |

---

## Recommended Additions

| Layer | Tool | Why | Priority |
|-------|------|-----|----------|
| **3D/WebGL** | Three.js / React Three Fiber | Premium visual experiences | Low |
| **Video Generation** | Remotion | Auto-generate compliance reports as video | Medium |
| **Workflow Automation** | n8n (via MCP) | Automate compliance workflows | Medium |
| **Monitoring** | Sentry + Vercel Analytics | Error tracking + performance | High |
| **Email** | Resend or PostMark | Transactional emails | High |
| **Background Jobs** | Inngest or Trigger.dev | Async compliance scanning | Medium |
| **AI Models** | OpenRouter or Groq | Multi-model LLM routing | Low |
| **Edge Functions** | Supabase Edge Functions | Serverless compute | Medium |

---

## Alternative Tools Reference

| Category | Options | Notes |
|----------|---------|-------|
| Database | Supabase, **Convex**, PlanetScale, Neon | Supabase already chosen |
| Auth | Supabase, **Clerk**, Firebase | Supabase already chosen |
| Payments | **Stripe**, RevenueCat, LemonSqueezy | Stripe already chosen |
| Hosting | **Vercel**, Replit, Netlify, Fly.io | Vercel recommended |
| AI | OpenAI, Anthropic, **Groq**, Google | Multi-provider via OpenRouter |
