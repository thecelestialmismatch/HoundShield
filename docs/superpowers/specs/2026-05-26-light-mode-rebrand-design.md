# HoundShield — Light-Mode Rebrand Design Spec

**Date:** 2026-05-26
**Branch:** `HoundShield/beautiful-wiles-b5b879`
**Scope:** Visual identity swap (logo + color palette + theme mode).
**Non-scope:** Functionality, routes, copy, components, features, pricing, partner cards, Brain AI, proxy engine, Supabase, Stripe, tests (other than snapshots of touched components).

---

## 1. Goal

Replace HoundShield's current coral/dark identity with a soft blue + cream pastel identity, on a light-mode default, while preserving every existing feature, route, layout, animation, and component contract.

Reference sites:
- Current production: https://www.houndshield.com/
- Previous Vercel preview: https://compliance-firewall-agent-fn2xuvj9i.vercel.app/

---

## 2. New Brand Identity

### 2.1 Source palette (user-supplied)

| Role (palette label) | Hex       | RGB              |
|----------------------|-----------|------------------|
| Blue                 | `#81A6C6` | rgb(129,166,198) |
| Sea                  | `#AACDDC` | rgb(170,205,220) |
| Cream                | `#F3E3D0` | rgb(243,227,208) |
| Beige                | `#D2C4B4` | rgb(210,196,180) |

### 2.2 Generated brand scale (anchored to Blue = brand-500)

| Token       | Hex       | Use                                            |
|-------------|-----------|------------------------------------------------|
| `brand-50`  | `#F3F7FA` | hover wash, focus halo                         |
| `brand-100` | `#E1ECF4` | subtle backgrounds, badges                     |
| `brand-200` | `#C4D9E8` | dividers, secondary surfaces                   |
| `brand-300` | `#AACDDC` | **palette Sea** — soft accent                  |
| `brand-400` | `#95B9D0` | hover state for primary                        |
| `brand-500` | `#81A6C6` | **palette Blue** — PRIMARY CTA, links, focus   |
| `brand-600` | `#6790B5` | pressed state                                  |
| `brand-700` | `#527A9F` | active/dark text on light                      |
| `brand-800` | `#3D6485` | deepest blue                                   |
| `brand-900` | `#2C4E6B` | header on light bg                             |

### 2.3 Cream scale

| Token       | Hex       | Use                                  |
|-------------|-----------|--------------------------------------|
| `cream-50`  | `#FBF8F2` | page bg                              |
| `cream-100` | `#F3E3D0` | **palette Cream** — section bg       |
| `cream-200` | `#E5D2BD` | alt section bg                       |
| `cream-300` | `#D2C4B4` | **palette Beige** — borders, accents |
| `cream-400` | `#B8A89A` | muted text on cream                  |

### 2.4 Repointed aliases

- `neon` → removed (was coral). Use `brand-500` directly.
- `accent.DEFAULT` → `#81A6C6`, `.light` → `#AACDDC`, `.dark` → `#6790B5`, `.muted` → `rgba(129,166,198,0.08)`
- `info` → blue (was coral). Same hexes as accent.
- `warning` → keep amber (semantic, not brand).
- `success` → keep emerald (semantic).
- `danger` → keep red (semantic).

### 2.5 Shadow / glow

`shadow-glow*` rgba `(218,119,86,*)` → `(129,166,198,*)` at same opacities. Reduce opacity by 30% globally — blue glows on cream look heavier than coral glows on near-black.

### 2.6 Gradient

`gradient-arctic` repointed to cream:
```
linear-gradient(135deg, #FBF8F2 0%, #F3E3D0 50%, #E5D2BD 100%)
```

---

## 3. Theme Mode

Light is the default everywhere. Dark mode remains opt-in via theme toggle but no longer dictates marketing/landing.

