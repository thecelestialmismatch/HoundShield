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

**Config required (founder, one-time — this is the live blocker):** the reset
link redirects through `/auth/callback`, so that URL MUST be in **Supabase →
Authentication → URL Configuration → Redirect URLs**. If it is not, Supabase
ignores the `redirect_to` and falls back to the **Site URL** — the user lands on
the homepage. That is exactly the "reset link goes straight to the homepage"
symptom (reported again 2026-07-21); landing on `/` (not `/login?error`) is the
tell that Supabase never honored the redirect, i.e. an allowlist miss, not a code
bug. Add wildcard entries covering every host the app is served on:

- `https://houndshield.com/**`
- `https://www.houndshield.com/**`
- `http://localhost:3000/**` (local dev)

Use `/**`, not a bare `.../auth/callback`, because the reset link carries a
`?redirect=%2Freset-password` query string a bare entry can fail to match. Set
**Site URL** to the canonical host (e.g. `https://www.houndshield.com`). Same
allowlist gates Google/GitHub OAuth, so this one change also unblocks those.

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
