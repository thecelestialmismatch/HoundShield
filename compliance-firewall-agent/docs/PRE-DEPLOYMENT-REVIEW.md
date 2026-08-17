# HoundShield Pre-Deployment Review

**Branch:** `security/p0-p1-auth-and-launch-readiness`  
**Review state:** Ready for owner review; **not yet committed, pull-requested, deployed, or production-migrated**.  
**Temporary preview:** https://3000-iixp7w1waypz179jj7bqg-e9d106da.sg1.manus.computer/

## Design read

> **Reading this as a regulated B2B SaaS landing page and authenticated operator workspace for compliance owners, with a trust-first, evidence-led language and restrained steel-and-cream visual system.**

The work preserves the existing Direction-A visual hierarchy. It removes claims that overstate competitor limitations or product/regulatory outcomes, without turning the site into a generic redesign.

## What changed on the public website

| Area | Previous risk | Change now visible in preview | Buyer benefit |
|---|---|---|---|
| Hero | Led with named AI vendors and broad assertions about all traffic. | Leads with **“Keep regulated data inside your control boundary.”** | Frames the first buyer question correctly: architecture and authorised boundary. |
| Hero proof points | Contained absolute statements that could be read as universal. | Distinguishes **hosted evaluation** from a **self-hosted path for sensitive workloads** and calls the PDF evidence-oriented. | Sets truthful expectations before a buyer enters a demo. |
| Market statistic | Displayed an externally attributed percentage without inline context. | Replaces it with two tangible deployment paths: hosted evaluation and self-hosted control. | Avoids a fragile, unqualified proof point. |
| Comparison section | Claimed competitors were architecturally disqualified or entirely unable to protect external AI usage. | Recasts Nightfall, Purview, and HoundShield as different deployment/control models with explicit scope. | Improves factual durability and credibility with security buyers. |
| Conversion path | Existing CTA topology remains intact. | Primary CTA is **Explore the control boundary**; secondary CTA remains the $499 report. | Preserves immediate evaluation and paid-assessment paths. |

The revised homepage rendered successfully in the temporary preview. The above-the-fold composition remains intact: a one-line value proposition, short explanatory copy, two CTAs, a four-point trust row, and the labelled product demo below it.

## What changed after login

The authenticated dashboard adds a new **Operational readiness** panel immediately below the toolbar. It is intentionally present only in `OperatorDashboard`, not in the public/demo overview, to avoid showing tenant-control state in a marketing surface.

| Panel behaviour | Implementation |
|---|---|
| Uses real state | Fetches `/api/health` with `no-store`; no seeded or inferred control status is shown. |
| Shows control readiness | Reports shared rate limits, account lockout, CAPTCHA escalation, reset-code protection, and quarantine encryption. |
| Fails honestly | Shows `Unknown` or an explicit unavailable state if health data cannot be retrieved; it never paints an unverified control green. |
| Protects secrets | Health data includes only control state—not keys, emails, prompts, audit content, or provider credentials. |
| Provides a next action | A direct **Open settings** action leads the operator to the existing configuration route. |

## Security remediation delivered

| Priority | Delivered change |
|---|---|
| P0: reset token exposure | Replaces query-string recovery links with 128-bit random, email-delivered reset codes. Raw codes are never persisted, logged, or URL-borne. |
| P0: reset replay and expiry | Adds migration `035_password_reset_codes.sql`: keyed HMAC digest at rest, 60-minute maximum expiry, one active code per user, and atomic single-use redemption. |
| P0: password update boundary | Adds `POST /api/auth/reset-password/complete`; password policy, code redemption, CAPTCHA/rate controls, auditing, and Supabase’s provider-managed slow password KDF remain server-side. |
| P0: enumeration | Retains neutral responses and timing settlement for well-formed reset requests; known and unknown addresses do not receive different JSON outcomes. |
| P0: abuse control | Adds reset-completion ceilings and accessible Turnstile handling. A required CAPTCHA challenge fails closed if server configuration is missing. |
| P1: deployment safety | Makes TypeScript errors release-blocking in `next build`; removes the production authentication-route rollback that allowed a browser-direct fallback. |
| P1: operational visibility | `/api/health` now exposes reset-code-secret and corrected CAPTCHA readiness state, without exposing values. |
| P1: documentation | Adds password-reset architecture, production checklist, and sourced market/outreach strategy documents. |

## Validation evidence

| Gate | Result |
|---|---|
| Focused authentication suite | **30 files, 369 tests passed** after reset-flow implementation. |
| P0 regression suite | **4 files, 59 tests passed.** |
| Health-status suite | **19 tests passed.** |
| Website/documentation regressions | **27 tests passed.** |
| Dashboard shell regression | **59 tests passed.** |
| Full suite | **205 files, 2,904 tests passed.** |
| TypeScript | **Passed** with `ignoreBuildErrors: false`. |
| Production build | **Passed**; all 233 static pages generated and route manifest completed. |
| Diff hygiene | `git diff --check` passed. |
| Dependency production audit | Earlier audit returned zero high-severity production findings. |

