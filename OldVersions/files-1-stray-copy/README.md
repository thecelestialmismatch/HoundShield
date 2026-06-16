# HoundShield

**AI Compliance Firewall for CMMC Level 2, HIPAA, and SOC 2**

Local-only. Sub-10ms. C3PAO-ready.

---

## The Problem

Your team uses ChatGPT, Copilot, and Claude every day. So does every defense contractor in the US. And every time they do, there is a nonzero probability that controlled unclassified information (CUI) goes into a commercial AI prompt — and leaves your network boundary.

Under DFARS 252.204-7012, that is an incident report. Under CMMC Level 2, it is a finding. Under a DoD contract, it can cost you the contract.

Nightfall, Strac, and Microsoft Purview offer DLP scanning for AI tools. But they all send your prompt content to their cloud to scan it. That act — sending CUI to an external cloud for scanning — is itself a potential DFARS violation.

**HoundShield scans locally. Your prompt content never leaves your network. Not to us. Not to anyone.**

---

## How It Works

HoundShield runs as a transparent proxy between your users and any OpenAI-compatible AI service.

```
Employee types prompt
        |
        v
 HoundShield Proxy  <-- runs on YOUR infrastructure
        |
   16 detection engines
   CUI · PHI · PII · credentials
   < 10ms · fully local
        |
   ALLOW or BLOCK
        |
        v
   AI Service (ChatGPT, Copilot, Claude, etc.)
```

**If clean:** Prompt passes through. Response returns. User never notices.

**If violation detected:** Prompt is blocked. User sees policy message. SHA-256 signed log entry is created with timestamp, matched pattern, and applicable framework control.

---

## Quick Start

### Hosted Trial (Non-CUI Evaluation Only)

```bash
# Change one environment variable
export OPENAI_BASE_URL=https://proxy.houndshield.com
```

60 seconds. No card required. Use with synthetic or non-sensitive data only.

### Self-Hosted Docker (CMMC-Compliant)

```bash
# Pull and run the container on your infrastructure
docker pull houndshield/proxy:latest
docker run -d \
  -p 8080:8080 \
  -e LICENSE_KEY=your_key_here \
  houndshield/proxy:latest

# Point your AI tools at your local instance
export OPENAI_BASE_URL=http://localhost:8080
```

Prompt content never leaves your host. This is the required mode for CUI environments.

### Air-Gapped (IL-4/IL-5)

Contact: enterprise@houndshield.com

Fully offline deployment with signed offline pattern update bundles. DISA IL-4/IL-5 compatible.

---

## Detection Coverage

