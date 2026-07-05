# Post-Login Dashboard Redesign (July 2026)

Branch: `claude/post-login-dashboard-redesign-mp5hdp`

The after-login surface is `/console` → renders `WelcomeBanner` + `CustomerStatusPanel`
+ `LiveCommandCenter` (login redirects here from `app/auth/page.tsx`). This pass made it
neat, clean, fully responsive (phone → desktop), more colorful, correctly typed, and gave
the in-dashboard Brain AI a top-notch conversational experience.

## What changed and why

### 1. Fonts now render in the real brand families (was falling back)
`components/dashboard/lccStyles.ts` declared its font tokens with **literal** family names:

```css
--f-disp:'Fraunces',serif; --f:'DM Sans',system-ui,sans-serif; --f-mono:'JetBrains Mono',monospace;
```

The app loads Fraunces + DM Sans through `next/font` (`app/fonts.ts`), which exposes them
**only** as the CSS variables `--font-display` / `--font-body` and pairs each with a
size-adjusted fallback (`"Fraunces Fallback"`, `"DM Sans Fallback"`). Referencing a bare
literal is fragile — it does not pick up the adjusted fallback and breaks outright if
`next/font` ever hashes the family name (the exact footgun called out in
`tailwind.config` comments). The dashboard now references the app's canonical variables:

```css
--f-disp: var(--font-display, 'Fraunces', Georgia, serif);
--f:      var(--font-body, 'DM Sans', system-ui, sans-serif);
--f-mono: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
```

Verified in a real browser: computed `font-family` on the KPI numbers, `h1`, body links,
and clock resolves to `Fraunces` / `DM Sans` / `JetBrains Mono` at desktop, tablet, and
phone widths. A regression guard (`LiveCommandCenter.test.tsx`) fails the build if the
literal-only form comes back.

### 2. `CustomerStatusPanel` was invisible (white-on-white) — now light-themed
The "Where you stand / your next step / how to fix" panel was styled for a **dark**
dashboard (`text-white`, `bg-white/[0.03]`, `border-white/[0.08]`) but mounts on the
**light** `/console` page above the light command center — rendering white text on a
near-white background. It is now rebuilt on the light Steel & Cream palette using the
`--hs-ink*` / `--hs-steel*` / `--hs-surface*` tokens, with an accessible standing badge,
a gradient CTA, and a soft card shadow that matches the command-center panels. A guard
test asserts it never re-introduces the dark translucent surfaces.

### 3. Fully responsive — phone, tablet, desktop
`lccStyles.ts` gained a real responsive system:

- **≥1001px** — 252px sidebar grid.
- **≤1000px (tablet)** — off-canvas sidebar with a tap-to-dismiss **backdrop** (new
  `.side-backdrop` element + handler in `LiveCommandCenter.tsx`), 2-col KPIs, single-column
  panel rows, burger toggle.
- **≤640px (phone)** — condensed sticky topbar (breadcrumb/clock/avatar hidden, status pill
  shrunk), tighter padding, stacked donut/legend, hidden feed latency column, taller Brain
  chat, wider chat bubbles.
- **≤380px** — single-column KPIs.
- `100dvh` sizing + `env(safe-area-inset-*)` padding so it sits correctly under mobile
  browser chrome and notches. All motion is `prefers-reduced-motion`-guarded.

### 4. More color, more depth (on-brand)
Per-metric KPI accents (steel / red / green / amber left bars + corner glows), gradient
brand wordmark and SPRS ring, gradient panel-header underlines, soft layered shadows, a
radial background wash on the main pane, glowing engine bars, hover lift on cards/KPIs, and
richer feed-engine chips. Palette stays inside the design system (steel, cream, semantic
ok/bad/warn, hint-of-orange) — no forbidden `amber-*`/`indigo-*`/`purple-*`.

### 5. Brain AI — top-notch
- **Typing indicator**: an animated three-dot bubble appears immediately, then swaps in the
  grounded answer with a considered cadence (reduced-motion aware, timers torn down on
  unmount).
