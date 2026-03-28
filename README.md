<div align="center">
  <picture>
    <img alt="Kaelus AI Security Framework" src="assets/kaelus-banner.png" width="100%">
  </picture>
</div>

<br />

<div align="center">
    <strong>The Enterprise Standard for Generative AI Security and Compliance.</strong>
    <br />
    <br />
</div>

<div align="center">

[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production_Ready-black?style=flat-square&logoColor=white)](https://kaelus.online)
[![Compliance](https://img.shields.io/badge/Compliance-SOC2_|_GDPR_|_HIPAA-black?style=flat-square&logoColor=white)](https://kaelus.online)
[![Latency](https://img.shields.io/badge/Latency-%3C50ms-black?style=flat-square&logoColor=white)](https://kaelus.online)
[![Architecture](https://img.shields.io/badge/Architecture-Zero_Trust-black?style=flat-square&logoColor=white)](https://kaelus.online)

</div>

---

# Kaelus.online Compliance Firewall

As Generative AI adoption reaches critical mass within the enterprise, organizations are inadvertently exposing underlying infrastructure, intellectual property, and protected health information (PHI) to third-party Large Language Models. 

**Kaelus** is a real-time, inline compliance firewall designed to intercept, analyze, and sanitize downstream AI traffic before it exits your perimeter. Built on a zero-trust architecture, Kaelus ensures absolute data sovereignty without compromising developer velocity.

## Table of Contents

- [Core Capabilities](#core-capabilities)
- [Primary Use Cases](#primary-use-cases)
- [Quick Start](#quick-start)
- [Integration Examples](#integration-examples)
- [Platform Architecture](#platform-architecture)
- [Security Protocols](#security-protocols)
- [Community](#community)

## Core Capabilities

* **Sub-50ms Real-Time Interception:** Zero-copy stream scanning algorithms process multi-kilobyte payloads with negligible latency overhead.
* **Context-Aware ReAct Engine:** Conventional Data Loss Prevention (DLP) relies on static regular expressions, resulting in high false-positive rates. Kaelus utilizes 13 specialized AI agents in a Reasoning and Acting (ReAct) loop to understand context, distinguishing between a benign placeholder and a critical enterprise secret.
* **16-Vector Detection Matrix:** Parallel processing of payload data across 16 critical risk categories, including PII, Financial Instruments, Source Code, API Credentials, and Strategic M&A documentation.
* **Cryptographic Event Auditing:** Every transaction, interception, and quarantine event is hashed and committed to an immutable SHA-256 ledger, providing instantaneous, tamper-evident verification for regulatory audits.
* **AES-256 Encrypted Quarantine:** High-risk anomalous requests are isolated and encrypted at rest, ensuring that no plaintext sensitive data is ever stored in the platform database. 

## Primary Use Cases

### 1. Stopping Source Code and Credential Leaks
Engineering teams routinely use LLMs to debug code. Kaelus detects AWS keys, database credentials, and proprietary algorithms within the code context and prevents transmission to public AI endpoints.

### 2. Regulatory Compliance Enforcement
Organizations operating within healthcare or finance can enforce HIPAA and PCI-DSS compliance instantly. Kaelus redacts or blocks PHI and cardholder data before the AI provider network ever receives the transmission.

### 3. Forensic Auditing and Reporting
Compliance officers require definitive proof of data governance. Kaelus generates CFO-ready, deterministically verifiable audit reports that trace every API call made by every employee or internal service.

## Quick Start

To deploy the Kaelus platform within your own isolated environment:

```bash
git clone https://github.com/thecelestialmismatch/Kaelus.Online.git
cd Kaelus.Online/compliance-firewall-agent

npm install
cp .env.example .env.local
# Fill in the required values — see Environment Variables below
npm run dev
```

The dashboard and gateway will establish listeners on `http://localhost:3000`.

### Environment Variables

Copy `.env.example` to `.env.local` and fill in these required values:

| Variable | Source | Required |
|----------|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | ✅ |
| `OPENROUTER_API_KEY` | [OpenRouter](https://openrouter.ai/keys) | ✅ |
| `RESEND_API_KEY` | [Resend](https://resend.com/api-keys) | For emails |
| `STRIPE_SECRET_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) | For billing |
| `NEXT_PUBLIC_APP_URL` | Your deployment URL | ✅ |

## Integration Examples

Security platforms that slow down engineering teams are fundamentally flawed. Kaelus requires zero infrastructure routing changes. Integration is executed at the SDK layer by simply overriding the base URL to point to the Kaelus Gateway.

### Python

```python
# Standard Implementation (Unsecured)
from openai import OpenAI
client = OpenAI(api_key="sk-your-provider-key")

# Kaelus Implementation (Secured)
from openai import OpenAI
client = OpenAI(
    api_key="sk-your-provider-key", 
    base_url="https://gateway.kaelus.online/v1", 
    default_headers={"x-kaelus-token": "corp-your-organization-token"}
)
```

### Node.js

```typescript
// Kaelus Implementation (Secured)
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.PROVIDER_API_KEY,      
  baseURL: 'https://gateway.kaelus.online/v1',
  defaultHeaders: { 'x-kaelus-token': process.env.KAELUS_ORG_TOKEN }
});
```

## Platform Architecture

Kaelus is engineered for extreme throughput and high availability:

* **Edge Gateway:** Node.js Edge Runtime implementing concurrent WebSockets for continuous stream monitoring.
* **Detection Engine:** Hybrid pipeline combining rapid regular expression heuristics with Named Entity Recognition (NER) models.
* **Data Persistence:** Supabase PostgreSQL with strict Row Level Security (RLS).
* **Interface layer:** Next.js 14, React 18, utilizing the Framer Motion library and a strict, high-contrast UI design system.

## Security Protocols

Kaelus maintains a zero-tolerance policy for vulnerabilities. If you identify a security flaw in this software, do not submit a public issue or pull request. Please contact our security operations center immediately at `info@kaelus.online`. See our [Security Policy](SECURITY.md) for more details.

## Community

- File a [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) or [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md)
- Review our [Security Policy](SECURITY.md)

---

<div align="center">
  <i>Engineering uncompromising security for the next generation of artificial intelligence.</i>
  <br>
  <a href="https://kaelus.online">Website</a> |
  <a href="https://kaelus.online/features">Capabilities</a> |
  <a href="https://kaelus.online/changelog">Changelog</a> |
  <a href="https://kaelus.online/docs">Documentation</a>
</div>
