# 🚀 FutureApp — Native App Launch Home

Staging ground for **HoundShield as an installable app** — the natural next step after the web
dashboard. Kept out of the shipping tree so it never affects the live product or the build.
Activate only after the **10-paying-customer** revenue gate (see `CLAUDE.md`).

## Why native, and why local-only
HoundShield's entire moat is *"nothing ever leaves your network."* A native desktop app is the
purest expression of that: the AI-prompt firewall + 16 detection engines run **on the
endpoint**, no cloud round-trip. That's a story no cloud DLP competitor (Nightfall, Strac,
Purview) can match.

## Layout
| Path        | Purpose                                                                 |
|-------------|-------------------------------------------------------------------------|
| `desktop/`  | **Tauri** app (Rust shell + reuse the Next.js dashboard). Local proxy bundled. |
| `mobile/`   | **Expo / React Native** companion — alerts, audit-log review, SPRS score on the go. |
| `shared/`   | Shared TypeScript types + API client reused across desktop/mobile/web.   |
| `docs/`     | Architecture, packaging, code-signing, and store/EXE distribution notes. |

## Activation (when the gate clears)
1. `cd FutureApp/desktop && npm create tauri-app@latest` (or wire the stub `package.json`).
2. Point the Tauri webview at the existing dashboard build from `compliance-firewall-agent/`.
3. Bundle the `proxy/` server as a sidecar so detection runs fully offline.
4. Code-sign (Apple Developer ID / Windows EV cert) — required for DoD endpoints.

> Until then: **Revenue before features.** This folder is parked on purpose.
