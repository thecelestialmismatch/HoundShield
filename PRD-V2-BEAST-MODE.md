# Kaelus.ai V2 — BEAST MODE Product Requirements Document

**Version:** 2.0
**Date:** March 11, 2026
**Author:** V2 Architecture Team
**Status:** Active Development

---

## PART 1: PROJECT STATUS REPORT — WHERE WE ARE

### Current Phase: **Mid-Alpha (60% Complete)**

We have strong foundations but are not production-ready. Here's the honest breakdown:

### What's DONE and WORKING (The Good Stuff)

| Feature | Status | Quality |
|---------|--------|---------|
| Landing Page | DONE | Premium (hero, bento grid, sticky scroll, animations) |
| Command Center Layout | DONE | Sidebar, topbar, navigation, BEAST MODE badge |
| Command Center Overview Dashboard | DONE | Charts, stats, event table, system status, filters |
| SPRS Scoring Engine | DONE | Full NIST 800-171 methodology (-203 to +110) |
| 110 NIST Controls Database | DONE | All 14 families, all controls with guidance |
| Chat API (OpenRouter) | DONE | Streaming, 8 model options, compliance scanning |
| Agent Orchestrator | DONE | ReAct loop, 12 tools, streaming, cost tracking |
| Risk Classification | DONE | 16 detection patterns (PII, SSN, credit cards, etc.) |
| Rate Limiting Middleware | DONE | Per-endpoint limits, CSP headers |
| AES-256 Quarantine Encryption | DONE | Encrypt/decrypt quarantine items |
| SHA-256 Audit Trail | DONE | Immutable hash chain for compliance |
| Route Redirects | DONE | /dashboard and /shieldready → /command-center |
| Dark Theme + Brand Identity | DONE | Consistent across all pages |
| Next.js Config + Security Headers | DONE | CSP, X-Frame, Docker-ready standalone |

### What's PARTIALLY DONE (Needs Wiring)

| Feature | Status | What's Missing |
|---------|--------|----------------|
| Shield Assessment Walkthrough | UI EXISTS | localStorage works, but no export/PDF |
| Shield Gap Analysis | UI EXISTS | Calculates gaps, no remediation workflow |
| Shield Reports | UI EXISTS | No PDF generation, no export |
| Shield Resources | UI EXISTS | Static content, no dynamic resource library |
| AI Chat Interface | COMPONENT EXISTS | Not wired to /api/chat in command center |
| Agent Workspace | COMPONENT EXISTS | Not wired to /api/agent/execute |
| Agent Builder | COMPONENT EXISTS | UI shell, no actual agent creation |
| Knowledge Base | COMPONENT EXISTS | UI shell, no vector search |
| Live Scanner | COMPONENT EXISTS | UI shell, needs WebSocket feed |
| Real-Time Feed | COMPONENT EXISTS | UI shell, needs SSE connection |
| Quarantine Panel | COMPONENT EXISTS | UI shell, needs API integration |
| Event Log | COMPONENT EXISTS | UI shell, needs real event data |

### What's MISSING (Critical for Launch)

| Feature | Priority | Effort |
|---------|----------|--------|
| **Authentication** | P0 CRITICAL | 2-3 days |
| **Database Integration** (real data, not mock) | P0 CRITICAL | 3-5 days |
| **Deployment to Vercel** | P0 CRITICAL | 1 day |
| **Domain Setup** (kaelus.ai) | P0 CRITICAL | 1 day |
| **Payment/Billing** (Stripe) | P1 HIGH | 3-5 days |
| **Email System** (onboarding, alerts) | P1 HIGH | 2 days |
| **Error Tracking** (Sentry) | P2 MEDIUM | 1 day |
| **Analytics** (PostHog/Mixpanel) | P2 MEDIUM | 1 day |
| **SEO/Meta Tags** | P2 MEDIUM | 1 day |
| **Legal Pages** (Privacy, Terms, GDPR) | P2 MEDIUM | 1 day |

---

## PART 2: FINANCIAL REALITY CHECK — $0 BUDGET PLAN

### Free Tools We Can Use RIGHT NOW

