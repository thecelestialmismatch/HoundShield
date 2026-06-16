# FutureApp/ — staging area for future app surfaces & launchers

> Where **future ways to ship and launch HoundShield** are scaffolded before they
> graduate into the repo proper. Today HoundShield ships as a Next.js web app
> (`compliance-firewall-agent/`) + an HTTPS proxy (`proxy/`). Tomorrow it may also
> ship as a desktop app, a mobile app, a CLI, or a packaged standalone launcher.
> Park that work here until it's real.

## What this folder is for

| Surface | Status | Notes |
|---------|--------|-------|
| **Standalone launcher** | 🟢 template here | `launch-app.sh` — one command to bring up the web app (+ proxy) for a demo or local run. |
| **Desktop app** (Electron/Tauri) | ⏳ future | A native shell around the web app for air-gapped (Mode C) operators. |
| **Mobile app** | ⏳ future | Read-only dashboard / alerts companion. |
| **CLI distribution** | ⏳ future | `houndshield scan ...` for CI pipelines. |
| **Packaged proxy app** | ⏳ future | Double-clickable Mode B proxy for non-technical defense IT. |

## `launch-app.sh` — the current launcher

A portable, dependency-light launcher for the **existing** app, parked here as the
seed for the future packaged launcher. It:

1. resolves the repo root (works from anywhere),
2. installs web-app deps if missing,
3. starts the Next.js dev server on `:3000`,
4. optionally starts the proxy (Mode B) if `--with-proxy` is passed.

```bash
./FutureApp/launch-app.sh             # web app only (http://localhost:3000)
./FutureApp/launch-app.sh --with-proxy # web app + HTTPS intercept proxy
./FutureApp/launch-app.sh --build      # production build + start instead of dev
```

This mirrors `.claude/launch.json` (the Claude Code dev launch config) and
`dev-start.sh`, kept here so the "how do I launch the app" answer lives next to the
"future app surfaces" plan.

## Rules

1. Future *app/launch* surfaces → here. Future *content/data* → `../FutureUse/`.
   Old/superseded → `../OldVersions/`.
2. Anything here that becomes real graduates into its own top-level folder
   (e.g. `desktop/`, `mobile/`) and gets a row in `PROJECT-STRUCTURE.md`.
3. Keep launchers portable: resolve paths via `git rev-parse --show-toplevel`,
   never hard-code an absolute path.