- `<html className="dark">` → `<html>` (no class)
- `theme-provider` initial value → `"light"`
- Theme toggle preserved (user can still flip to dark)
- Dashboard (`PlatformDashboard`) flipped to light surfaces — keep `ssr: false` for Recharts
- Selection / scrollbar / focus ring → blue rgba

### 3.1 Background tokens

| Surface         | Old                | New                  |
|-----------------|--------------------|----------------------|
| Body            | `#0a0a0a` (dark)   | `#ffffff`            |
| Homepage hero   | `#07070b`          | `#FBF8F2` (cream-50) |
| Alt section     | `#0d0d14`          | `#F3E3D0` (cream-100)|
| Glass cards     | `bg-white/[0.03]`  | `bg-white/80`        |
| Card border     | `border-white/[0.08]` | `border-slate-200` |
| Mega-menu panel | `bg-[#0a0a0a]/95`  | `bg-white/95`        |

### 3.2 Text tokens

| Role        | Old              | New                | Notes |
|-------------|------------------|--------------------|-------|
| Primary     | `text-white`     | `text-slate-900`   |       |
| Secondary   | `text-slate-400` | `text-slate-600`   |       |
| Muted       | `text-slate-500` | `text-slate-500`   | unchanged |
| Brand text on light bg | `text-brand-400` | `text-brand-700` | WCAG AA — `brand-500` fails on cream |
| Brand text on dark bg  | `text-brand-400` | `text-brand-300`   | Sea — lighter for legibility |
| Brand text inside filled CTA | `text-white` | `text-white`     | brand-500 button + white text is OK |

**CTA button**: `bg-brand-500 text-white hover:bg-brand-600`. Never `text-brand-500` for body text on cream — always `brand-700` or darker.

---

## 4. Logo

### 4.1 Asset delivery (manual step by user)

User saves the new logo into:
```
compliance-firewall-agent/public/houndshield-logo.png   (required)
compliance-firewall-agent/public/houndshield-logo.svg   (optional, preferred)
compliance-firewall-agent/public/favicon.ico            (recommended)
compliance-firewall-agent/public/apple-touch-icon.png   (recommended, 180×180)
```

Image is a black doberman silhouette inside a shield, transparent background.

### 4.2 Logo.tsx rewrite

Replace the gradient-tile + Lucide `Shield + Zap` composition with a `next/image` reference to the PNG.

```tsx
import Image from "next/image";

export function Logo({ className = "", size = 32 }: { className?: string; size?: number }) {
  return (
    <Image
      src="/houndshield-logo.png"
      alt="HoundShield"
      width={size}
      height={size}
      priority
      className={`flex-shrink-0 ${className}`}
    />
  );
}
```

### 4.3 TextLogo.tsx rewrite

```tsx
export function TextLogo({ className = "", variant = "light" }: { className?: string; variant?: "light" | "dark" }) {
  const houndColor = variant === "dark"
    ? "from-brand-300 to-brand-500"
    : "from-brand-700 to-brand-500";
  const shieldColor = variant === "dark" ? "text-white/90" : "text-slate-900/90";
  return (
    <span className={`text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r ${houndColor} transition-all duration-300 ${className}`}>
      Hound<span className={`${shieldColor} font-bold`}> Shield</span>
    </span>
  );
}
```

Snapshot tests for both components will be updated to match.

---

## 5. Files Affected

### 5.1 Direct edits (high confidence)

