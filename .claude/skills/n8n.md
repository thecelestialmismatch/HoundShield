# n8n — Automation Workflow Knowledge

Deep knowledge of n8n's 1,084 nodes for building production-ready automation workflows. HoundShield uses n8n for compliance alert routing, C3PAO report delivery, and license webhook processing.

## Core Concepts

### Workflow Structure
```
Trigger → Transform → Action
```
- **Triggers:** Webhook, Schedule, Event (Supabase, Stripe)
- **Transforms:** Code node (JS/Python), Set, Merge, Split
- **Actions:** HTTP Request, Email, Slack, Supabase, Stripe

### HoundShield Workflow Patterns

#### 1. Compliance Alert → Slack/Email
```
Webhook (compliance event) 
  → IF risk_level == "CRITICAL"
  → Slack (#security-alerts) + Email (CISO)
  → Supabase (mark notified)
```

#### 2. C3PAO Report Delivery
```
Schedule (weekly, Monday 8am)
  → HTTP GET /api/reports/generate?format=pdf&from=...&to=...
  → Email (attach PDF to C3PAO contact)
  → Supabase (log delivery)
```

#### 3. Stripe → License Activation
```
Webhook (invoice.paid)
  → Supabase (upsert subscription tier)
  → HTTP POST /api/license/activate
  → Email (welcome + proxy config URL)
```

#### 4. New Customer Onboarding
```
Supabase trigger (new user)
  → Wait (5 minutes)
  → HTTP GET /api/brain/query?q=onboarding_checklist
  → Email (personalized CMMC quickstart)
```

## Key Nodes for HoundShield

| Node | Use case |
|------|----------|
| `Webhook` | Receive compliance events from proxy |
| `Schedule Trigger` | Weekly report delivery |
| `Supabase` | Read/write compliance_events, subscriptions |
| `HTTP Request` | Call HoundShield API endpoints |
| `Code` | Transform event data, compute SPRS delta |
| `Send Email` | C3PAO reports, alerts, onboarding |
| `Slack` | Internal security team alerts |
| `Stripe Trigger` | Payment events → license activation |
| `IF` | Route by risk_level, tier, event type |
| `Merge` | Combine brain query results |

## Self-Hosted Setup

```bash
docker run -d --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=$N8N_PASSWORD \
  n8nio/n8n
```

## Trigger: `/n8n <workflow-description>`

Generates a complete n8n workflow JSON for the described automation.
