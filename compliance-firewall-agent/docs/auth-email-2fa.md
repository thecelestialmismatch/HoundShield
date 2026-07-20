# Email 2FA — second auth factor

Opt-in email one-time codes on sign-in, built on Better Auth's official
`twoFactor` plugin (email-OTP factor only — no authenticator-app UI in this
slice). Ships dormant: nothing changes for any user until Better Auth is the
active provider (`AUTH_PROVIDER=better-auth`, see
`docs/BETTER-AUTH-MIGRATION.md`) **and** the user turns 2FA on themselves at
`/console/security`.

**Control mapping:** NIST 800-171 **3.5.3 / IA.3.083** (multifactor
authentication for network access) · HIPAA **164.312(d)** (person or entity
authentication). The console holds a contractor's AI-usage audit evidence —
Jordan's C3PAO will ask how that account is protected; this is the answer.

## How it works

**Sign-in (2FA on):** `/login` → password accepted → Better Auth returns
`{ twoFactorRedirect: true }` instead of a session → the page swaps to a
6-digit code step in place, emails a code (Resend), and calls
`twoFactor.verifyOtp({ code, trustDevice })`. "Trust this device" skips the
code on that browser for 30 days. Codes live 5 minutes; repeated failures
trip the plugin's account lockout (10 attempts → ~15 min).

**Enable (`/console/security`):** password → `twoFactor.enable()` → a code is
emailed → `verifyOtp` flips `twoFactorEnabled`. The flag flips **only after a
code round-trips** (`skipVerificationOnEnable: false`), so a typo'd email path
can never lock an account out. Backup codes (from the enable response) are
shown exactly once, after that verification. **Disable:** password →
`twoFactor.disable()`.

**Supabase still active:** `/console/security` says 2FA isn't available yet —
honestly, no dead toggle. The login page never sees `twoFactorRedirect` from
Supabase, so the code step is unreachable on that path.

## Pieces

| File | Role |
|------|------|
| `supabase/migrations/026_two_factor.sql` | `"twoFactor"` table + `"user"."twoFactorEnabled"` (camelCase, RLS-locked like 024) |
| `lib/auth/better-auth.ts` | `twoFactor` plugin: email OTP via `sendTwoFactorCodeEmail`, 5-min period |
| `lib/auth/auth-client.ts` | `twoFactorClient()` plugin (no auto-redirect — login handles the flag inline) |
| `lib/auth/two-factor-state.ts` | Pure, tested: `needsSecondFactor`, code normalization/validation, resend cooldown, error-code → human message |
| `lib/auth/auth-emails.ts` | `buildTwoFactorCodeEmail` — code-style email; code never in the subject line |
| `app/login/page.tsx` | In-place code step: numeric input, trust-device, resend w/ 30 s cooldown, back-to-password |
| `app/console/security/page.tsx` + `components/dashboard/security/TwoFactorSettings.tsx` | Enable/disable wizard (dark console chrome) |

Tests: `lib/auth/__tests__/two-factor-state.test.ts` (every pure branch) and
the 2FA cases in `auth-emails.test.ts` (code present in body, **never** in the
subject — lock-screen previews show subjects).

## Founder activation (when cutting over to Better Auth)

Nothing extra beyond the migration doc's checklist — step 2 there now applies
`026_two_factor.sql`. After cutover, verify: enable 2FA on a test account at
`/console/security`, sign out, sign in → code arrives → wrong code rejected →
right code lands in `/console`. `RESEND_API_KEY` must be set in prod or codes
log a warning server-side instead of sending (same graceful no-op as password
reset).
