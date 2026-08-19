# HoundShield documentation

This directory contains operational guidance, product reference material, planning records, and historical research. Use this page to find the document that matches your task; do not assume that an exploratory draft or dated audit is current operating guidance.

> **For deployment and regulated-data decisions, start with the active operational documents below and validate the deployed configuration.** Documentation does not itself certify an environment or replace organizational security review.

## Start here

| If you need to… | Read | Why it matters |
|---|---|---|
| Set up or validate a development environment | [Testing guide](TESTING-GUIDE.md) | Contains component-level test, benchmark, build, and smoke-check procedures. |
| Prepare a release or production deployment | [Deployment guide](deploy-production.md) | Describes deployment steps and release considerations. |
| Review security configuration and control design | [Security hardening](security-hardening.md) | Explains implementation and operating considerations for security-sensitive surfaces. |
| Integrate a workflow with the product | [Integration guide](INTEGRATION_GUIDE.md) | Provides integration-oriented reference material. |
| Run a product demonstration | [Demo script](DEMO-SCRIPT.md) | Supplies a reproducible demonstration sequence. |
| Report a vulnerability | [Repository security policy](../SECURITY.md) | Explains private reporting channels and disclosure expectations. |

## Operational and product references

| Area | Document |
|---|---|
| Testing, CI, benchmarks, and troubleshooting | [TESTING-GUIDE.md](TESTING-GUIDE.md) |
| Production deployment | [deploy-production.md](deploy-production.md) |
| Application and data-flow architecture | [ai-architecture.md](ai-architecture.md) |
| Security design | [security-hardening.md](security-hardening.md) |
| Integration | [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) |
| Demo flow | [DEMO-SCRIPT.md](DEMO-SCRIPT.md) |
| Design system | [design-tokens.md](design-tokens.md) |
| Documentation assets and screenshots | [assets/README.md](assets/README.md) |

## Planning, research, and historical records

The remaining documents include design explorations, market and outreach research, roadmap proposals, prior audits, and dated validation notes. They are useful context, but their presence does not make them binding product requirements. Before acting on them, check their date, source, and alignment with the current codebase and deployment guidance.

The most relevant collections are:

| Collection | Contents |
|---|---|
| [`market-research/`](market-research/) | Opportunity and market research. |
| [`gtm/`](gtm/) | Go-to-market and production-audit material. |
| [`superpowers/specs/`](superpowers/specs/) | Product and design specifications. |
| [`legacy/`](legacy/) | Superseded or archived documentation. |

## Documentation maintenance

Documentation changes should state what they describe, avoid unqualified security or compliance claims, and link to implementation or reproducible validation where practical. When a change affects deployment, identity, data handling, detection behavior, or audit evidence, update the relevant active guide in the same pull request.

For contribution expectations, see [CONTRIBUTING.md](../CONTRIBUTING.md). For the public repository entry point, see the [root README](../README.md).
