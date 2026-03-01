<p align="center">
  <img src="https://img.shields.io/badge/🛡️_Kaelus.ai-AI_Compliance_Firewall-6366f1?style=for-the-badge&labelColor=0c0c10" alt="Kaelus.ai" height="45" />
</p>

<h1 align="center">Kaelus.ai</h1>

<p align="center">
  <strong>The AI Compliance Firewall — Intercept, Scan & Protect Every LLM Request</strong><br/>
  <sub>Real-time PII detection • Encrypted quarantine • Agentic AI with ReAct loop • 13 models • Mission Control dashboard</sub>
</p>

<p align="center">
  <a href="https://kaelus.ai"><img src="https://img.shields.io/badge/Live-kaelus.ai-6366f1?style=flat-square" /></a>
  <img src="https://img.shields.io/badge/Build-Passing-10b981?style=flat-square" />
  <img src="https://img.shields.io/badge/Next.js_14-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenRouter-6366f1?style=flat-square" />
  <img src="https://img.shields.io/badge/AI_Models-13-10b981?style=flat-square" />
  <img src="https://img.shields.io/badge/Detection_Patterns-16-f59e0b?style=flat-square" />
  <img src="https://img.shields.io/badge/Agent_Templates-18-a855f7?style=flat-square" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" />
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-ai-models">AI Models</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## Why Kaelus?

Every day, organizations leak sensitive data to AI providers without realizing it. SSNs, credit cards, API keys, medical records, M&A projections — all sent to ChatGPT, Claude, and other LLMs in plain text.

**Kaelus intercepts every request, scans it in under 50ms, and blocks sensitive data before it leaves your network.** Beyond the firewall, Kaelus is a full agentic AI platform with autonomous compliance agents.

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/thecelestialmismatch/Kaelus.ai.git
cd Kaelus.ai/compliance-firewall-agent

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Add your OPENROUTER_API_KEY to .env.local

