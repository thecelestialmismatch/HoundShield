#!/usr/bin/env bash
#
# FutureApp/launch-app.sh — portable HoundShield launcher
#
# Seed for the future packaged/standalone launcher. Brings up the existing
# Next.js web app (and optionally the Mode B HTTPS proxy) with one command.
#
# Usage:
#   ./FutureApp/launch-app.sh               # web app (dev) on :3000
#   ./FutureApp/launch-app.sh --with-proxy  # web app + proxy
#   ./FutureApp/launch-app.sh --build       # production build + start
#   ./FutureApp/launch-app.sh --help
#
# Portable by design: resolves the repo root via git, never hard-codes a path.
set -euo pipefail

WITH_PROXY=0
MODE="dev"

for arg in "$@"; do
  case "$arg" in
    --with-proxy) WITH_PROXY=1 ;;
    --build)      MODE="build" ;;
    --help|-h)
      sed -n '3,16p' "$0"
      exit 0
      ;;
    *) echo "Unknown option: $arg (try --help)" >&2; exit 1 ;;
  esac
done

# Resolve repo root (works from any CWD, inside worktrees too).
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$ROOT" ]; then
  echo "❌ Not inside a git repo — cannot locate the HoundShield root." >&2
  exit 1
fi

APP="$ROOT/compliance-firewall-agent"
PROXY="$ROOT/proxy"

if [ ! -d "$APP" ]; then
  echo "❌ Web app not found at $APP" >&2
  exit 1
fi

echo "🐕  HoundShield launcher"
echo "    root : $ROOT"
echo "    app  : $APP"
echo "    mode : $MODE  | proxy: $([ "$WITH_PROXY" = 1 ] && echo on || echo off)"

# Install web-app deps if missing.
if [ ! -d "$APP/node_modules" ]; then
  echo "📦 Installing web-app dependencies (first run)…"
  ( cd "$APP" && npm install )
fi

# Optionally start the proxy in the background (Mode B).
if [ "$WITH_PROXY" = 1 ] && [ -d "$PROXY" ]; then
  echo "🛡️  Starting HTTPS intercept proxy…"
  if [ ! -d "$PROXY/node_modules" ] && [ -f "$PROXY/package.json" ]; then
    ( cd "$PROXY" && npm install )
  fi
  ( cd "$PROXY" && npm start >/tmp/houndshield-proxy.log 2>&1 & )
  echo "    proxy logs → /tmp/houndshield-proxy.log"
fi

# Start the web app.
cd "$APP"
if [ "$MODE" = "build" ]; then
  echo "🏗️  Production build…"
  npm run build
  echo "🚀 Starting production server on http://localhost:3000"
  npm run start
else
  echo "🚀 Starting dev server on http://localhost:3000"
  npm run dev
fi
