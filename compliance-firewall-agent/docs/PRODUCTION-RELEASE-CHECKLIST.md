# Production Release Checklist

This checklist is a **deployment gate**, not a retrospective. A release is not approved until every applicable item is evidenced in the PR/release record.

## Security and authentication

| Gate | Evidence required |
|---|---|
| Password-reset migration | `035_password_reset_codes.sql` is applied and `password_reset_codes`, `issue_password_reset_code`, and `consume_password_reset_code` exist. Verify RLS and service-role-only function access. |
| Privileged database RPCs | `036_revoke_public_security_definer.sql` is applied. Re-run Supabase security advisors and confirm `auth_audit_events_immutable`, `consume_rate_limit`, and `sweep_rate_limit_buckets` are not executable by `anon` or `authenticated`; service-role calls still work. |
| Recovery-code secret | `AUTH_RESET_CODE_PEPPER` is set to a separate, random 32-byte-or-more secret. Do not reuse it as a browser value or record it in tickets. |
| CAPTCHA | `TURNSTILE_SECRET_KEY` and matching `NEXT_PUBLIC_TURNSTILE_SITE_KEY` are set. Complete a real Turnstile challenge in a non-customer test account. |
| Email ownership | Supabase **Confirm email** is enabled. A newly created account cannot reach a guarded route before verification. |
| Password quality | Supabase leaked-password protection is enabled. Test a known-breached password against a disposable account without retaining the password in logs. |
| Session controls | Confirm production `Secure` cookies, JWT expiry, refresh-token rotation, and session revocation policy in Supabase Authentication settings. |
| Audit trail | Migrations 031 and 032 are applied; audit rows are append-only, have RLS, and contain no raw email, IP, password, code, or reset token. |
| Shared abuse controls | Migration 028 is applied and `/api/health` reports `rate_limit_store: shared`, `auth_lockout_store: enforcing`, `captcha: enforcing`, and `reset_code_pepper: set`. |

## Sensitive-data handling

| Gate | Evidence required |
|---|---|
| Quarantine encryption | `ENCRYPTION_KEY` is exactly 64 hexadecimal characters; `/api/health` reports `quarantine_encryption: enabled`. |
| Secrets | `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `STRIPE_WEBHOOK_SECRET`, `OPENROUTER_API_KEY`, and `CRON_SECRET` are present only as production environment secrets. |
| Dependency gate | `npm audit --omit=dev --audit-level=high` returns zero findings; patch updates are reviewed separately. |
| Build gate | `npm run lint`, `npx tsc --noEmit`, the focused auth suite, full test suite, and `npm run build` all pass on the commit to deploy. |

## Revenue, website, and outreach

| Gate | Evidence required |
|---|---|
| Checkout | Test Stripe webhook event records a non-customer test order, sends the receipt, and does not log buyer email. |
| Website claims | Hosted-vs-self-hosted/CUI scope is accurate; comparison claims are sourced and date-stamped; illustrative dashboards are labelled. |
| Marketing legality | `MARKETING_POSTAL_ADDRESS` is configured, migration 034 is applied, global suppression/unsubscribe works, and no campaign is queued until this is verified. |
| Sender authentication | SPF, DKIM, aligned DMARC, reply handling, unsubscribe, bounce/complaint suppression, and transactional/marketing stream separation are verified for the sending domain. |
| Deployment topology | Vercel Root Directory is `compliance-firewall-agent`; the legacy root `vercel.json` change is coordinated with this setting; canonical domain redirect smoke tests pass. |

## Final smoke test

Use a non-customer, disposable test identity. Exercise signup → email verification → login → intentional failed-login threshold → CAPTCHA → unlock/cooldown → password-reset code request → code-only reset completion → login with the new password → logout. Record only pass/fail and timestamps; never store the password, code, or raw email in the release artifact.
