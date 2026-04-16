#!/usr/bin/env bash
# Kaelus Proxy — one-command install
# Usage: curl -sSL https://kaelus.online/install | bash
set -euo pipefail

PROXY_PORT="${PROXY_PORT:-8080}"
IMAGE="kaelus/proxy:latest"

echo ""
echo "  Kaelus Compliance Proxy — Installer"
echo "  ======================================"
echo ""

# ── Dependency checks ────────────────────────────────────────────────────────

if ! command -v docker &>/dev/null; then
  echo "  ERROR: Docker not found."
  echo "  Install Docker Desktop: https://docs.docker.com/get-docker/"
  exit 1
fi

if ! docker info &>/dev/null 2>&1; then
  echo "  ERROR: Docker daemon not running."
  echo "  Start Docker Desktop and re-run this script."
  exit 1
fi

# ── Collect credentials ──────────────────────────────────────────────────────

if [ -z "${KAELUS_LICENSE_KEY:-}" ]; then
  echo "  Step 1: Enter your Kaelus license key."
  echo "  (Get one at https://kaelus.online/dashboard)"
  echo ""
  read -rp "  License key: " KAELUS_LICENSE_KEY
fi

if [ -z "${UPSTREAM_API_KEY:-}" ]; then
  echo ""
  echo "  Step 2: Enter your AI provider API key."
  echo "  (This is your existing OpenAI/Anthropic/etc. key — Kaelus never stores it)"
  echo ""
  read -rp "  Provider API key: " UPSTREAM_API_KEY
fi

UPSTREAM_PROVIDER="${UPSTREAM_PROVIDER:-openai}"

# ── Pull image ───────────────────────────────────────────────────────────────

echo ""
echo "  Pulling Kaelus proxy image..."
docker pull "$IMAGE"

# ── Stop existing container if running ──────────────────────────────────────

if docker ps -q --filter "name=kaelus-proxy" | grep -q .; then
  echo "  Stopping existing kaelus-proxy container..."
  docker stop kaelus-proxy >/dev/null
  docker rm kaelus-proxy >/dev/null
fi

# ── Start container ──────────────────────────────────────────────────────────

echo "  Starting Kaelus proxy on port ${PROXY_PORT}..."
docker run -d \
  --name kaelus-proxy \
  --restart unless-stopped \
  -p "${PROXY_PORT}:8080" \
  -e KAELUS_LICENSE_KEY="$KAELUS_LICENSE_KEY" \
  -e UPSTREAM_API_KEY="$UPSTREAM_API_KEY" \
  -e UPSTREAM_PROVIDER="$UPSTREAM_PROVIDER" \
  -v kaelus-data:/data \
  "$IMAGE"

# ── Health check ─────────────────────────────────────────────────────────────

echo "  Waiting for proxy to start..."
for i in {1..12}; do
  if curl -sf "http://localhost:${PROXY_PORT}/health" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

STATUS=$(curl -sf "http://localhost:${PROXY_PORT}/health" 2>/dev/null || echo "failed")
if [[ "$STATUS" == *"ok"* ]]; then
  echo ""
  echo "  Kaelus proxy is running!"
  echo ""
  echo "  ── One change in your AI client ────────────────────────────────"
  echo "  Set: baseURL = \"http://localhost:${PROXY_PORT}/v1\""
  echo ""
  echo "  OpenAI SDK example:"
  echo "    const openai = new OpenAI({"
  echo "      apiKey: '<your-key>',"
  echo "      baseURL: 'http://localhost:${PROXY_PORT}/v1'"
  echo "    })"
  echo ""
  echo "  Test a CUI block:"
  echo "    curl -X POST http://localhost:${PROXY_PORT}/v1/chat/completions \\"
  echo "      -H 'Content-Type: application/json' \\"
  echo "      -d '{\"messages\":[{\"role\":\"user\",\"content\":\"CAGE 1ABC2 project\"}]}'"
  echo "  ──────────────────────────────────────────────────────────────────"
  echo ""
  echo "  Dashboard: https://kaelus.online/dashboard"
  echo ""
else
  echo "  WARNING: Health check failed. Check logs: docker logs kaelus-proxy"
  exit 1
fi
