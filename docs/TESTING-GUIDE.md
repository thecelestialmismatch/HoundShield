# Testing HoundShield From Zero

Written assuming you have never tested software. Every command here was actually run on
2026-07-28; the "passing result" blocks are the **real** output observed, not examples.

Work top to bottom. Tests 0 and 1 need no setup and take one minute.

---

## The two rules that matter more than any command

**1. Read the output, never the exit code.** When a command is piped
(`something | tail`), the status you get back belongs to `tail`, not to the real command.
A crashed test run can report success. This bit me three times in one session — twice
reporting "passed" when nothing had run at all.

**2. Be in the right directory.** The shell resets between commands. Running
`npx vitest` from the repo root silently loads the *parent* repo's config, fails to find
the tests, and exits 0 — a green light for a test run that never happened.

Both rules reduce to: **look at the last few lines and check they say what you expect.**

---

## Test 0 — Is the site alive? (30 seconds)

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://www.houndshield.com/
```

**Passing:** `200`
Anything else (`000`, `500`, `502`) means the site is down.

---

## Test 1 — Can you get paid? (the most valuable 10 seconds you have)

```bash
curl -s https://www.houndshield.com/api/health
```

Look at the `services` block. Every value must be `connected`, `configured` or
`operational`.

**Passing:**
```
"payments":"connected"
"payments_webhook":"configured"
"database":"connected"
"classifier":"operational"
```

**As of 2026-07-28 this FAILS:** `"payments":"malformed_key"` — a publishable key sits in
the secret slot, so no customer can pay. Fix: [STRIPE-FIX.md](./STRIPE-FIX.md).

**Run this after every single deploy.** It is your smoke test.

---

## Test 2 — Does the app still work? (~20 seconds)

```bash
cd compliance-firewall-agent && ./node_modules/.bin/vitest run
```

**Passing:**
```
Test Files  124 passed (124)
     Tests  1531 passed (1531)
```

Note `./node_modules/.bin/vitest`, not `npx vitest` — that guarantees the project's own
runner and config.

**Two traps, both of which exit 0 while failing:**
- Never add `--reporter=basic` → crashes with `ERR_LOAD_URL`.
- Never run it from the repo root → `MODULE_NOT_FOUND` against the parent config.

---

## Test 3 — Is it actually as fast as the homepage claims?

```bash
cd proxy && npm run bench
```

**Passing:**
```
p99 : 0.492 ms  (budget: 10 ms)
PASS — p99 within the 10 ms budget.
```

This is the claim customers care about, and it passes with ~20× headroom. If p99 ever
exceeds 10ms, the homepage became false — fix the code or change the claim.

---

## Test 4 — Does the proxy pass its own tests?

```bash
cd proxy && npx vitest run
```

**Passing:**
```
Test Files  2 passed (2)
     Tests  61 passed (61)
```

**If you see `NODE_MODULE_VERSION` errors**, that is not a code bug — the native
`better-sqlite3` binary was compiled against a different Node version. Fix:

```bash
cd proxy && npm rebuild better-sqlite3
```

This exact issue was previously mistaken for "the proxy is broken." It was 17 failing
tests caused entirely by a stale binary; one rebuild command made all 61 pass.

---

## Test 5 — Does it still build? (run before every deploy)

```bash
cd compliance-firewall-agent && npm run build
```

**Passing:** ends with the route table and no `Error:` lines.

**Stop any dev server first.** Building while `npm run dev` is running corrupts `.next`.
If the build starts behaving strangely: `rm -rf .next` and build again.

---

## Test 6 — Be your own customer (do this with your own email)

The only test that tells you what a buyer experiences. Nothing here needs a terminal.
Use a **private/incognito window** so you are not logged in as yourself.

1. **The free proof.** Open <https://www.houndshield.com/demo#snapshot>. Paste:
   ```
   Patient John Smith, DOB 03/12/1961, MRN 4471982, diagnosed with hypertension.
   ```
   **Passing:** findings appear naming the *pattern types* detected (e.g. "PHI · MRN"),
   and a preview PDF downloads.
   **Check the thing that matters:** the findings must NOT echo back the matched text
   itself. Seeing "4471982" on screen would mean we leak the very data we claim to
   protect. Names of patterns only.

2. **Sign up with your own real email.** Go to `/signup`, use your actual inbox.
   **Passing:** the verification email arrives within ~2 minutes, from a
   `houndshield.com` sender, and the link logs you in.
   **Check:** does it land in spam? Does it look like your brand? That is exactly what a
   prospect sees.

3. **Reset your own password.** Log out → `/forgot-password` → enter the same email.
   **Passing:** a branded reset email arrives and the link works.
   **Known failure mode:** this can fail *silently* if `SUPABASE_SERVICE_ROLE_KEY` or
   `RESEND_API_KEY` are unset. No email and no error message = check those env vars.

4. **Land on the dashboard.** After login you get `/console`.
   **Passing:** your own company name, no fake data presented as yours, and anything
   sample-based is clearly labelled.

5. **Try to buy your own product.** `/pricing` → buy the $499 report with a real card.
   **Passing:** payment succeeds → a row appears in `report_orders` in Supabase → you
   receive the founder sale alert email.
   **Today this fails at checkout** — that failure IS the finding (see Test 1).
   Refund yourself afterwards in Stripe → Payments → the charge → Refund.

**Write down every moment you were confused or annoyed.** You are the least
representative user you will ever have — you know where everything is. If *you* stumble,
a Privacy Officer at a clinic will simply leave.

---

## Test 7 — Can a stranger install it? (currently FAILS)

```bash
docker pull houndshield/proxy:latest
```

**Passing:** the image pulls and runs.
**Today:** not found — the image was never published.

The `docker-publish.yml` workflow exists and is correct. It never ran because:
1. `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN` repo secrets are not set, and
2. no `proxy-v*` tag has ever been pushed.

Fix (~10 minutes): add the two secrets in GitHub → Settings → Secrets → Actions, then:

```bash
git tag proxy-v1.0.0 && git push origin proxy-v1.0.0
```

Until this passes, self-hosted Mode B — the entire CUI-safe claim — cannot be delivered
to a customer.

---

## Scorecard

| Test | What it proves | Today |
|---|---|---|
| 0 · site up | the front door works | **PASS** |
| 1 · health | you can get paid | **FAIL** — `malformed_key` |
| 2 · app tests | nothing regressed | **PASS** — 1531 |
| 3 · benchmark | the speed claim is true | **PASS** — p99 0.492ms |
| 4 · proxy tests | the product works | **PASS** — 61 |
| 5 · build | it can deploy | **PASS** |
| 6 · be the customer | the funnel works | **PARTIAL** — dies at checkout |
| 7 · docker pull | a stranger can install it | **FAIL** — never published |

**Two failures, both founder-only, both under 15 minutes: the Stripe key, and the Docker
secrets plus tag.** Neither needs an engineer.