| Path | Reason |
|------|--------|
| `compliance-firewall-agent/tailwind.config.js` | Brand scale, cream scale, shadow, gradient |
| `compliance-firewall-agent/app/globals.css` | Body bg, rgba refs, focus ring, scrollbar, spotlight, card-glow |
| `compliance-firewall-agent/app/layout.tsx` | Drop `className="dark"` from `<html>` |
| `compliance-firewall-agent/components/theme-provider.tsx` | Default theme = light |
| `compliance-firewall-agent/components/Logo.tsx` | Swap to `next/image` of new PNG |
| `compliance-firewall-agent/components/TextLogo.tsx` | Blue gradient, light variant default |
| `compliance-firewall-agent/components/Navbar.tsx` | ~25 inline `rgba(234,88,12,*)` → blue; mobile bg flip |
| `compliance-firewall-agent/components/landing/*.tsx` | Hardcoded coral hexes, dark surfaces |
| `compliance-firewall-agent/components/__tests__/Logo.test.tsx.snap` | Regenerated |
| `compliance-firewall-agent/components/__tests__/TextLogo.test.tsx.snap` | Regenerated |
| `compliance-firewall-agent/app/page.tsx` | Background, hero gradients |
| `compliance-firewall-agent/app/(landing routes)/**/page.tsx` | Same — pricing, features, partners, docs, contact, security, hipaa |
| `compliance-firewall-agent/app/command-center/**/*.tsx` | Dashboard surfaces light |
| `.claude/rules/frontend.md` | Rewrite "NEVER blue-*" rule; flip dark-default → light-default |
| `CLAUDE.md` | Design System section rewritten |
| `~/.claude/primer.md` | Design System block rewritten |

### 5.2 Discovery sweep (run before edit)

```bash
# Coral hex codes
grep -rln "234,\s*88,\s*12\|EA580C\|DA7756\|E48B6A\|C96441\|FB923C" \
  compliance-firewall-agent/components compliance-firewall-agent/app

# Warm Tailwind classes
grep -rln "amber-\|yellow-\|orange-\|indigo-" \
  compliance-firewall-agent/components compliance-firewall-agent/app
```

Pre-edit baseline: 66 files with brand-/coral hex, 35 files with amber/yellow/orange/indigo.

### 5.3 Replacement map (regex-safe)

| Old                            | New                                |
|--------------------------------|------------------------------------|
| `rgba(234, 88, 12, X)`         | `rgba(129, 166, 198, X)`           |
| `rgba(234,88,12,X)`            | `rgba(129,166,198,X)`              |
| `rgba(218, 119, 86, X)`        | `rgba(129, 166, 198, X)`           |
| `rgba(251, 146, 60, X)`        | `rgba(170, 205, 220, X)`           |
| `#EA580C`                      | `#81A6C6`                          |
| `#DA7756`                      | `#81A6C6`                          |
| `#E48B6A`                      | `#95B9D0`                          |
| `#C96441`                      | `#6790B5`                          |
| `#C2410C`                      | `#527A9F`                          |
| `bg-[#07070b]`                 | `bg-[#FBF8F2]`                     |
| `bg-[#0d0d14]`                 | `bg-[#F3E3D0]`                     |
| `bg-[#0a0a0a]/95`              | `bg-white/95`                      |
| `bg-[#0a0a0a]/85`              | `bg-white/85`                      |
| `text-white` (header default)  | `text-slate-900`                   |
| `text-slate-400`               | `text-slate-600`                   |
| `border-white/[0.08]`          | `border-slate-200`                 |
| `border-white/[0.06]`          | `border-slate-100`                 |
| `bg-white/[0.03]`              | `bg-white/80`                      |
| `bg-white/[0.04]`              | `bg-white/90`                      |
| `text-brand-400`               | `text-brand-500`                   |

Sweep is per-file with diff review — never blind `sed -i` across the repo, since some `text-white` instances are intentional (badges on colored backgrounds, etc.).

---

## 6. Architecture — What Stays Identical

- All routes, page structure, mega-menu data, NavBar items, footer, CTAs.
- All component contracts (props, exports).
- Framer Motion animation timings (only color values inside `motion.div` style props change).
- Recharts dataset shapes (chart fill/stroke colors swap to blue).
- `PlatformDashboard` stays `dynamic(..., { ssr: false })`.
- Custom `CursorGlow` cursor stays on `pointer:fine`; color tint repointed to blue.
- Theme toggle remains functional; only default flips from dark → light.
- Brain AI, proxy, classifier, audit log, Stripe, Supabase — zero changes.

