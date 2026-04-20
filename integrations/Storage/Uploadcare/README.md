# Hound Shield + Uploadcare

**One-line integration:** point your Uploadcare AI calls at the Hound Shield proxy URL.

## Setup

```bash
KAELUS_PROXY_URL=https://your-tenant.houndshield.com/proxy
```

## How It Works

1. Change your AI endpoint base URL to `KAELUS_PROXY_URL`
2. All prompts are intercepted and scanned (<10ms latency)
3. Violations are blocked before they leave your network
4. Compliance evidence is logged automatically (SOC 2 · HIPAA · CMMC Level 2)

## Learn More

- [Hound Shield Documentation](https://houndshield.com/docs)
- [Quick Start Guide](https://houndshield.com/docs/quickstart)
- [Pricing](https://houndshield.com/pricing)
