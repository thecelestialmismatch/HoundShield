# HoundShield — Launch Checklist

> **Rewritten 2026-08-20.** This supersedes `LAUNCH-CHECKLIST-2026-06.md`, which
> was not merely stale — it was **dangerous**. It directed a *"C3PAO outreach
> wave (10 from marketplace.cmmcab.org)"*, and C3PAOs are **legally prohibited**
> from recommending tools to clients they assess (32 CFR Part 170, ISO 17020
> cooling-off). `CLAUDE.md` lists that on the NEVER-DO list. The old file also
> sold **$159/mo**, listed eight Stripe price-IDs for subscription tiers that do
> not exist, and cited "409/409 tests" against a suite that now runs 3,072.
>
> A launch checklist is a document someone *executes*. Treat a wrong one the way
> you would treat a wrong `.claude/rules/*` file.

**What we sell today: one product.** The **$499 one-time CMMC AI Risk Assessment
Report**. No subscription. Do not add a second pricing grid.

**Who we sell through: RPOs and MSPs.** Never C3PAOs. The co-branded offer is
**$399 wholesale — a flat $100 discount**, stated in dollars, never as a
percentage. Canonical: `lib/pricing/plans.ts`.

---

## 1 · Hard blockers — nothing ships until these are true

| # | Item | How to check it is done |
|---|---|---|
| 1 | **Publish the Mode B Docker image** | `git tag -l` currently returns **zero tags**, and `.github/workflows/docker-publish.yml` fires only on `push: tags: proxy-v*`. Until a tag exists, the CUI-safe deployment mode has never been built for a customer and a defense buyer has nothing to install. → `git tag proxy-v0.1.0 && git push --tags`, then confirm the workflow published. |
| 2 | **Open the Stripe Payment Link in a browser and confirm $499** | `buy.stripe.com` is blocked from every automated context, so this has genuinely never been verified. A dead or mispriced link makes every other item on this page pointless. 60 seconds. |
| 3 | **Incorporate, then fill in `lib/legal/entity.ts`** | The only `blocking: true` entry in `LAUNCH_BLOCKERS`. GDPR Art. 13(1)(a) and CCPA both require a named, contactable controller; until then it is unlimited personal liability. |

## 2 · Configuration — the order matters

Set in Vercel → project `compliance-firewall-agent` → Environment Variables,
**Production** checked, then redeploy. `/api/health` names every one of these by
variable while it is missing, so it is the check, not this list.

1. **Apply migration `034`, THEN set `MARKETING_POSTAL_ADDRESS`.** Reversed, the
   CAN-SPAM gate opens onto a column that does not exist and every drip run
   throws while looking healthy from outside.
2. **Apply migration `037`** — until then every free-demo lead is captured by
   email only, and a Resend failure loses it with no record.
3. `ENCRYPTION_KEY` = `openssl rand -hex 32`. Quarantine **fails closed** today,
   so the feature is dead until this exists.
4. `TURNSTILE_SECRET_KEY` — while unset, `verifyCaptcha()` returns **true for
   every token**. The control looks enabled and is not.
5. `AUTH_RESET_CODE_PEPPER` — while unset, password reset is disabled.
6. `STRIPE_SECRET_KEY` — **optional for selling.** Buys promo codes and the
   branded `/report/thank-you`; the $499 checkout already works without it via
   the hosted Payment Link.

**Already done — do not redo:** `STRIPE_WEBHOOK_SECRET` is set
(`/api/health` → `payments_webhook: "configured"`), so a completed purchase is
recorded, receipted and alerted.

## 3 · Pre-demo runbook — run it the day you start demos

1. `curl https://www.houndshield.com/api/health` → read the `degraded` array.
   It names what is missing; nothing else needs interpreting.
2. **`/demo`** → click a sample scenario → **Scan locally**. Confirm findings
   appear with NIST controls, that the **"network calls during this scan"**
   counter reads **0**, and that no pasted value is echoed back on screen.
3. Same page → **Generate my gap-report PDF** → open it. The demo script
   mandates the demo always ends on the PDF.
4. **Disconnect from the network and scan again.** It still works. This is the
   single most persuasive thing in the product — do it live, on the call.
5. `/pricing` → **Buy now** → confirm Stripe opens at **$499**.
6. Log in → **Command Center → Scanner** → same scan, same zero-network proof,
   inside the dashboard.
7. Repeat 2–3 at **375px** width.

## 4 · Known gaps — say these before a buyer finds them

- **Vercel is not FedRAMP-authorized.** The hosted trial is for **non-CUI
  evaluation only**. CUI-safe means **Mode B (Docker in the customer's
  environment)**. State this before every defense conversation.
- **SOC 2 is not started.** Mid-market DIB buyers will ask. Stage 2 item.
- **The Supabase GitHub integration has never validated a real migration.** It
  watches the repo-root `supabase/` directory, which holds one file with four
  `date_trunc`-in-index-expression errors, while the real 37 migrations live in
  `compliance-firewall-agent/supabase/migrations/`. Repoint it or delete the
  stale directory.
- **Brain AI routes to a commercial cloud endpoint.** The CUI warning is live on
  both surfaces; do not remove it.

## 5 · After the first sale

- Record the demo video (`docs/DEMO-SCRIPT.md`).
- RPO/MSP outreach wave — Cyber AB Marketplace, **RPOs only**.
- `npm audit --omit=dev --audit-level=high` in both packages.
- Begin SOC 2 Type I.