---

## 7. Risks

| Risk                                                                 | Mitigation                                                         |
|----------------------------------------------------------------------|--------------------------------------------------------------------|
| Coral glow opacity on dark bg ≠ blue glow opacity on cream bg        | Reduce all `shadow-glow*` alpha by 30%; verify in Playwright       |
| Inline `style={{ background: "radial-gradient(...,#EA580C,...)" }}`  | Grep + replace; spec covers replacement map                        |
| Recharts hardcoded fills (`fill="#EA580C"`)                          | Audited in dashboard sweep; swap to `brand-500`                    |
| Dark-mode toggle broken after flip                                   | E2E click test in Playwright                                       |
| Snapshot tests stale                                                 | Update via `npm test -- -u` on touched components                  |
| `frontend.md` "NEVER blue" rule unenforced in pre-commit hooks       | Rule file rewritten; no automated lint enforces color names today |
| CursorGlow brightness too high on light bg                           | Adjust opacity in component CSS                                    |
| WCAG AA — blue `#81A6C6` on cream `#FBF8F2` may fail body text contrast | Use `brand-700`/`brand-800` for body text; `brand-500` for accents only |

---

## 8. Verification Gates

In order:

1. `cd compliance-firewall-agent && npm run build` → must pass with zero TS errors
2. `npx tsc --noEmit` → zero errors
3. `npm test -- --silent` → green; snapshot updates committed
4. `npm run dev` → start localhost:3000
5. Playwright screenshot suite:
   - `/` — hero light, blue Start Free button, logo top-left
   - `/pricing` — light, tier cards readable
   - `/features` — light, 16 engine grid
   - `/partners` — light, RPO cards
   - `/security` — light, mode A/B/C disclaimer intact
   - `/command-center` (logged-in dashboard placeholder) — light surfaces, Recharts blue
6. Grep regression check:
   ```bash
   grep -rn "234,\s*88,\s*12\|#EA580C\|#DA7756" compliance-firewall-agent/components compliance-firewall-agent/app
   # Must return 0 results
   ```
7. WCAG check: brand-500 (`#81A6C6`) on cream-50 (`#FBF8F2`) — contrast ratio 2.4 (FAIL for text). Use brand-700+ for any body text.

---

## 9. Execution Order (atomic commits)

1. `chore(spec): add light-mode rebrand design spec` — this file
2. `feat(rebrand): blue brand scale + cream scale in tailwind config`
3. `feat(rebrand): light-default globals.css + blue rgba`
4. `feat(rebrand): new logo asset + Logo/TextLogo components`
5. `feat(rebrand): theme provider light default + html className`
6. `refactor(rebrand): sweep coral hex/rgba in Navbar`
7. `refactor(rebrand): sweep coral hex/rgba in landing components`
8. `refactor(rebrand): sweep dashboard + Recharts colors`
9. `docs(rebrand): update frontend.md, CLAUDE.md, primer.md design system`
10. `test(rebrand): update Logo/TextLogo snapshots`
11. `chore: open PR HoundShield/beautiful-wiles-b5b879 → main`

Push and Vercel auto-deploys a preview URL. Share that URL for review before any merge to main.

---

## 10. Out of Scope (explicit)

- Backend/proxy/scanner code
- Compliance engine patterns
- Pricing tier values or copy
- Stripe webhook secrets, Supabase keys
- Mode A/B/C disclaimer wording
- Brain AI consent gate logic
- GHCR Docker tag/publish workflow
- Any HERMES doctrine product decisions (kill criteria, buyer sequence, channel partners)
- Bumping React/Next.js versions

---

## 11. Rollback

If preview deploy looks wrong:
- Revert branch (`git revert <merge-commit>`) or delete preview.
- Production `main` was never touched at any point.
- Old coral identity restored in a single `git revert` of the rebrand commit chain.