### CMMC Level 2 / CUI
- ITAR-controlled technical data markers
- EAR classification markers
- DoD contract numbers and program identifiers
- CUI category markings (CUI//SP-CTI, etc.)
- Export control indicators

### HIPAA / PHI
- Social Security Numbers (SSN)
- Medical Record Numbers (MRN)
- Health plan and insurance identifiers
- Date of birth + name combinations
- Diagnosis codes and clinical terms

### PII (General)
- Full name + address combinations
- Driver's license numbers
- Passport numbers
- Financial account numbers
- Email + additional identifier combinations

### Credentials and Secrets
- API keys (OpenAI, AWS, Azure, GitHub, Stripe patterns)
- Private key headers (RSA, EC, PEM)
- Database connection strings
- JWT tokens
- Webhook secrets

### Dual-Layer Detection
Every pattern runs through:
1. **Regex layer** — fast, deterministic, zero false negatives on known formats
2. **Semantic layer** — catches paraphrased or obfuscated sensitive content

---

## NIST 800-171 Control Mapping

| Feature | Controls |
|---|---|
| Local scanning, no external transmission | 3.13.1 — Boundary protection |
| Tamper-proof SHA-256 signed audit logs | 3.3.1, 3.3.2 — Audit and accountability |
| Real-time violation detection and blocking | 3.1.1 — Access control |
| C3PAO-ready PDF evidence export | 3.12.1 — Security assessment |
| User policy violation notifications | 3.2.1, 3.2.2 — Awareness and training |
| Webhook alerts for security team | 3.3.5 — Audit review and reporting |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  YOUR NETWORK BOUNDARY               │
│                                                     │
│  ┌──────────┐    ┌─────────────────────────────┐   │
│  │  Users   │───>│   HoundShield Proxy          │   │
│  │ ChatGPT  │    │                             │   │
│  │ Copilot  │    │  ┌─────────────────────┐   │   │
│  │ Claude   │    │  │  Detection Engine    │   │   │
│  │ Cursor   │    │  │  16 pattern sets    │   │   │
│  └──────────┘    │  │  Regex + Semantic   │   │   │
│                  │  │  < 10ms latency     │   │   │
│                  │  └─────────────────────┘   │   │
│                  │                             │   │
│                  │  ┌─────────────────────┐   │   │
│                  │  │  Audit Log           │   │   │
│                  │  │  SHA-256 signed      │   │   │
│                  │  │  PDF export          │   │   │
│                  │  └─────────────────────┘   │   │
│                  │                             │   │
│                  │  ┌─────────────────────┐   │   │
│                  │  │  Brain AI            │   │   │
│                  │  │  On-device knowledge │   │   │
│                  │  │  graph for gap       │   │   │
│                  │  │  analysis            │   │   │
│                  │  └─────────────────────┘   │   │
│                  └─────────────────────────────┘   │
│                           |                         │
└─────────────────────────── | ───────────────────────┘
                             | (clean prompts only)
                             v
                     ┌──────────────┐
                     │  AI Service  │
                     │  ChatGPT     │
                     │  Azure OAI   │
                     │  etc.        │
                     └──────────────┘
```

---

## Pricing

| Plan | Price | Users | Best For |
|---|---|---|---|
| Free | $0/mo | 1 | Evaluation |
| Pro | $199/mo | 5 | CMMC-preparing teams |
| Growth | $499/mo | 25 | Multi-team orgs |
| Enterprise | $999/mo | Unlimited | C3PAO assessment |
| Federal | $2,499/mo | Multi-tenant | Agency/MSP |

Annual plans: 20% discount. 30-day money-back guarantee.

---

## Security

- Container image: signed, SBOM published
- No telemetry beyond anonymized scan counts and license key hash
- Logs stored locally only — never transmitted to HoundShield
- Open-source detection patterns (auditable)
- Responsible disclosure: security@houndshield.com

---

## Supported AI Tools

Any tool using an OpenAI-compatible API endpoint:

- ChatGPT (via OpenAI API)
- GitHub Copilot (API mode)
- Anthropic Claude (API)
- Google Gemini (API)
- Cursor
- Codeium
- Continue.dev
- Any open-source model via Ollama or LM Studio

---

## Compliance Frameworks

- CMMC Level 2 (all 110 NIST 800-171 Rev 2 controls mapped)
- HIPAA Privacy and Security Rules
- SOC 2 Type II (CC6, CC7 controls)
- DFARS 252.204-7012
- NIST SP 800-171 Rev 2
- ITAR / EAR detection patterns

---

## Roadmap

- [x] Core proxy engine with < 10ms latency
- [x] 16 CUI/PHI/PII detection pattern sets
- [x] SHA-256 signed tamper-proof audit logs
- [x] C3PAO-ready PDF evidence export
- [x] Self-hosted Docker deployment
- [x] Hosted trial mode
- [ ] Brain AI — on-device CMMC gap analysis (Q2 2026)
- [ ] Air-gapped offline mode with signed pattern bundles (Q2 2026)
- [ ] MSP multi-tenant dashboard (Q3 2026)
- [ ] Mobile app — iOS/Android compliance dashboard (Q3 2026)
- [ ] FedRAMP alignment documentation (Q4 2026)

---

## Contributing

Security-relevant contributions are welcome. Please review our security policy before submitting any PR that touches detection patterns or audit log integrity.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit with semantic messages: `git commit -m "feat: add pattern for ITAR-EAR overlap"`
4. Push and open a pull request

---

## License

HoundShield core detection patterns are open-source (MIT). The proxy engine and audit system are proprietary.

---

## Contact

- Website: https://www.houndshield.com
- Documentation: https://www.houndshield.com/docs
- Sales: https://www.houndshield.com/contact
- Security: security@houndshield.com
- Twitter: @houndshield
