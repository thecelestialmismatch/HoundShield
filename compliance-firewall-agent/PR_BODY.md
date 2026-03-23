## Summary
- Branding overhaul: Kaelus.online across UI and PDFs
- Added health endpoints: /api/health/anthropic and /api/health/kaelus
- Added Stripe prices endpoint and lazy Stripe client
- Added vercel.json for deployment
- Added secret scaffolding and secret helpers

## Why
Provide a consistent brand, domain, and secure deployment with visibility into health and secret state. Prepare for production with domain binding and domain migration.

## Testing
- Build succeeded on prod deploy; health endpoints exist but domain binding is in progress.
- Will verify health after DNS propagation.

## Risks
- Secrets were shown in chat; rotate and store securely before production.
