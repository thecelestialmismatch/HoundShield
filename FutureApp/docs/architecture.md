# FutureApp Architecture (draft)

```
┌─────────────────────────── Endpoint (no cloud) ───────────────────────────┐
│  Tauri shell (Rust)                                                         │
│    ├── WebView  ─────────  Next.js dashboard (reused from app/)             │
│    └── Sidecar  ────────  proxy/ server.ts  (HTTPS intercept, 16 engines)  │
│                                   │                                          │
│                                   └── local SQLite + SHA-256 signed audit   │
└────────────────────────────────────────────────────────────────────────────┘
        ▲ shared/ : TS types + API client          ▲ Expo mobile (read-only)
```

Principles: zero data egress, deterministic detection (<10ms), C3PAO-ready PDF export
generated locally. Mobile is read-only over LAN/VPN to the desktop instance.