## Non-blocking engineering warnings retained for follow-up

| Warning | Impact | Disposition |
|---|---|---|
| Next.js middleware convention is deprecated in favour of `proxy`. | Build passes today; future framework migration needed. | Do not bundle a high-risk edge-routing migration into this security release. Track as a dedicated P1 follow-up. |
| Better Auth/Jose emits Edge-runtime compatibility warnings in the build. | Build passes; existing dependency/runtime compatibility signal. | Keep as release evidence and validate edge paths after provider consolidation. |
| Lint reports 35 pre-existing warning-only issues, primarily React effect-state patterns. | No lint errors; does not block build. | Address as a separate cleanup PR to avoid widening the authentication release. |

## External release prerequisites

A code merge alone is not a safe customer launch. Before deployment, the owner must confirm that production has the required secrets and migrations, using the new `docs/PRODUCTION-RELEASE-CHECKLIST.md`.

| Must be confirmed before production release | Why |
|---|---|
| Apply migration 035. | Required for reset-code issuance and atomic consumption. |
| Set `AUTH_RESET_CODE_PEPPER`. | Required to protect code digests; reset issuance fails safely without it. |
| Set both Turnstile keys. | Required when anti-abuse escalation challenges a user. |
| Verify Confirm Email and leaked-password protection in Supabase. | Ensures new accounts remain unverified until email ownership is confirmed and provider password checks are active. |
| Verify sender authentication, suppression, unsubscribe, postal address, and migration 034. | Required before commercial outreach begins. |
| Perform a disposable-account signup → verification → login → reset-code → sign-in smoke test. | Validates the integration without exposing a customer account or secret. |

## Decision requested

Please review the temporary homepage preview and this document. If you approve the website/dashboard copy, security implementation, and explicit production prerequisites, reply **“Go: create the PR; do not deploy until configuration is verified”** or **“Go: create the PR and deploy after the checklist is verified.”**

The latter still requires configuration verification before production action; no PR or deployment will be performed without your explicit release confirmation.


## Production preflight update — 17 August 2026

Read-only checks against the connected production services found the following release state.

| System | Verified state | Release implication |
|---|---|---|
| Supabase project `HoundShield` (`qifynzuyrdxmxlumpsrq`) | Active and healthy. | Production database is reachable for the approved migration step. |
| Production migration history | Includes 028, 031, and 032; does **not** include 034, 035, or 036. | Apply 035 before enabling code-only reset; apply 036 to remove public execution of privileged functions; apply 034 before commercial email outreach. |
| Supabase security advisor | Reports public execution warnings for `auth_audit_events_immutable`, `consume_rate_limit`, and `sweep_rate_limit_buckets`. | Migration 036 is included in this release to revoke anon/authenticated access while retaining service-role execution. Re-run advisor after migration. |
| Supabase security advisor | Reports `auth_leaked_password_protection` disabled. | **Manual Supabase Auth dashboard release gate:** enable leaked-password protection before production auth launch. This cannot be safely toggled through the repository migration. |
| Supabase RLS advisory | RLS-enabled/no-policy information notices exist for protected audit, lockout, rate-limit, and Better Auth tables. | Expected defensive posture: no PostgREST policy means anon/authenticated clients are denied; service-role/server access is intentional. |
| Vercel project | Project `compliance-firewall-agent`, Next.js, owns `www.houndshield.com` and `houndshield.com`. | The permanent site is correctly linked to the intended project. |
| Vercel deployment history | Latest production deployment is `READY`; the latest branch preview is also `READY`. | The historical build outage is resolved. A new production deployment must wait for the approved commit plus database/configuration gates above. |

> **Current release decision:** the website and code are ready to make permanent through a pull request, but production deployment remains blocked until migrations 035 and 036 are applied, leaked-password protection is enabled, and the required production secrets/checklist entries are verified.

### Current production evidence sources

[1]: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable "Supabase — Public SECURITY DEFINER function advisory"
[2]: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection "Supabase — Leaked password protection"
[3]: https://vercel.com/thecelestialmismatch-9194s-projects/compliance-firewall-agent "Vercel — HoundShield project"

| Vercel runtime errors, last 7 days | `/api/cron/email-drip` recorded two `CRON_SECRET not set` errors, most recently 16 August 2026. | Keep drip automation disabled; set `CRON_SECRET` only when the sender, unsubscribe, suppression, and commercial-email checks are complete. Do not treat this as a reason to enable outreach before launch gates are met. |


### Final local validation note

The full suite completed on the exact release worktree with **206 files / 2,908 tests passed**, and `npx tsc --noEmit` completed successfully. The application source last changed before the successful production build recorded in this review; afterward, the only additions were migration 036, its static SQL contract test, and release documentation. A final repeat `next build` was interrupted by the sandbox with `SIGTERM` while the environment was under high memory pressure, before compilation completed; it did not report a TypeScript, application, or bundler error. The deployment platform must still run its own build on the proposed commit before a production promotion.