| Tool | Purpose | Cost |
|------|---------|------|
| **Vercel** (Hobby) | Hosting + deployment | FREE |
| **Supabase** (Free Tier) | Database + Auth (500MB, 50k MAU) | FREE |
| **OpenRouter** (Free Models) | AI (Gemini Flash, Llama 3.3, DeepSeek) | FREE |
| **GitHub** | Code hosting + CI/CD | FREE |
| **Resend** (Free Tier) | Email (100/day) | FREE |
| **Sentry** (Free Tier) | Error tracking (5k events/mo) | FREE |
| **PostHog** (Free Tier) | Analytics (1M events/mo) | FREE |
| **Stripe** (No upfront cost) | Payments (only pay % on revenue) | FREE until revenue |
| **Cloudflare** (Free Tier) | DNS + CDN + DDoS protection | FREE |

**Total cost to go live: $0**
**First expense:** Domain name (~$12/year) — optional, can use vercel.app subdomain initially

### Revenue Model — How We Make Money

#### Tier 1: Free (Lead Generation)
- Landing page + demo mode (what we have now)
- CMMC self-assessment (110 controls, SPRS score)
- 100 API scans/month
- 1 AI agent
- Community support

#### Tier 2: Pro ($49/month)
- Unlimited API scanning
- 5 AI agents
- Real-time threat feed
- Gap analysis + remediation roadmap
- PDF compliance reports
- Email alerts
- Priority support

#### Tier 3: Enterprise ($199/month)
- Everything in Pro
- Unlimited AI agents
- Custom compliance policies
- Team management (5 seats)
- API gateway (intercept mode)
- Audit trail export
- Slack/webhook integrations
- Dedicated onboarding

#### Tier 4: Agency/MSP ($499/month)
- Multi-tenant dashboard
- White-label option
- 25 client accounts
- Bulk compliance reporting
- Partner API access

### First Revenue Target
- **Goal 1:** 10 paying Pro users = $490/month (covers domain + basic costs)
- **Goal 2:** 50 Pro + 5 Enterprise = $3,445/month (sustainable)
- **Goal 3:** 100 Pro + 20 Enterprise + 3 Agency = $10,377/month (growth mode)

---

## PART 3: GO-LIVE ROADMAP — THE SPRINT PLAN

### Phase 1: MVP Launch (Week 1-2) — GO LIVE
**Goal: Get the product live with free tier + Pro tier**

**Day 1-2: Authentication + Database**
- [ ] Wire Supabase Auth (email/password + Google OAuth)
- [ ] Create login/signup pages
- [ ] Add auth middleware to protect /command-center routes
- [ ] Create user profiles table in Supabase
- [ ] Create compliance_events table
- [ ] Create assessment_responses table (migrate from localStorage)
- [ ] Create quarantine_items table

**Day 3-4: Wire Real Data**
- [ ] Replace mock dashboard data with real Supabase queries
- [ ] Wire AI Chat to /api/chat with user context
- [ ] Wire Agent Workspace to /api/agent/execute
- [ ] Connect Live Scanner to real event stream
- [ ] Save assessment responses to Supabase (not just localStorage)

**Day 5-6: Stripe + Pricing**
- [ ] Set up Stripe products (Free/Pro/Enterprise)
- [ ] Build /pricing page with real checkout
- [ ] Add subscription status checks to features
- [ ] Implement usage tracking (API calls, agents, scans)

**Day 7: Deploy**
- [ ] Deploy to Vercel (connect GitHub repo)
- [ ] Set up environment variables in Vercel
- [ ] Configure custom domain (if purchased)
- [ ] Set up Cloudflare DNS
- [ ] SSL auto-configured by Vercel

**Day 8-9: Polish + Legal**
- [ ] Privacy Policy page
- [ ] Terms of Service page
- [ ] Cookie consent banner
- [ ] SEO meta tags on all pages
- [ ] Open Graph images for social sharing
- [ ] robots.txt + sitemap.xml

**Day 10: Soft Launch**
- [ ] Post on Product Hunt (prep listing)
- [ ] Post on r/cybersecurity, r/CMMC, r/compliance
- [ ] LinkedIn posts targeting defense contractors
- [ ] Twitter/X thread on AI compliance
- [ ] Set up Google Analytics / PostHog

### Phase 2: Growth Features (Week 3-4)

- [ ] PDF report generation (compliance reports)
- [ ] Email notification system (threat alerts)
- [ ] Team/organization management
- [ ] API key management for gateway mode
- [ ] Webhook integrations (Slack, Discord)
- [ ] Dashboard customization (drag/drop widgets)

### Phase 3: Scale (Month 2+)

