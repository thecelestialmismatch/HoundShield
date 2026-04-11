# Legacy — Isolated Non-Production Code

This directory contains code that has been isolated from the main codebase during the production refactor.
Nothing here is imported by the live application. Safe to delete after 30-day review period.

---

## Contents

### `brain/` (45MB, ~2,200 files)

The `claw-code` reference implementation — a full Claude Code internals port including:
- Rust CLI (`brain/rust/`) — compiled CLI harness, not a Next.js module
- Bridge layer (`brain/bridge/`) — REPL bridge protocols, JWT utils, poll config
- CLI transports (`brain/cli/transports/`) — SSE, WebSocket, SerialBatch uploaders
- Commands (`brain/commands/`) — 40+ slash command implementations
- Tools (`brain/tools/`) — AgentTool, BashTool, FileEditTool, GrepTool, etc.
- Components (`brain/components/`) — Ink/terminal UI components
- Services (`brain/services/`) — analytics, compact, extractMemories, oauth, plugins

**Why isolated:** Zero imports from the Kaelus app layer. This is reference material for
the AI agent architecture, not production Next.js code. The actual Brain AI compliance
assistant lives in `lib/brain-ai/` (specifically `faq.ts` and `query-engine.ts`).

### `dashboard-deprecated/`

Dashboard pages that already contained redirect-to-/command-center stubs:
- `pixeloffice/` — pixel art office visualization, deprecated
- `calendar/` — calendar view, deprecated

**Why isolated:** These pages returned redirect responses only. Removing them from the
app route tree reduces the build artifact and eliminates dead route registrations.

### `remotion-experimental/`

Remotion video player components (`BarLineChartPlayer`, `BarLineChart`, `HorizontalScroll`, etc.)

**Why isolated:**
1. Known CSP bug: `data:audio/mp3` blocked by Content-Security-Policy headers
2. Remotion license warning requires `acknowledgeRemotionLicense` prop
3. Heavy runtime dependency for a single dashboard chart
4. Replaced by a pure Recharts `ComposedChart` in `app/command-center/page.tsx`

---

## Recovery

To restore any file, run:
```bash
git mv legacy/<path> <original-path>
```

All moves are tracked in git history on branch `feat/system-refactor-launch-prep`.
