# Auth: password reset, GitHub OAuth, and the "name before login" question

HoundShield runs **two** auth clients behind one UI. Which is active is decided
at runtime by `isBetterAuthClientEnabled()`:

- **Supabase** (the live provider today) — email/password + OAuth via Supabase Auth.
- **Better Auth** (self-hosted) — used when its env is configured.

## Password reset — the bug and the fix

**Symptom (founder report):** "When I click the reset-password link it goes
straight to the homepage — I never get to set a new password."

**Root cause:** the Supabase reset email pointed at
`/auth/callback?redirect=/console`. `/auth/callback` exchanges the recovery code
into a **session** and forwards to `redirect` — so the user was silently logged
in and dropped on the console, skipping the password step entirely. Worse, the
`/reset-password` page was written **Better-Auth-only**: it required a `?token=`
that Supabase reset links never carry, so even reaching it showed "Link expired."

**Fix (this PR):**

1. `app/forgot-password/page.tsx` (Supabase path) now sends the recovery link to
   `/auth/callback?redirect=/reset-password` — the user lands on the set-password
   page, not the console.
2. `/auth/callback` still exchanges the recovery code into a session, then
   forwards to `/reset-password`. That recovery session is what authorizes the
   password change.
3. `app/reset-password/page.tsx` now supports **both** providers:
   - **Better Auth:** `?token=` → `authClient.resetPassword({ newPassword, token })`.
   - **Supabase:** confirms the recovery session, then
     `supabase.auth.updateUser({ password })`.
   - A `Verifying your reset link…` state shows while the Supabase session
     resolves, so a valid link never flashes "expired."

The branch decision is a pure, unit-tested function:
`lib/auth/reset-password-state.ts` (`resetView`) — guarded by
`lib/auth/__tests__/reset-password-state.test.ts`.

## Symptom recurred 2026-07-22 — and why code alone can't close it

Founder report: *"nothing happening — the reset link is sent by Supabase (not
HoundShield) and it takes me to the home page."* Two distinct problems, **both
rooted in the Supabase dashboard, not the app code** (verified: #224 / `baa7787`
is on `origin/main` and deployed, and every link in the code chain is correct):

1. **"…takes me to the home page."** The default email template's link routes
   through GoTrue, which redirects to the `redirect_to` (our
   `/auth/callback?redirect=/reset-password`). If that URL is **not in the
   Redirect-URL allowlist, GoTrue falls back to the Site URL** (the homepage).
   Landing on `/` — not `/login?error=auth_failed` — is the tell: an allowlist
   miss, not a code failure. (The dead OAuth buttons share the same `/auth/callback`
   and confirm the allowlist is incomplete.)
2. **"…sent by Supabase, not HoundShield."** Auth emails come from the Supabase
   project's **email templates + SMTP sender**, not the app's Resend integration.
   Unbranded sender + Supabase default template = a config gap no app code touches.

### The permanent fix — the allowlist-immune branded flow (this PR)

Rather than depend on the founder getting the allowlist wildcard exactly right,
this PR adds the **SSR-canonical `token_hash` route** so the recovery link can
target the Site URL directly (which is always trusted — it *cannot* fall back to
the homepage):

- New route `app/auth/confirm/route.ts` reads `?token_hash&type&next`, calls
  `supabase.auth.verifyOtp(...)` to establish the recovery session server-side,
  then redirects (recovery → `/reset-password`). Redirect decisions are the pure,
  unit-tested `lib/auth/confirm-redirect.ts` (`confirmRedirect` /
  `confirmFailureRedirect`), guarded by `__tests__/confirm-redirect.test.ts`.
- `/auth/callback` (PKCE `?code=`) is unchanged — it still serves OAuth and the
  default email template.
- `/reset-password` is unchanged — it consumes the session and calls
  `updateUser({ password })`.

### Founder dashboard steps (one-time — REQUIRED; the code above does nothing until these land)

**A. Redirect-URL allowlist + Site URL** — Supabase → Authentication → URL
Configuration. Set **Site URL** to `https://www.houndshield.com`. Add, using
`/**` wildcards (the links carry query strings a bare path can miss):

- `https://houndshield.com/**`
- `https://www.houndshield.com/**`
- `http://localhost:3000/**` (local dev)

This alone fixes the "homepage" symptom for the current default-template flow and
unblocks Google/GitHub OAuth (same callback).

**B. Branded recovery email template** — Supabase → Authentication → Email
Templates → **Reset Password**. Replace the body with the HoundShield-branded
template below. It points at `/auth/confirm` (the new route), so it is immune to
the allowlist fallback in step A:

```html
<h2 style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a">Reset your HoundShield password</h2>
<p style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#475569;font-size:14px;line-height:1.6">
  We received a request to reset the password for your HoundShield account.
  Click below to choose a new one. This link expires in 1 hour and can be used once.
</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password"
     style="display:inline-block;background:#1e3a5f;color:#ffffff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:12px">
    Set a new password
  </a>
</p>
<p style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#94a3b8;font-size:12px;line-height:1.6">
  Didn't request this? You can safely ignore this email — your password won't change.<br/>
  — HoundShield · AI Compliance Firewall
</p>
```

**C. Branded sender (fixes "sent by Supabase")** — Supabase → Project Settings →
Authentication → **SMTP Settings** → enable custom SMTP with Resend
(`smtp.resend.com`, port 465, user `resend`, password = a Resend API key), sender
`no-reply@houndshield.com`. Requires the houndshield.com domain verified in
Resend (it already is for the $499 sale alerts). Without this, mail still ships
from Supabase's shared sender and is rate-limited to a few per hour.