- [ ] Multi-tenant architecture for agencies
- [ ] White-label customization
- [ ] Advanced AI agents (custom tool creation)
- [ ] Compliance templates beyond CMMC (SOC2, ISO 27001, HIPAA)
- [ ] Browser extension for real-time monitoring
- [ ] Mobile app (React Native)

---

## PART 4: WHAT TO GET RID OF

### Delete/Archive These (Not Needed for Launch)

| Item | Reason | Action |
|------|--------|--------|
| `components/landing/threat-globe.tsx` | Unused, heavy 3D component | DELETE |
| `components/landing/detection-grid.tsx` | Unused visual component | DELETE |
| `components/landing/pipeline-simulator.tsx` | Replaced by new landing page | DELETE |
| `components/landing/architecture-diagram.tsx` | Replaced by sticky scroll | DELETE |
| `components/landing/integration-code.tsx` | Replaced by new landing page | DELETE |
| `components/landing/react-loop.tsx` | Replaced | DELETE |
| `components/landing/how-it-works.tsx` | Replaced | DELETE |
| `components/landing/testimonials.tsx` | Replaced | DELETE |
| `components/landing/trusted-by.tsx` | Replaced | DELETE |
| `components/landing/newsletter-signup.tsx` | Replaced | DELETE |
| `components/landing/faq-section.tsx` | Replaced | DELETE |
| `components/landing/chat-widget.tsx` | Replaced by GlobalChat | DELETE |
| `app/shieldready/` (all legacy pages) | Redirected to /command-center/shield | MOVE TO v1/ |
| `app/dashboard/` (old dashboard) | Redirected to /command-center | MOVE TO v1/ |
| `components/dashboard/pixel-office.tsx` | Fun but not MVP | DEFER |
| `components/dashboard/memory-view.tsx` | Cool but not MVP | DEFER |
| `firebase-debug.log` | Debug artifact | DELETE |

### Keep but Don't Prioritize (Phase 2+)

- Pixel Office (gamification — cool for retention, not for launch)
- Memory DNA (agent personality — cool for differentiation, not for launch)
- Content Pipeline (project management — not core value prop)
- Calendar View (scheduling — not core value prop)

---

## PART 5: COMPETITIVE POSITIONING

### Who We're Up Against

| Competitor | What They Do | Our Advantage |
|-----------|-------------|---------------|
| **Nightfall AI** | DLP for AI (Series B, $100M+) | We're open-source, free tier, CMMC-specific |
| **Robust Intelligence** | AI security platform | We focus on SMB/defense contractors, not Fortune 500 |
| **Protect AI** | ML supply chain security | We do real-time scanning, not just model auditing |
| **Lakera** | LLM security (prompt injection) | We cover compliance + security, not just injection |
| **CalypsoAI** | AI security for government | We're 10x cheaper, self-hosted option |

### Our Unique Position
**"The only AI compliance firewall built specifically for defense contractors pursuing CMMC Level 2 certification."**

This is our wedge. 87,000+ companies in the Defense Industrial Base (DIB) need CMMC compliance by 2026. Most can't afford enterprise security tools. We're the affordable, self-hosted alternative.

---

## PART 6: TARGET CUSTOMER

### Primary: Small Defense Contractors (87,000+ companies)
- 10-200 employees
- Need CMMC Level 2 for DoD contracts
- Using AI tools (ChatGPT, Claude, etc.) internally
- No dedicated CISO or security team
- Budget: $50-500/month for compliance tools
- Pain: "We need CMMC but can't afford Deloitte"

### Secondary: MSPs/Compliance Consultants
- Serving 5-50 defense contractor clients
- Need multi-tenant compliance dashboard
- Want white-label option
- Budget: $500-2000/month
- Pain: "I'm manually assessing 30 clients"

### Tertiary: Tech Companies with Compliance Needs
- Any company using AI that needs SOC2/HIPAA/GDPR
- Growing concern about AI data leakage
- Budget: $50-200/month
- Pain: "Our employees are pasting customer data into ChatGPT"

---

## PART 7: KEY METRICS TO TRACK

### North Star Metric
**Monthly Active Assessments** — Number of CMMC assessments actively being worked on

### Supporting Metrics

| Metric | Target (Month 1) | Target (Month 3) |
|--------|------------------|------------------|
| Website visitors | 1,000 | 10,000 |
| Signups (free) | 100 | 500 |
| Free → Pro conversion | 5% | 8% |
| Monthly Recurring Revenue | $250 | $3,000 |
| Churn rate | <10% | <5% |
| SPRS assessments completed | 50 | 300 |
| API events scanned | 10,000 | 500,000 |
| NPS score | 30+ | 50+ |

