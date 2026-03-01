<p align="center">
  <img src="https://img.shields.io/badge/Kaelus-AI-6366f1?style=for-the-badge&logoColor=white" alt="Kaelus AI" height="40" />
</p>

<h1 align="center">Kaelus.ai</h1>

<p align="center">
  <strong>Agentic AI Compliance Firewall</strong><br/>
  Real-time LLM security gateway with multi-agent orchestration, 13 AI models, and Mission Control dashboard
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js_14-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenRouter-6366f1?style=flat-square" />
  <img src="https://img.shields.io/badge/Models-13-10b981?style=flat-square" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" />
</p>

---

## What is Kaelus?

Kaelus is an AI-powered compliance firewall that intercepts, scans, and controls all LLM traffic in your organization. It blocks sensitive data (SSNs, credit cards, API keys, M&A intel) from leaking to ChatGPT, Claude, and other providers — in real time.

Beyond the firewall, Kaelus is a full **agentic AI platform** with a ReAct reasoning loop, 8 tools, 18 pre-built agent templates, and a Mission Control dashboard for orchestrating AI operations.

## Core Features

### Compliance Firewall
- **Real-time interception** — Sub-100ms scanning of all LLM requests
- **16 detection patterns** — SSNs, credit cards, API keys, emails, M&A data, medical records
- **3-tier classification** — ALLOW / BLOCK / QUARANTINE with confidence scoring
- **Cryptographic audit trails** — Tamper-proof hash chains for every event
- **Encrypted quarantine** — Flagged content held for human review

### Agentic AI System
- **ReAct reasoning loop** — Reason + Act with iterative tool calling
- **8 built-in tools** — Web search, code execution, compliance scan, data query, file analysis, chart generation, knowledge base, web browsing
- **18 agent templates** — Pre-configured for SOC analysis, legal review, financial audit, DevSecOps, and more
- **13 AI models** — 8 free + 5 premium via OpenRouter

### Mission Control Dashboard
- **16-tab command center** — Overview, compliance, AI agents, content pipeline, tasks, team, calendar, memory
- **Agent Builder** — Visual agent creation with custom personas and tool selection
- **AI Chat** — Streaming conversations with model switching
- **Content Pipeline** — Kanban board for content lifecycle management
- **Tasks Board** — Task management with priority, assignee, and status tracking
- **Agent Team** — Monitor and manage your fleet of AI sub-agents
- **Calendar View** — Schedule scans, reviews, and automated jobs
- **Memory DNA** — Persistent agent identity with lessons, safeguards, and preferences

### Authentication
- Google and GitHub social login
- Email/password authentication
- Session persistence

## AI Models

| Model | Type | Provider |
|-------|------|----------|
| Gemini 2.0 Flash | Free | Google |
| Llama 3.3 70B | Free | Meta |
| DeepSeek V3 | Free | DeepSeek |
| Qwen 2.5 72B | Free | Alibaba |
| Mistral Small 3.1 | Free | Mistral |
| Gemma 3 27B | Free | Google |
| Nemotron 70B | Free | NVIDIA |
| Phi-4 Reasoning Plus | Free | Microsoft |
| GPT-4o Mini | Paid | OpenAI |
| GPT-4o | Paid | OpenAI |
| Claude 3.5 Sonnet | Paid | Anthropic |
| Claude 3.5 Haiku | Paid | Anthropic |
| Gemini 2.5 Pro | Paid | Google |

## Quick Start

```bash
git clone https://github.com/thecelestialmismatch/Kaelus.ai.git
cd Kaelus.ai/compliance-firewall-agent
npm install
cp .env.example .env.local
# Add your OPENROUTER_API_KEY to .env.local
npm run dev
# Open http://localhost:3000
```

## Architecture

```
compliance-firewall-agent/
  app/
    api/
      agent/execute/     # Agentic AI execution with ReAct loop
      chat/              # Streaming AI chat
      gateway/           # Compliance firewall interception
        intercept/       # POST - Main scanning endpoint
        stream/          # SSE - Real-time streaming
      compliance/events/ # Compliance event log
      quarantine/review/ # Encrypted quarantine management
      reports/generate/  # Compliance report generation
      policy/update/     # Policy management
      scan/              # Quick scan endpoint
      health/            # Health check
      events/stream/     # SSE event streaming
    dashboard/           # Mission Control UI (16 tabs)
  components/dashboard/  # 16 dashboard components
  lib/
    agent/               # Agentic AI engine
      orchestrator.ts    # ReAct loop + tool calling
      memory.ts          # Conversation memory
      memory-dna.ts      # Persistent agent identity (Memory DNA)
      tools/             # 8 agent tools
      types.ts           # Type definitions + model registry
    interceptor/         # Request parsing + routing
    classifier/          # Sensitive data detection (16 patterns)
    quarantine/          # Encryption + review queue
    audit/               # Cryptographic logging + hash chains
    hitl/                # Human-in-the-loop approval
  agents/                # Agent personas (SOUL, MEMORY, TOOLS)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/gateway/intercept` | Scan LLM requests for sensitive data |
| `POST` | `/api/gateway/stream` | Streaming compliance gateway |
| `POST` | `/api/agent/execute` | Execute agentic AI with ReAct loop |
| `POST` | `/api/chat` | Streaming AI chat |
| `GET` | `/api/compliance/events` | Fetch compliance event log |
| `POST` | `/api/quarantine/review` | Review quarantined content |
| `GET` | `/api/reports/generate` | Generate compliance reports |
| `POST` | `/api/policy/update` | Update firewall policies |
| `POST` | `/api/scan` | Quick content scan |
| `GET` | `/api/health` | System health check |
| `GET` | `/api/events/stream` | SSE real-time event stream |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Gateway**: OpenRouter (multi-provider routing)
- **Streaming**: Server-Sent Events (SSE)
- **Auth**: Social login (Google, GitHub) + email/password
- **Deployment**: Vercel / Docker

## Deploy

### Vercel (recommended)
Push to GitHub, import on [vercel.com](https://vercel.com). Add your `OPENROUTER_API_KEY` as an environment variable.

### Docker
```bash
cd compliance-firewall-agent
docker compose up
```

## License

MIT

---

<p align="center">
  Built by <a href="https://github.com/thecelestialmismatch">@thecelestialmismatch</a>
</p>
