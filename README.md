# Compliance Firewall Agent

Blocks sensitive data (SSNs, credit cards, API keys, M&A info) from being sent to ChatGPT, Claude, and other LLM providers. Real-time interception with encrypted quarantine and audit trails.

## Quick Start

```bash
cd compliance-firewall-agent
npm install
# Edit .env.local with your Supabase keys (see setup below)
npm run dev
# Open http://localhost:3000
```

## Setup (3 steps)

### 1. Create Supabase project (free)
- Go to supabase.com -> sign up -> "New Project"
- Go to Settings -> API -> copy your URL + keys

### 2. Set up database
- Go to Supabase SQL Editor
- Paste the contents of `compliance-firewall-agent/supabase/migrations/001_initial_schema.sql`
- Click "Run"

### 3. Configure environment
- Open `compliance-firewall-agent/.env.local`
- Replace the three SUPABASE values with your real keys

## Test it

```bash
cd compliance-firewall-agent
bash test-api.sh
```

This sends 5 test prompts through the firewall:
- Safe prompt -> ALLOWED
- Prompt with SSN -> BLOCKED
- Prompt with email -> QUARANTINED
- Prompt with API key -> BLOCKED
- M&A strategic data -> BLOCKED

## Deploy (free)

Push to GitHub, then import on vercel.com. See `DEPLOY-GUIDE.md` for details.

## Project Structure

```
compliance-firewall-agent/
  app/              # Next.js pages + API routes
    api/
      gateway/      # POST /api/gateway/intercept (main endpoint)
      compliance/   # GET /api/compliance/events
      quarantine/   # POST+GET /api/quarantine/review
      reports/      # GET /api/reports/generate
      policy/       # POST /api/policy/update (requires approval)
    dashboard/      # Compliance dashboard UI
  lib/              # Core engine
    interceptor/    # Parses and routes LLM requests
    classifier/     # Detects sensitive data (regex patterns)
    quarantine/     # Encrypts + queues flagged prompts
    audit/          # Immutable logging + hash chain
    hitl/           # Human approval system
    supabase/       # Database client + types
  agents/           # Agent behavior definitions
  supabase/         # Database migration SQL
  ARCHITECTURE.md   # Full system design document
  DEPLOY-GUIDE.md   # How to deploy for free
  tasks.json        # 7-day development roadmap
  test-api.sh       # API test script
```

## How it works

1. Employee app sends LLM request to your gateway instead of directly to OpenAI/Anthropic
2. Gateway scans the prompt for sensitive data (16 detection patterns)
3. Safe prompts pass through. Dangerous ones get blocked or quarantined for review
4. Everything is logged with tamper-proof cryptographic hashes
5. Dashboard shows all activity. Reports satisfy compliance officers.

## Cost

| Service | Cost |
|---------|------|
| Vercel  | Free |
| Supabase| Free |
| **Total** | **$0/month** |