---

## PART 8: TECHNICAL ARCHITECTURE (V2)

```
                    ┌─────────────────────────┐
                    │     kaelus.ai           │
                    │     (Vercel Edge)       │
                    └──────────┬──────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
     ┌────────▼───────┐ ┌─────▼──────┐ ┌──────▼───────┐
     │  Landing Page  │ │  Auth Flow │ │  API Gateway │
     │  (SSG/ISR)     │ │  (Supabase)│ │  (/api/*)    │
     └────────────────┘ └──────┬─────┘ └──────┬───────┘
                               │               │
                    ┌──────────▼───────────────▼──────┐
                    │         Command Center          │
                    │    (Protected, Client-Side)     │
                    ├─────────────────────────────────┤
                    │  Firewall │ Shield │ AI Agents  │
                    └──────────────────┬──────────────┘
                                       │
              ┌────────────────────────┼────────────────────┐
              │                        │                    │
     ┌────────▼────────┐    ┌─────────▼────────┐  ┌───────▼───────┐
     │   Supabase DB   │    │   OpenRouter AI  │  │  Stripe       │
     │   (PostgreSQL)  │    │   (Free Models)  │  │  (Payments)   │
     │   - users       │    │   - Gemini Flash │  │  - Pro plan   │
     │   - events      │    │   - Llama 3.3    │  │  - Enterprise │
     │   - assessments │    │   - DeepSeek V3  │  └───────────────┘
     │   - quarantine  │    └──────────────────┘
     └─────────────────┘
```

### Stack (V2 — Updated)

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 15.3 (App Router) | SSR + API routes + edge |
| UI | React 19 + Tailwind CSS 3.4 | Fast, modern, accessible |
| Charts | Recharts | Already integrated, lightweight |
| Animation | Framer Motion | Premium feel, scroll triggers |
| Icons | Lucide React | Consistent, tree-shakeable |
| Auth | Supabase Auth | Free, email + OAuth, RLS |
| Database | Supabase PostgreSQL | Free tier generous, RLS built-in |
| AI | OpenRouter (free models) | Zero cost, multiple providers |
| Payments | Stripe | Industry standard, no upfront cost |
| Hosting | Vercel (Hobby → Pro) | Free tier, auto-deploy from GitHub |
| CDN | Cloudflare (Free) | DDoS protection, global CDN |
| Email | Resend (Free) | 100 emails/day free |
| Monitoring | Sentry (Free) | 5k events/month |
| Analytics | PostHog (Free) | 1M events/month |

---

## PART 9: WHAT SUCCESS LOOKS LIKE

### 30 Days After Launch
- Product live on kaelus.ai (or .vercel.app)
- 100+ signups on free tier
- 5+ paying Pro customers ($245+ MRR)
- 50+ CMMC assessments started
- Featured on 2+ cybersecurity blogs/newsletters

### 90 Days After Launch
- 500+ total users
- 30+ paying customers ($2,000+ MRR)
- 3+ MSP/agency customers
- PDF report generation live
- Team management feature shipped
- SOC2 compliance template added

### 6 Months After Launch
- 2,000+ users
- 100+ paying customers ($7,000+ MRR)
- Multi-tenant dashboard for agencies
- Browser extension launched
- Partnership with 2+ CMMC consultancy firms
- Applying for CMMC marketplace listing

---

## PART 10: IMMEDIATE NEXT STEPS (What We Do Right Now)

### Priority Order:
1. **Clean up orphaned components** (delete unused landing components)
2. **Wire Supabase Auth** (login/signup, protect command center)
3. **Create database tables** (users, events, assessments)
4. **Wire real data** to dashboard (replace mock data)
5. **Build /pricing page** with Stripe checkout
6. **Deploy to Vercel**
7. **Launch**

### The Brutal Truth
We have a BEAUTIFUL frontend and a SOLID backend architecture. What we're missing is the plumbing that connects them — auth, database queries, and payments. That's a 7-10 day sprint to fix.

**We are closer to launch than we think. The hard parts (AI engine, compliance logic, UI/UX) are done. The remaining work is standard SaaS plumbing.**

---

*This document is the source of truth for Kaelus.ai V2 development. All decisions should reference this PRD.*
