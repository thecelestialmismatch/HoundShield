# Security Policy

HoundShield is a compliance and data-loss-prevention product for regulated environments. We take security reports seriously and respond quickly.

## Reporting a vulnerability

**Do not open a public issue, pull request, or discussion for a security vulnerability.**

Report privately through either channel:

1. **GitHub Private Vulnerability Reporting** — the [**Security → Report a vulnerability**](../../security/advisories/new) tab on this repository (preferred).
2. **Email** — `security@houndshield.com` with the details below.

Please include:

- A description of the issue and its impact.
- Steps to reproduce (proof of concept if possible).
- Affected component — application (`compliance-firewall-agent/`) or proxy (`proxy/`) — and version/commit.
- Any suggested remediation.

## What to expect

| Stage | Target |
| :--- | :--- |
| Acknowledgement of your report | within **2 business days** |
| Initial assessment & severity | within **5 business days** |
| Fix or mitigation plan | tracked to resolution, with status updates |

We follow **coordinated disclosure**: we will agree a disclosure timeline with you and credit you (if you wish) once a fix ships.

## Scope

In scope:

- The web application and APIs in `compliance-firewall-agent/`.
- The HTTPS intercept proxy and detection engine in `proxy/`.
- The compliance/audit pipeline (SPRS scoring, hash-chained audit log).

Out of scope:

- Third-party services we integrate with (report those to the respective vendor).
- The Vercel-hosted **Mode A** demo for issues that depend on sending real CUI — Mode A is a demo and is **not** CUI-safe by design (see [README](README.md#deployment-modes)).

## Data boundary

HoundShield's core guarantee is that, in self-hosted (**Mode B**) and air-gapped (**Mode C**) deployments, **prompt content never leaves the customer network.** Any finding that breaks this boundary — exfiltration of scanned content, unexpected outbound transmission of prompt data, or tampering with the audit chain — is treated as **critical**.
