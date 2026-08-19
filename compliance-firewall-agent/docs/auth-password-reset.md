# Password Reset Architecture

## Purpose

HoundShield now uses an **application-owned, code-entry password-reset flow** for the Supabase authentication path. A recovery bearer credential is never placed in an email URL, query parameter, redirect target, browser history entry, analytics event, or application log.

> The user receives a one-time code in the email body, then submits the code, their email address, and a new password to a protected server endpoint.

## Security invariants

| Property | Implementation |
|---|---|
| Cryptographic randomness | `lib/auth/password-reset-codes.ts` creates a 128-bit code with `crypto.randomBytes(16)`. |
| No raw secret at rest | `AUTH_RESET_CODE_PEPPER` domain-separates an HMAC-SHA-256 digest; only that digest is stored. |
| One-hour maximum lifetime | Migration `035_password_reset_codes.sql` constrains expiration to at most 60 minutes. |
| Single use | `consume_password_reset_code` uses one conditional `UPDATE … RETURNING`; only one concurrent request can redeem a code. |
| Replacement behaviour | Issuing a new code marks prior unused codes for the same user as used. |
| No URL secret | The reset route does not call `generateLink`, build `/auth/confirm` URLs, or emit `token_hash`. Legacy recovery URLs are rejected by `/auth/confirm`. |
| Server-side password update | `POST /api/auth/reset-password/complete` validates input, consumes the code, and calls Supabase Auth’s privileged password-update API. Application code never persists a plaintext password or a fast password hash. |
| Enumeration resistance | A well-formed reset request returns the same `200 { ok: true }` response after timing settlement whether the address is known, unknown, throttled, or unavailable. Delivery occurs only for a resolvable account. |
| Abuse protection | Request and completion endpoints have IP/account rate limits, CAPTCHA escalation, and lockout/cooldown handling. CAPTCHA verification fails closed after escalation. |
| Auditability | Request and completion attempts create privacy-safe append-only audit events. Events contain hashes and coarse metadata only—never email, code, password, reset link, or token. |

## Flow

1. The user submits an email to `/forgot-password`.
2. `POST /api/auth/reset-password` normalizes and rate-limits the request, applies CAPTCHA escalation when required, records a privacy-safe audit event, and returns the neutral result after timing settlement.
3. For a known profile, `issue_password_reset_code` resolves the user ID inside a service-role-only Postgres function, invalidates prior unused codes, and stores an HMAC digest with a maximum 60-minute expiry.
4. The code is dispatched through Resend after the response. It appears only in the email body.
5. The user enters email, code, and a policy-compliant password at `/reset-password`.
6. `POST /api/auth/reset-password/complete` repeats abuse controls, atomically consumes the code, invokes Supabase Auth to apply its password KDF, clears the failed-attempt state, and records completion. Invalid, expired, and used codes receive the same neutral failure.

## Required production configuration

| Requirement | Why it is required |
|---|---|
| `AUTH_RESET_CODE_PEPPER` | A separate 32-byte-or-more random server secret for recovery-code HMACs. Do not log it or expose it to the browser. |
| `TURNSTILE_SECRET_KEY` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Required to complete escalated CAPTCHA. Missing server configuration fails closed after escalation. |
| `RESEND_API_KEY` and verified transactional sender domain | Required to deliver the reset code. |
| `SUPABASE_SERVICE_ROLE_KEY` | Required only on the server for the code RPC and privileged password update. |
| Migration `035_password_reset_codes.sql` | Creates the hash-only store and atomic issue/consume functions. |
| Supabase Confirm Email + leaked-password protection | New accounts remain inactive until ownership is verified and breached passwords are rejected by the provider. |

## Operational rules

Do not add raw recovery codes to support tickets, logs, analytics, email subjects, URL parameters, redirect URLs, exception payloads, or audit details. Do not restore the old `admin.generateLink({ type: 'recovery' })` route without a formal security review. A password-reset completion provider error consumes the code rather than allowing replay; support should instruct the user to request a new code.

## Validation required before release

The release suite must prove neutral known/unknown response shape and timing, absence of token-bearing URL construction, hash-only storage, one-hour expiry, single-use concurrency, provider password-update delegation, CAPTCHA escalation, lockout, and audit-event redaction. Production verification must additionally confirm migration application, required secrets, transactional-email delivery, and a complete test reset using a non-customer test account.