# Start development server
npm run dev
# Open http://localhost:3000
```

---

## Features

### Compliance Firewall
| Capability | Details |
|-----------|---------|
| **Real-time Interception** | Sub-50ms scanning of every LLM request |
| **16 Detection Patterns** | SSNs, credit cards, API keys, emails, phone numbers, M&A data, medical records, code secrets |
| **3-Tier Classification** | ALLOW / BLOCK / QUARANTINE with confidence scoring |
| **Encrypted Quarantine** | AES-256 encryption for flagged content, human-in-the-loop review |
| **Immutable Audit Trail** | SHA-256 hash chains — tamper-proof logging for every event |
| **1-Click Reports** | CFO-ready compliance reports for SOC 2, GDPR, HIPAA, EU AI Act |

### Agentic AI System
| Capability | Details |
|-----------|---------|
| **ReAct Reasoning Loop** | Observe → Think → Act → Iterate — autonomous decision making |
| **8 Built-in Tools** | Web search, code execution, compliance scan, data query, file analysis, chart generation, knowledge base, web browsing |
| **18 Agent Templates** | SOC Analyst, Legal Reviewer, Financial Auditor, DevSecOps, Privacy Officer, Healthcare Compliance, Risk Analyst, Content Moderator, Regulatory Monitor, and more |
| **13 AI Models** | 8 free + 5 premium via OpenRouter — auto-routed per task |

### Mission Control Dashboard
| Tab | Function |
|-----|----------|
| Overview | Real-time threat dashboard with live metrics |
| Compliance | Event log, policy management, violation tracking |
| AI Agents | Agent builder, template gallery, execution monitor |
| Content Pipeline | Kanban board for content lifecycle |
| Tasks Board | Priority-based task management |
| Agent Team | Fleet management for AI sub-agents |
| Calendar | Scheduled scans, reviews, automated jobs |
| Memory DNA | Persistent agent identity with lessons & safeguards |
| Chat | Streaming AI conversations with model switching |
| Reports | Compliance report generation & export |

### Pages
| Route | Description |
|-------|-------------|
| `/` | Landing page — hero, stats, feature teasers |
| `/features` | Full feature breakdown with interactive demos |
| `/how-it-works` | 5-stage pipeline, architecture, live simulator |
| `/agents` | AI agents, ReAct loop, 18 templates, 8 tools |
| `/pricing` | Starter/Pro/Enterprise with comparison table |
| `/auth` | Sign in/up with Google, GitHub, email |
| `/dashboard` | Mission Control — 16-tab command center |
| `/docs` | API documentation & guides |

---

## AI Models

| Model | Provider | Tier | Best For |
|-------|----------|------|----------|
| GPT-4o | OpenAI | Premium | Most capable |
| Claude 3.5 Sonnet | Anthropic | Premium | Best reasoning |
| Gemini 2.5 Pro | Google | Premium | Multimodal |
| GPT-4o Mini | OpenAI | Premium | Fast & capable |
| Claude 3.5 Haiku | Anthropic | Premium | Balanced |
| Gemini 2.0 Flash | Google | **Free** | Speed king |
| Llama 3.3 70B | Meta | **Free** | Open source |
| DeepSeek V3 | DeepSeek | **Free** | Code expert |
| Qwen 2.5 72B | Alibaba | **Free** | Multilingual |
| Mistral Small 3.1 | Mistral | **Free** | Efficient |
| Gemma 3 27B | Google | **Free** | Compact |
| Nemotron 70B | NVIDIA | **Free** | Instruct |
| Phi-4 Reasoning Plus | Microsoft | **Free** | Reasoning |

---

## Architecture

```
Kaelus.ai/
├── compliance-firewall-agent/          # Main application
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── features/page.tsx           # Features page
│   │   ├── how-it-works/page.tsx       # How It Works page
│   │   ├── agents/page.tsx             # AI Agents page
│   │   ├── pricing/page.tsx            # Pricing page
│   │   ├── auth/page.tsx               # Authentication page
│   │   ├── dashboard/page.tsx          # Mission Control (16 tabs)
│   │   ├── docs/page.tsx               # Documentation
│   │   ├── globals.css                 # Design system (glass-card, gradients, animations)
│   │   ├── layout.tsx                  # Root layout with metadata
│   │   └── api/
│   │       ├── gateway/
│   │       │   ├── intercept/route.ts  # POST — Main firewall endpoint
│   │       │   └── stream/route.ts     # SSE — Streaming gateway
│   │       ├── agent/execute/route.ts  # POST — Agentic AI execution
│   │       ├── chat/route.ts           # POST — Streaming AI chat
│   │       ├── scan/route.ts           # POST — Quick content scan
│   │       ├── compliance/events/      # GET — Compliance event log
│   │       ├── quarantine/review/      # POST — Quarantine management
│   │       ├── reports/generate/       # GET — Report generation
│   │       ├── policy/update/          # POST — Policy management
│   │       ├── events/stream/          # SSE — Real-time events
│   │       └── health/route.ts         # GET — Health check
│   ├── components/dashboard/           # 16 dashboard tab components
│   ├── lib/
│   │   ├── agent/
│   │   │   ├── orchestrator.ts         # ReAct loop + tool calling engine
│   │   │   ├── memory.ts              # Conversation memory
│   │   │   ├── memory-dna.ts          # Persistent agent identity
│   │   │   ├── tools/                 # 8 agent tools
│   │   │   └── types.ts              # Type definitions + model registry
│   │   ├── interceptor/               # Request parsing + routing
│   │   ├── classifier/               # Sensitive data detection (16 patterns)
│   │   ├── quarantine/               # AES-256 encryption + review queue
│   │   ├── audit/                    # SHA-256 hash chains + logging
│   │   └── hitl/                     # Human-in-the-loop approval
│   ├── agents/                        # Agent personas (SOUL, MEMORY, TOOLS)
│   ├── middleware.ts                  # Request interception middleware
│   ├── tailwind.config.js            # Custom design tokens
│   ├── next.config.js                # Next.js configuration
│   └── package.json                  # Dependencies
├── ENHANCED_ARCHITECTURE.md           # Detailed architecture documentation
├── CONTRIBUTING.md                    # Contribution guidelines
├── LICENSE                            # MIT License
└── README.md                         # This file
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/gateway/intercept` | Scan LLM requests for sensitive data |
| `POST` | `/api/gateway/stream` | Streaming compliance gateway (SSE) |
| `POST` | `/api/agent/execute` | Execute agentic AI with ReAct loop |
| `POST` | `/api/chat` | Streaming AI chat |
| `GET` | `/api/compliance/events` | Fetch compliance event log |
| `POST` | `/api/quarantine/review` | Review quarantined content |
| `GET` | `/api/reports/generate` | Generate compliance reports |
| `POST` | `/api/policy/update` | Update firewall policies |
| `POST` | `/api/scan` | Quick content scan |
| `GET` | `/api/health` | System health check |
| `GET` | `/api/events/stream` | SSE real-time event stream |

### Example: Scan a Request

```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"content": "My SSN is 123-45-6789"}'

# Response:
# {
#   "status": "BLOCKED",
#   "threats": [{ "type": "SSN", "confidence": 0.99, "pattern": "\\d{3}-\\d{2}-\\d{4}" }],
#   "latency_ms": 23,
#   "action": "quarantine"
# }
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router, standalone output) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS + custom design system |
| **AI Gateway** | OpenRouter (multi-provider routing) |
| **Streaming** | Server-Sent Events (SSE) |
| **Encryption** | AES-256 (quarantine) + SHA-256 (audit) |
| **Auth** | Social login (Google, GitHub) + email/password |
| **Deployment** | Vercel / Docker |

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add `OPENROUTER_API_KEY` environment variable
4. Deploy

### Docker

```bash
cd compliance-firewall-agent
docker compose up
```

### Self-Hosted

```bash
cd compliance-firewall-agent
npm run build
npm start
# Runs on port 3000
```

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built by <a href="https://github.com/thecelestialmismatch">@thecelestialmismatch</a><br/>
  <sub>⭐ Star this repo if Kaelus helps secure your AI pipeline</sub>
</p>
