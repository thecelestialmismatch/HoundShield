<div align="center">
  <h1>Kaelus.ai 🛡️</h1>
  <p><strong>The Enterprise AI Compliance Firewall</strong></p>
  <p>Protecting sensitive corporate data from LLM leaks with real-time interception, AES-256 encrypted quarantine, and immutable cryptographic audit trails.</p>

  <p>
    <a href="https://kaelus.ai">Website</a> •
    <a href="https://kaelus.ai/features">Features</a> •
    <a href="https://kaelus.ai/changelog">Changelog</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Status-Production-emerald?style=for-the-badge&logoColor=white" alt="Status" />
    <img src="https://img.shields.io/badge/Compliance-SOC2%20%7C%20GDPR%20%7C%20HIPAA-blue?style=for-the-badge&logoColor=white" alt="Compliance" />
    <img src="https://img.shields.io/badge/Latency-%3C50ms-orange?style=for-the-badge&logoColor=white" alt="Latency" />
    <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  </p>
</div>

---

## 🚀 The Problem We Solve
Generative AI adoption is exploding, but **78% of enterprises have zero visibility into what data is flowing to external AI providers** (OpenAI, Anthropic, Google, etc.). 
A single developer pasting a configuration file containing an AWS root password into ChatGPT can lead to a catastrophic breach.

**Kaelus.ai is the fix.** We are an inline API proxy that sits between your employees/applications and the AI providers, scanning every payload in real-time.

---

## 💎 Core Features (Beast Mode)

* ⚡ **Real-Time Interception (<50ms):** Zero-copy stream scanning ensures no noticeable latency is added to your LLM requests.
* 🧠 **13-Agent ReAct Loop:** We don't just use dumb regex. Our context-aware LLM agents understand the difference between *source code containing a secret* and *source code containing a generic placeholder*.
* 🛡️ **16 Detection Patterns:** Simultaneously scans for PII, Financial Data, Trade Secrets, Medical Records, SSH Keys, API tokens, and more.
* 🔒 **AES-256 Encrypted Quarantine:** High-risk prompts are blocked and securely encrypted at rest. Zero plaintext storage.
* ⛓️ **Immutable Audit Trails:** Every event is logged via a SHA-256 cryptographic hash chain, allowing for 1-click integrity verification by auditors.
* 📊 **1-Click Compliance Reports:** Generate CFO-ready PDF reports to satisfy SOC 2, ISO 27001, HIPAA, and the EU AI Act.

---

## 🛠️ Integration: 1 Line of Code

Integrating Kaelus doesn't require complex network re-routing. If your engineers can change a base URL, they can secure your AI traffic.

```python
# Before
from openai import OpenAI
client = OpenAI(api_key="sk-...")

# After (Secure)
from openai import OpenAI
client = OpenAI(
    api_key="sk-...", 
    base_url="https://gateway.kaelus.ai/v1", 
    default_headers={"x-kaelus-token": "corp-..."}
)
```

---

## 📂 Architecture & Stack

Kaelus is designed for massive scale and zero trust.

* **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS v4, Framer Motion
* **Backend:** Node.js Edge Runtime, WebSocket streaming proxy 
* **Database:** Supabase (PostgreSQL with Row Level Security)
* **Design System:** Porsche Premium Dark (Glassmorphism, custom CSS particle animations)
* **Security Layer:** Content Security Policy (CSP), rigorous CORS settings, strict rate-limiting.

---

## 💻 Getting Started (Local Development)

To run the Kaelus agent locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/thecelestialmismatch/Kaelus.ai.git
   cd Kaelus.ai/compliance-firewall-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (`.env.local`):
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   *The application will be available at `http://localhost:3000`.*

---

## 📖 Key Directories
* `app/page.tsx`: The ultimate 18-section marketing/landing page.
* `lib/gateway/`: The core interception proxy logic.
* `lib/interceptor/`: The 16-pattern threat detection engine.
* `lib/agents/`: State machines and memory memory logic spanning our 13 distinct agents.
* `components/landing/`: Reusable, scroll-animated glassmorphic components.

---

## 🔒 Security & Bug Reports
For security vulnerabilities, please do not open a public issue. Email us directly at `security@kaelus.ai`.

---
<div align="center">
  <i>"Developer experience and enterprise security shouldn't be at odds. They should be the exact same thing."</i><br>
  <b>Kaelus.ai Team</b>
</div>