- **Wider, grounded coverage**: identity, SPRS, readiness, DFARS 7012, HIPAA/PHI, fastest
  wins / next step, gaps/POA&M, setup/Docker, pricing (leads with the **$499 report**),
  audit/evidence, quarantine, greeting, thanks, contact. HIPAA/CUI answers correctly lead
  with **Mode B** and never claim the hosted path is CUI/PHI-safe (CLAUDE.md compliance).
- **Trust framing**: header + a persistent footer state "on-device · grounded in your own
  assessment & audit data · nothing sent to HoundShield", plus two more suggestion chips.
- Operator input is still HTML-escaped before it reaches the transcript (XSS test retained).

### 6. Beast mode — branded hero command band + logo everywhere
- **Hero command band** on the Overview tab: a steel-gradient banner with the org name
  (Fraunces), "HoundShield AI Compliance Command Center" tagline, a live gateway pill, glass
  metric chips (SPRS / Engines / Scan p50), and a faint HoundShield logo watermark. It anchors
  the dashboard with a strong, unmistakable brand identity the moment you log in.
- **The HoundShield mark is now on every dashboard surface**: sidebar brand, topbar (also the
  mobile brand anchor when the sidebar is off-canvas), the hero chip + watermark, the Brain AI
  panel header, and an avatar on **every** Brain AI reply (intro, answers, and the typing
  indicator). A render test asserts ≥5 marks are present.

### 7. Logo hover-tilt — pronounced, sideways, everywhere (founder-directed)
The brand mark tilts **in place** on hover — a deliberate sideways lean, `rotate(-8deg)
scale(1.08)` (strengthened from the previous `-4deg/1.06`, which barely differed from the
idle breathe and read as "not tilting"). It fires on hover on **the login page (`/login` +
`/auth`) and every after-login logo** (sidebar, topbar, hero, Brain header, Brain avatars).
It is **rotate/scale only — never a translate/slide** (the earlier sideways-slide regression
stays dead). Verified in a real browser: computed rotation goes to −8° on hover on all
surfaces. The `logo-motion-contract` guard test enforces the new pose and the anti-translate
rules across `globals.css`, `hermes.css`, and `lccStyles.ts`, plus the four new dashboard
placements.

## Competitor audit (why this direction)

| Product | Dashboard read | Takeaway applied |
|---|---|---|
| **Drata** | Cleanest, most guided; clear visual status indicators, direct access to key actions | Lead with "where you stand → your next step"; strong glanceable status |
| **Vanta** | Powerful but dense — heavy control-framework mapping can feel monotonous / "lost" | Keep control detail one layer down; surface the *single* next action first |
| **Nightfall / Prompt Security** | Cloud-routed DLP, no CMMC evidence artifact | Reinforce local-only + on-device Brain AI + PDF evidence as the differentiator |

Design principles adopted: answer-first ("where you stand"), one clear next step, glanceable
color-coded status, progressive disclosure of control detail, and mobile parity — a regulated
buyer (Rachel/Jordan) checking posture from a phone gets the same clean read as on desktop.

## Verification

- `next lint` clean (no new warnings), `tsc --noEmit` clean.
- `vitest run` — **783/783** (+13: Brain AI intent coverage, mobile backdrop toggle, typing
  indicator, font-variable contract, light-theme panel guard).
- `next build` green.
- Real-browser pass (Chromium) at 1440 / 768 / 390 px: fonts resolve to the brand families,
  status panel reads clearly, sidebar + backdrop work on mobile, Brain AI answers correctly.

## Files touched

- `components/dashboard/lccStyles.ts` — fonts, responsiveness, color/depth, hero band, logo placements + hover tilts.
- `components/dashboard/LiveCommandCenter.tsx` — hero band, topbar/Brain logos + avatars, backdrop, typing indicator, Brain AI coverage, chips, trust footer.
- `components/dashboard/CustomerStatusPanel.tsx` — dark → light theme.
- `app/console/page.tsx` — surface tint so the top strip reads as one dashboard.
- `app/globals.css`, `app/hermes.css` — pronounced logo hover tilt (`rotate(-8deg) scale(1.08)`) on the shared marks (covers the login pages + all `<Logo>` surfaces).
- `components/dashboard/__tests__/LiveCommandCenter.test.tsx` — new coverage + guards.
- `app/__tests__/logo-motion-contract.test.ts` — updated approved pose + the four new dashboard placements.
