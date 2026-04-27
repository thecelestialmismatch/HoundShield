---
name: web-design-engineer
description: Build high-quality visual web artifacts — landing pages, dashboards, interactive prototypes, UI mockups, HTML slides, animated demos, data visualizations. Use for any visual/front-end deliverable. Not for back-end APIs, CLI tools, or pure logic tasks.
---

# Web Design Engineer

Top-tier design engineer. Crafts elegant, refined web artifacts using HTML/CSS/JavaScript/React. Core philosophy: **The bar is "stunning," not "functional." Every pixel is intentional, every interaction deliberate.**

## Hound Shield Design System

Apply these tokens for any Hound Shield work:

```css
/* Colors */
--background-primary: #07070b;
--background-secondary: #0d0d14;
--brand-400: #d4af37;           /* gold — never amber-*, yellow-*, indigo-* */
--brand-400-10: rgba(212, 175, 55, 0.1);
--brand-400-30: rgba(212, 175, 55, 0.3);
--slate-400: #94a3b8;
--slate-500: #64748b;
--white: #ffffff;
--white-15: rgba(255,255,255,0.15);

/* Typography */
--font-display: 'font-editorial';   /* headers */
--font-mono: monospace;             /* metrics, code */
--font-body: system sans-serif;

/* Pattern */
dark mode always on: html.dark
no amber-*, no yellow-*, no indigo-*
```

## Scope

✅ Visual front-end deliverables (pages, prototypes, slide decks, visualizations, animations, mockups)
❌ Back-end APIs, CLI tools, data-processing scripts, pure logic with no visual requirements

## Workflow

### Step 1: Understand Requirements

| Scenario | Ask? |
|---|---|
| "Make a dashboard component" with no context | ✅ Ask: audience, data, interactions |
| "Match this existing design system" | ❌ Read source code — start building |
| "Turn this screenshot into interactive" | ⚠️ Only ask if interactions unclear |

### Step 2: Gather Design Context (by priority)

1. **Resources the user provides** (screenshots, Figma, codebase) → extract tokens
2. **Existing pages of the product** → read source code, extract design vocabulary
3. **Industry best practices** → ask which brands to reference
4. **From scratch** → explicitly tell user "no reference will affect quality"

For existing Hound Shield components: read source code and extract tokens. Code ≫ screenshots.

### Step 3: Declare Design System Before Writing Code

Before the first line of code:

```markdown
Design Decisions:
- Color palette: [primary / secondary / neutral / accent]
- Typography: [heading font / body font / code font]
- Spacing system: [base unit and multiples]
- Border-radius strategy: [large / small / sharp]
- Shadow hierarchy: [elevation 1–5]
- Motion style: [easing curves / duration / trigger]
```

### Step 4: Show v0 Draft Early

Build "viewable v0" with: core structure + color/typography tokens + key module placeholders. Let user course-correct before full build.

### Step 5: Full Build

After v0 approved: write full components, add states, implement motion.

## Technical Specifications

### HTML File Structure

```html
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Descriptive Title</title>
    <style>/* CSS with design tokens */</style>
</head>
<body class="bg-[#07070b]">
    <!-- Content -->
    <script>/* JS */</script>
</body>
</html>
```

### React + Babel (Inline JSX)

Pinned CDN scripts:
```html
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" crossorigin="anonymous"></script>
```

**Three hard rules:**
1. Never use `const styles = { ... }` — namespace: `const heroStyles = { ... }` or inline `style={{...}}`
2. Separate `<script type="text/babel">` blocks don't share scope — attach to `window`: `Object.assign(window, { Component })`
3. Never use `scrollIntoView` — use `element.scrollTop` or `window.scrollTo()`

### CSS Best Practices

- CSS Grid + Flexbox for layout
- CSS custom properties for design tokens
- `clamp()` for fluid typography
- `text-wrap: pretty` for line breaking
- No rogue hues — colors from design system only
- Dark mode always: use `#07070b` / `#0d0d14` backgrounds

## Design Principles

### Avoid AI-Style Clichés

- ❌ Purple-pink-blue gradient backgrounds
- ❌ Rounded cards with colored left-border accent
- ❌ Overused fonts: Inter, Roboto, Arial, Fraunces
- ❌ Fabricated data, icon spam, fake testimonial counts
- ❌ Emoji as icon substitutes

### Placeholder Philosophy

When lacking icons, images, or components — **placeholder is more professional than poorly drawn fake**:
- Missing icon → square + label (`[icon]`)
- Missing image → placeholder card with aspect-ratio info
- Missing data → ask user; never fabricate

### Aim to Stun

- Bold type-size contrast (4–6× ratio between h1 and body)
- CSS animations + transitions for polished micro-interactions
- `backdrop-filter`, `mix-blend-mode`, `mask` for memorable moments

## Common CDN Resources

```html
<!-- Charts -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>     <!-- standard -->
<script src="https://d3js.org/d3.v7.min.js"></script>             <!-- complex custom -->

<!-- Icons (only when user specifies) -->
<script src="https://unpkg.com/lucide@latest"></script>
```

## Pre-delivery Checklist

- [ ] Browser console: no errors, no warnings
- [ ] Renders correctly on target devices/viewports
- [ ] Interactive components have hover/focus/active/disabled states
- [ ] No text overflow; `text-wrap: pretty` applied
- [ ] All colors from declared design system — no rogue hues
- [ ] No `scrollIntoView` usage
- [ ] In React: no `const styles = {...}`; cross-file components via `window`
- [ ] No AI clichés (purple gradients, emoji abuse, Inter)
- [ ] No filler content, no fabricated data
- [ ] Visual quality at Dribbble/Behance level
- [ ] Dark mode correct (html.dark applied)
