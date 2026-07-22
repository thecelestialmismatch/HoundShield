# After-login console redesign — real-state-first + React-wired controls (2026-07-22)

Founder-directed: *"the after-login dashboard — nothing working, redesign it and
make sure all buttons work and have meaning, not just generic."*

The audit found the buttons **did** fire, but two things made `/console` feel like
a fake demo rather than a product:

1. The Brain-tab controls (starter chips + Send + Enter) were wired
   **imperatively** — `addEventListener` / `querySelectorAll('.chips button')`
   inside the mount effect, over React-rendered nodes. Split ownership like that
   is the "nothing works" smell: brittle, invisible to a no-dead-buttons guard,
   and a re-render away from silent breakage.
2. A **signed-in** operator (a real customer, or the founder) still landed on the
   simulated "Acme Defense" demo with their name pasted on top — no signal that
   this wasn't their live data, and no path to make it real.

## What changed

### 1. Brain controls → real React handlers (root cause, not symptom)

`components/dashboard/LiveCommandCenter.tsx`

- The starter chips are now `BRAIN_TAB_CHIPS.map(...)` with a real
  `onClick={() => askRef.current?.(q)}`.
- Send + the input's Enter key call `askRef.current?.(inputRef.current?.value ?? '')`.
- The imperative wiring (`addEventListener('click', onSend)`, the keydown listener,
  and the `querySelectorAll('.chips button')` loop) and its teardown are **deleted**.
- The input stays **uncontrolled** (`id="lcc-bi"` + `ref`) — the analyst clears it
  after each send, and the XSS-escape guard still reads the DOM value directly.

`askRef.current` is populated in the mount effect (it closes over the analyst's
async on-device assessment lookup, budget metering, and DOM transcript append), so
the React handlers stay one-liners that call into it.

### 2. Signed-in operators land on THEIR product (real-state-first)

- A new **activation anchor** (`ActivationStrip`) renders on the Overview for
  signed-in operators only (`isViewer`). It states plainly that the panels below
  are a **sample** of their Command Center, shows honest state pills (Proxy · not
  connected / Assessment · saved on this device / Reports · ready), and hands over
  the two real next actions: **Get your proxy URL** → Settings, **Start your
  assessment** → the 110-control board. Anonymous visitors don't see it (they're
  exploring the public demo).
- The hero band's live pill reads **"Sample preview"** for signed-in operators
  (their live data arrives when the proxy connects) and **"Live demo"** for the
  anonymous public demo.
- Brain answers were already routed to the operator's own on-device assessment
  (`BrainContext.own`); the redesign makes the surrounding framing match — a
  signed-in operator asking their SPRS score gets an honest *"you haven't answered
  any controls yet"*, never the sample org's `+78`.

## What deliberately did NOT change (founder-locked, and good)

- **The aurora palette / skin.** The soft slate→sage gradient, glass panels, and
  pastel data-viz are one source of truth shared with the marketing hero
  (`aurora-redesign-contract.test.ts`, `design-studio-contract.test.ts`, founder-
  directed 2026-07-18). The redesign refines layout and adds the activation
  surface **within** these tokens — it is not a palette swap.
- **The honesty contracts.** Simulated telemetry stays labeled; KPI seeds share
  one source of truth; provenance dialogs (KPI `setProv`, PR #208) stay; findings
  are name-only; no fabricated real-customer metrics.
- **Logo motion** (tilt, never translate) and the a11y token grades.

## Guard tests

`components/dashboard/__tests__/LiveCommandCenter.test.tsx` gained a redesign
contract (13 assertions):

- Brain chips + Send fire the analyst via React and append a user bubble.
- The old imperative wiring is gone from source (`querySelectorAll('.chips button')`
  / `addEventListener('click', onSend)`).
- The activation anchor renders for signed-in operators, not for anonymous ones.
- Its CTAs land on Settings / the assessment board (real destinations).
- The signed-in hero reads "Sample preview", not "Live demo".

Full gate green: `tsc --noEmit`, `next lint` (0 errors), `vitest run` (1479 tests),
`next build`. Verified in a clean production build (`next start`): signed-in
`/console` renders with zero console errors, the activation anchor is cohesive with
the aurora skin, and the SPRS chip returns the operator's own honest answer.