> **Verification is founder-gated.** This flow cannot be verified end-to-end from
> the worktree: it runs against the **live** Supabase project, and we deliberately
> do not trigger real recovery emails against production (it would email a real
> account). Unit tests + `tsc` + build cover the code; the live click-through is
> the founder's step after A–C are applied. Test path: request a reset →
> confirm the email is HoundShield-branded → click → land on `/reset-password`
> (never `/`) → set password → sign in.

### The zero-dashboard-dependency upgrade — reset works with NO founder config

Steps A–C above make the **default Supabase-template** flow correct, but they
still require the founder to touch the dashboard. This iteration removes that
dependency entirely: the app now mints the recovery link **and** sends the email
itself, so a working reset needs zero Supabase-dashboard changes.

- **New route `app/api/auth/reset-password/route.ts`** — calls
  `supabase.auth.admin.generateLink({ type: 'recovery', email })`. `generateLink`
  returns `data.properties.hashed_token` **without sending any Supabase email**.
  The route builds `/auth/confirm?token_hash=…&type=recovery&next=/reset-password`
  and sends it through the app's **Resend** integration
  (`sendPasswordResetEmail` — the same branded shell used for $499 sale alerts).
- **New helper `lib/auth/recovery-link.ts`** — `recoveryRequestSchema` (trim +
  lowercase + `.email()`) and the pure `buildRecoveryConfirmUrl(base, tokenHash)`.
  Guarded by `lib/auth/__tests__/recovery-link.test.ts`.
- **`app/forgot-password/page.tsx` (Supabase path)** now `POST`s to
  `/api/auth/reset-password` instead of the client `resetPasswordForEmail`, so the
  send goes through our route, not Supabase's mailer.

**Why this needs none of A–C for reset:**

- **No Redirect-URL allowlist (A):** the link targets `/auth/confirm`, a
  same-origin **app route** that runs `verifyOtp` directly. It never passes
  through GoTrue's `redirect_to` machinery, so there is nothing to allowlist and
  nothing that can fall back to the homepage.
- **No template (B) / no SMTP (C):** the email is authored by the app and sent
  from Resend (`noreply@houndshield.com`), so it is HoundShield-branded by
  construction and never uses Supabase's template or shared sender.

**Security properties:**

- **Enumeration-safe** — always answers `200 { ok: true }` for a well-formed
  email; a non-existent account errors inside `generateLink` and is swallowed
  (no send). Only a malformed body returns `400`.
- **No timing oracle** — the Resend send runs in `after()` (off the response
  path), so an existing account does not return slower than a non-existent one.
  Regression-guarded in `route.test.ts` (a never-settling send must not delay the
  `200`).
- **Anti email-bomb** — middleware rate-limits the route to
  `PASSWORD_RESET_RATE_LIMIT_MAX = 5` requests/min per IP.

**Requirements (Vercel prod env):** `SUPABASE_SERVICE_ROLE_KEY` (for
`generateLink`) and `RESEND_API_KEY` (the sender) must be set — both already are
for existing features, but confirm them: **every** misconfiguration here fails
*silently* (still `200 { ok: true }`, no email), i.e. it reproduces the exact
"nothing happening" symptom. `NEXT_PUBLIC_APP_URL` should also be set to the
canonical host so the link origin never falls back to a preview URL (absent it,
the route uses the request origin). If Supabase is unconfigured the route stays
enumeration-safe and sends nothing. The route logs its outcome server-side
(`recovery link dispatched` / `no recovery link minted` / `Supabase not
configured`) so a "nothing happening" report is a one-look diagnosis in the
Vercel function logs.

**Steps A–C are now optional for password reset.** Step **A (allowlist)** is still
required for **OAuth** (Google/GitHub use `/auth/callback`). B and C only matter
if you ever fall back to Supabase's default recovery template.

## GitHub OAuth — code is correct; enable it in the dashboards

The button wiring is standard and correct
(`supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo:
'/auth/callback?redirect=…' } })`). "GitHub sign-in isn't working" is a
**provider-configuration** gap, not a code bug. To turn it on (one-time, founder):

1. **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
   - Homepage URL: `https://www.houndshield.com`
   - Authorization callback URL: `https://<PROJECT-REF>.supabase.co/auth/v1/callback`
     (the Supabase project ref, e.g. `qifynzuyrdxmxlumpsrq`).
2. Copy the **Client ID** and generate a **Client secret**.
3. **Supabase → Authentication → Providers → GitHub** → enable, paste Client ID +
   secret, save.
4. **Supabase → Authentication → URL Configuration** → confirm
   `https://www.houndshield.com/auth/callback` is in the redirect allowlist
   (already there for Google OAuth).

Until step 3 is done, GitHub sign-in returns to `/login?error=auth_failed` by
design (the callback's failure path).

## "Brain AI shows my name before I log in"

`/api/me` is strictly session-derived (`supabase.auth.getUser()` on the
server-verified cookie); it returns `{ authenticated: false }` for guests, and
the Brain AI greeting is **not** cached client-side. So a name appears **only
when a valid session cookie is present** — i.e., you are still signed in from a
previous session (sessions persist by design; that is not "before login").

**To confirm it's working correctly:** open an incognito window and open Brain
AI — it must greet generically ("Hi! I'm Brain AI…"), with no name. If a name
still appears in incognito, that is a real bug worth a screenshot. Otherwise, to
make the app "forget" you faster, use Sign out, or we can add a shorter session
TTL / "sign out everywhere" control.
