# Contributing to HoundShield

Thank you for contributing. HoundShield includes security-sensitive proxy, identity, evidence, and deployment code, so changes must be focused, reproducible, and explicit about their operational impact.

## Before you begin

Use **Node.js 22** and npm. Both the web and proxy CI jobs use Node 22, and the repository’s dependencies and native modules are validated against that baseline.[^ci]

1. Review the [root README](README.md) for the component boundaries.
2. Read the relevant guide in [`docs/`](docs/README.md) before changing deployment, integration, testing, or security behavior.
3. For a suspected vulnerability, **do not open a public issue or pull request**. Follow the private process in [SECURITY.md](SECURITY.md).
4. Never add credentials, customer information, sensitive prompts, production exports, or unapproved configuration to the repository.

## Local setup

Install dependencies independently for the component you are changing.

```bash
# Web and operations plane
cd compliance-firewall-agent
cp .env.example .env.local
npm ci

# Scanning proxy
cd ../proxy
cp .env.example .env.local
npm ci
```

Use development-only configuration in `.env.local`. Do not commit it. Read each template before setting values; a copied template is not a production-ready configuration.

## Development workflow

1. Create a focused branch from current `main`, such as `fix/reset-rate-limit` or `docs/testing-clarification`.
2. Make the smallest coherent change that resolves the issue.
3. Add or update tests for changed behavior. Do not delete or weaken a test simply to obtain a passing result.
4. Update active documentation when the change alters setup, deployment, identity, data handling, public behavior, or operator expectations.
5. Run the component checks below before opening a pull request.
6. Open a pull request against `main` and complete the repository template with a concise verification record.

## Required validation

Run every applicable command locally. CI repeats these checks, including TypeScript, linting, coverage gates, builds, repository secret/PII scanning, and the proxy pattern guard.[^ci]

| Component changed | Run |
|---|---|
| **Web and operations plane** | `cd compliance-firewall-agent && npx tsc --noEmit && npm run lint && npm run test:coverage && npm run build` |
| **Scanning proxy** | `cd proxy && npm run lint && npm run test:coverage && npm run bench && npm run build` |
| **Documentation only** | Check relative links, commands, terminology, and any claims against the referenced source. |
| **Repository-wide / security-sensitive change** | Run both component suites and describe the affected boundary, threat model, and rollback approach in the pull request. |

The proxy benchmark enforces the project’s latency contract in CI. If a proxy change affects scanning behavior, include its benchmark result and explain any material variance.

## Pull-request expectations

A strong pull request is small enough to review and complete enough to operate. Include:

- The problem, change, and relevant component paths.
- Tests and checks actually run, including results or notable limitations.
- A concise description of effects on authentication, authorization, data egress, detection, logging/evidence, migrations, or deployment when applicable.
- Migration and rollback notes for schema or configuration changes.
- Documentation updates for user-visible or operator-visible changes.

Avoid bundling opportunistic refactors with a defect fix. If a follow-up is valuable, open a separate issue or pull request.

## Commit style

Use a clear, imperative subject. Conventional Commit prefixes are encouraged:

```text
feat: add quarantine retention policy
fix: equalize login failure response timing
docs: clarify local proxy validation
chore: refresh dependency metadata
```

## Repository map

| Area | Path |
|---|---|
| Web application, authenticated dashboard, and API routes | [`compliance-firewall-agent/`](compliance-firewall-agent/) |
| Application schema migrations | [`compliance-firewall-agent/supabase/migrations/`](compliance-firewall-agent/supabase/migrations/) |
| Local scanning proxy and policy engine | [`proxy/`](proxy/) |
| Proxy detection patterns | [`proxy/patterns/`](proxy/patterns/) |
| Repository documentation | [`docs/`](docs/README.md) |
| CI, templates, and dependency automation | [`.github/`](.github/) |

## Community and security

All contributors must follow the [Code of Conduct](CODE_OF_CONDUCT.md). For security reports, use [SECURITY.md](SECURITY.md) rather than public GitHub channels.

[^ci]: [Repository CI workflow](.github/workflows/ci.yml)
