# RPO / MSP Partner Application Funnel

**Status:** live (this PR). **Owner:** STRIKER (revenue) + ATLAS (backend).
**Mission tie-in:** Stage-1 channel #1 — the ≥1 RPO/MSP referral agreement goal (0/1).

## The gap this closed

The application backend had existed for months but had **no UI caller** — the
"capability with no caller" dangling thread (`tasks/lessons.md`, 2026-07-04):

| Piece | Status before | Where |
|-------|---------------|-------|
| Application API | built + tested, **never called** | `app/api/partners/apply/route.ts` |
| `partner_applications` table | migrated, RLS-locked | `supabase/migrations/005_partner_applications.sql` |
| Founder alert email | wired into the route | `route.ts` (Resend) |
| Branded applicant welcome | built + tested, **never sent** | `lib/email/templates/partner-welcome.ts` |
| **Application form (the caller)** | **did not exist** | — |

Every partner CTA on `/partners` and `/partners/kit` pointed at the **generic
`/contact` form**, so an RPO who wanted to co-sell:

- never landed in `partner_applications` (lost the structured client-count +
  partner-type data the founder uses to triage),
- never triggered the "New Partner Application" founder alert, and
- never received the branded welcome email that keeps the channel warm.

## What ships now

- **`app/partners/apply/page.tsx`** — SEO'd application page (canonical + OG,
  in the sitemap). Offer recap ($299 wholesale · 14-day local assessment · no
  exclusivity · local-only), a "what happens next" strip that mirrors the
  welcome email's two-business-day promise, and cross-links to the kit/overview.
- **`app/partners/apply/PartnerApplyForm.tsx`** — the client form (the caller).
  Fields map 1:1 to the route's zod schema: `name`, `company`, `email`,
  `partnerType` (`referral | reseller | technology`), `clientCount` (optional
  number), `message` (optional).
- **CTAs repointed** — both `/partners` CTAs and the `/partners/kit` primary CTA
  now go to `/partners/apply` instead of `/contact`.

## Honesty contract (`tasks/lessons.md`, 2026-07-12)

The form makes a **real** `fetch("/api/partners/apply")` and shows the success
state **only** on `res.ok && data.success`. On any failure — non-ok response or
network throw — it degrades to a direct, monitored inbox
(`contact@houndshield.com`) and **never fakes success**. A fake success would
silently shred a partner lead, which is worse than a visible error.

## Channel doctrine (32 CFR Part 170)

The form and page state the C3PAO exclusion plainly: assessors cannot refer or
resell tools to clients they assess (32 CFR Part 170 / ISO 17020 cooling-off).
The program is for RPOs, MSPs, MSSPs, and compliance consultancies.

## Guardrails

- `app/partners/apply/__tests__/PartnerApplyForm.test.tsx` — validation, exact
  payload shape (numeric `clientCount`, omitted when blank), success-only-on-ok,
  honest fallback on both failure modes, C3PAO exclusion copy.
- `app/partners/apply/__tests__/apply-funnel-contract.test.ts` — source-level
  regression guard: the route has a caller, the page renders the form, the CTAs
  point at `/partners/apply` (and no partner CTA falls back to `/contact`), the
  page is in the sitemap, and the no-fake-success pattern holds.

## Founder / ops notes

- Applications land in `partner_applications` (status `pending`). Review and set
  `status` to `approved` / `active` as partners are onboarded.
- The founder alert routes to `FOUNDER_EMAIL || info@houndshield.com`; the
  applicant welcome + both notification emails require `RESEND_API_KEY` (already
  set in Vercel). Without it the application still records — email is best-effort
  and never blocks the insert.
