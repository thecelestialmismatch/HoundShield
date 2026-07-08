# After-Login Dashboard — Unification & "Beast" Upgrade (2026-07-09)

One consistent, light, mobile-first post-login experience. The `/console` "Live
Command Center" is now THE after-login home, and the `/command-center` app is
re-themed onto the same light "Steel & Cream" palette so there is no second dark
world and no boxed logo.

## What changed

### `/console` — the after-login beast (`components/dashboard/LiveCommandCenter.tsx`, `lccStyles.ts`)
- **Evidence-chain spine** (the uncopyable differentiator): a persistent header
  on every tab — `Audit chain intact · block #… · head <sha> · verified Ns ago ·
  on your hardware` — with a one-click **Generate Audit PDF**. Structurally
  impossible for cloud-routed rivals (Nightfall/Polymer/Prompt Security) to show.
- **Brain AI, logo-forward + keyless**: the Doberman mark on the Brain panel
  header and on the Overview "Ask Brain AI" quick-ask card; six prompt cards
  (incl. "What changed this week?", "Draft my incident summary"); the mandatory
  **CUI warning** ("Do not enter CUI — routes to a commercial cloud endpoint").
- **Colour-coded KPI tiles**: each carries an accent hairline + icon tint
  (scanned=green, blocked=red, SPRS=steel, quarantine=amber) so status reads
  before a number does.
- **First-run checklist** ending on the PDF (activation driver).
- **Mobile-first**: off-canvas sidebar drawer + dismiss scrim, `100dvh`,
  `env(safe-area-inset-bottom)`, single-column KPIs, a Doberman mark in the
  top bar (where the sidebar brand is off-canvas), decluttered phone top bar.
- **Fonts actually load**: the console reaches Fraunces / DM Sans through the
  `next/font` CSS variables (`var(--font-display)` / `var(--font-body)`). A
  literal `'Fraunces'` family is hashed-unreachable and silently renders Times.
- **Throughput chart fix**: canvas colours are now hex literals — a 2D-context
  `strokeStyle` cannot resolve `var(--brand)` (it returned the *declared* string
  `var(--hs-steel-dark,#5A86A8)`), so the chart previously drew nothing.

### `/console` status header (`components/dashboard/CustomerStatusPanel.tsx`, `app/console/page.tsx`)
- Re-themed the personalized status panel from dark to light and scoped it under
  `.cc-light`, so the greeting/SPRS/next-step/gaps header flows seamlessly into
  the light dashboard below — one surface, no dark→light seam. All
  personalization (greet-by-name, real order/plan, 7-day trend) is unchanged.

### `/command-center` — unified onto light (`app/command-center/layout.tsx`, `app/globals.css`)
- Shell (sidebar + topbar + page bg) converted to the light Steel & Cream
  palette; the squished dark logo (`<Logo variant="dark" className="w-9 h-9">`,
  a portrait mark forced into a 36px **square**) is replaced by an aspect-correct
  `<Logo size={34} />` that tilts on hover.
- **`.cc-light` scoped layer** (`app/globals.css`): re-maps the recurring dark
  Tailwind utilities (`bg-[#0a0a0a]`, `text-white`, `border-white/10`, slate/zinc
  greys, …) to light equivalents. `.cc-light .util` (0,2,0) out-ranks the base
  `.util` (0,1,0), so ~15 dark functional pages re-theme at once WITHOUT editing
  ~600 classes or risking the assessment/scoring logic. White text is re-asserted
  on solid colour fills (buttons/badges/gradients) via `[class~="…"]`, so coloured
  tints keep their coloured text.

### Logo hover-tilt (`app/globals.css`, `app/hermes.css`, `lccStyles.ts`)
- Pronounced pose: hover tilt is now **`rotate(-8deg) scale(1.08)`** (was −4°,
  too close to the idle breathe's −3° peak → hover read as "nothing moved").
- **Reduced-motion fix**: under `prefers-reduced-motion`, the idle animation is
  re-asserted with `!important`; a running animation's keyframe transform beats
  the hover `transform` in the cascade, so the tilt silently died. Added an
  `!important` hover override inside the reduced-motion block so the tilt fires
  regardless of the OS setting (a hover is a discrete, user-initiated gesture).

### Login (`app/login/page.tsx`)
- "Forgot password?" darkened (`text-brand-400` → `text-brand-700`) for contrast.

## Tests
- New guard: `app/__tests__/console-dashboard-contract.test.ts` (fonts via var,
  evidence spine, Brain logo + CUI warning, mobile scrim, cc-light + unboxed logo).
- Updated `logo-motion-contract.test.ts` to the −8°/1.08 pose.
- Full suite green: **804 passed**. `npm run build` green.

## Known follow-ups (NOT in this PR)
- **GitHub OAuth login** fails because the GitHub provider isn't configured in
  Supabase Auth — a dashboard/provider config task, not a code bug. Moot if auth
  migrates (below).
- **Auth migration (WorkOS vs better-auth)** — see the open question in the PR /
  next session. Requires a provider decision + credentials before implementation.
