#!/usr/bin/env bash
# Hound Shield Proxy — one-command install
# Usage: curl -sSL https://houndshield.com/install | bash
#   -y / --yes        Non-interactive: uses env vars, skips all prompts
#   --version         Print image tag and exit
#   --port=<n>        Override default port (8080)
#   --uninstall       Stop and remove the proxy container
#   --verify          Verify the running proxy is healthy
set -euo pipefail

PROXY_PORT="${PROXY_PORT:-8080}"
IMAGE="ghcr.io/thecelestialmismatch/houndshield-proxy:latest"
IMAGE_VERSION="latest"
NON_INTERACTIVE=false

# ── Flags ────────────────────────────────────────────────────────────────────

for arg in "$@"; do
  case "$arg" in
    -y|--yes)         NON_INTERACTIVE=true ;;
    --version)        echo "houndshield-proxy:${IMAGE_VERSION}"; exit 0 ;;
    --port=*)         PROXY_PORT="${arg#--port=}" ;;
    --uninstall)
      echo "  Removing Hound Shield proxy..."
      if docker ps -q --filter "name=houndshield-proxy" | grep -q .; then
        docker stop houndshield-proxy >/dev/null && echo "  ✓ Container stopped."
      fi
      if docker ps -aq --filter "name=houndshield-proxy" | grep -q .; then
        docker rm houndshield-proxy >/dev/null && echo "  ✓ Container removed."
      fi
      if docker volume ls -q --filter "name=houndshield-data" | grep -q .; then
        read -rp "  Remove audit log volume (WARNING: deletes all local logs)? (y/N) " confirm
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
          docker volume rm houndshield-data >/dev/null && echo "  ✓ Audit data volume removed."
        else
          echo "  Audit data volume retained (houndshield-data). Your logs are safe."
        fi
      fi
      echo ""
      echo "  Hound Shield proxy uninstalled successfully."
      exit 0
      ;;
    --verify)
      echo "  Verifying Hound Shield proxy on port ${PROXY_PORT}..."
      if ! docker ps -q --filter "name=houndshield-proxy" | grep -q .; then
        echo "  ERROR: houndshield-proxy container is not running."
        echo "  Start it: docker start houndshield-proxy"
        exit 1
      fi
      STATUS=$(curl -sf --max-time 5 "http://localhost:${PROXY_PORT}/health" 2>/dev/null || echo "failed")
      if [[ "$STATUS" == *"ok"* ]]; then
        echo "  ✓ Proxy healthy on port ${PROXY_PORT}"
        echo ""
        echo "  Test a CUI block (should get error response):"
        echo "    curl -X POST http://localhost:${PROXY_PORT}/v1/chat/completions \\"
        echo "      -H 'Content-Type: application/json' \\"
        echo "      -d '{\"messages\":[{\"role\":\"user\",\"content\":\"CAGE 1ABC2 W911NF-23-C-0001\"}]}'"
      else
        echo "  ERROR: Proxy not responding on port ${PROXY_PORT}."
        echo "  Check logs: docker logs houndshield-proxy"
        exit 1
      fi
      exit 0
      ;;
  esac
done

echo ""
echo "  Hound Shield Compliance Proxy — Installer"
echo "  ==========================================="
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

if [ -z "${HOUNDSHIELD_LICENSE_KEY:-}" ]; then
  if [ "$NON_INTERACTIVE" = true ]; then
    echo "  ERROR: HOUNDSHIELD_LICENSE_KEY env var required in non-interactive mode."
    echo "  Run: HOUNDSHIELD_LICENSE_KEY=<key> bash install.sh -y"
    exit 1
  fi
  echo "  Step 1: Enter your Hound Shield license key."
  echo "  (Get one at https://houndshield.com/dashboard)"
  echo ""
  read -rp "  License key: " HOUNDSHIELD_LICENSE_KEY
fi

if [ -z "${UPSTREAM_API_KEY:-}" ]; then
  if [ "$NON_INTERACTIVE" = true ]; then
    echo "  ERROR: UPSTREAM_API_KEY env var required in non-interactive mode."
    echo "  Supported env vars:"
    echo "    OPENAI_API_KEY       — OpenAI / ChatGPT"
    echo "    ANTHROPIC_API_KEY    — Anthropic / Claude"
    echo "    GOOGLE_API_KEY       — Google / Gemini"
    echo "    OPENROUTER_API_KEY   — OpenRouter (800+ models)"
    echo "  Set UPSTREAM_API_KEY=<key> UPSTREAM_PROVIDER=<openai|anthropic|google|openrouter>"
    exit 1
  fi
  echo ""
  echo "  Step 2: Enter your AI provider API key."
  echo "  (Your existing key — OpenAI, Anthropic, Google, or OpenRouter)"
  echo "  (Hound Shield never stores it — passed directly to your provider)"
  echo ""
  echo "  Provider hints:"
  echo "    OPENAI_API_KEY     → set UPSTREAM_PROVIDER=openai"
  echo "    ANTHROPIC_API_KEY  → set UPSTREAM_PROVIDER=anthropic"
  echo "    GOOGLE_API_KEY     → set UPSTREAM_PROVIDER=google"
  echo "    OPENROUTER_API_KEY → set UPSTREAM_PROVIDER=openrouter (800+ models)"
  echo ""
  read -rp "  Provider API key: " UPSTREAM_API_KEY
fi

# Auto-detect provider from env var names if not set
if [ -z "${UPSTREAM_PROVIDER:-}" ]; then
  if [ -n "${ANTHROPIC_API_KEY:-}" ] && [ -z "${UPSTREAM_API_KEY:-}" ]; then
    UPSTREAM_API_KEY="$ANTHROPIC_API_KEY"
    UPSTREAM_PROVIDER="anthropic"
  elif [ -n "${GOOGLE_API_KEY:-}" ] && [ -z "${UPSTREAM_API_KEY:-}" ]; then
    UPSTREAM_API_KEY="$GOOGLE_API_KEY"
    UPSTREAM_PROVIDER="google"
  elif [ -n "${OPENROUTER_API_KEY:-}" ] && [ -z "${UPSTREAM_API_KEY:-}" ]; then
    UPSTREAM_API_KEY="$OPENROUTER_API_KEY"
    UPSTREAM_PROVIDER="openrouter"
  else
    UPSTREAM_PROVIDER="openai"
  fi
fi

# ── Pull image ───────────────────────────────────────────────────────────────

echo ""
echo "  Pulling Hound Shield proxy image..."
docker pull "$IMAGE"

# ── Stop existing container if running ──────────────────────────────────────

if docker ps -q --filter "name=houndshield-proxy" | grep -q .; then
  echo "  Stopping existing houndshield-proxy container..."
  docker stop houndshield-proxy >/dev/null
  docker rm houndshield-proxy >/dev/null
fi

# ── Start container ──────────────────────────────────────────────────────────

echo "  Starting Hound Shield proxy on port ${PROXY_PORT}..."
docker run -d \
  --name houndshield-proxy \
  --restart unless-stopped \
  -p "${PROXY_PORT}:8080" \
  -e HOUNDSHIELD_LICENSE_KEY="$HOUNDSHIELD_LICENSE_KEY" \
  -e UPSTREAM_API_KEY="$UPSTREAM_API_KEY" \
  -e UPSTREAM_PROVIDER="$UPSTREAM_PROVIDER" \
  -v houndshield-data:/data \
  "$IMAGE"

# ── Health check (30s timeout) ───────────────────────────────────────────────

echo "  Waiting for proxy to start..."
HEALTH_TIMEOUT=15
for i in $(seq 1 $HEALTH_TIMEOUT); do
  if curl -sf --max-time 2 "http://localhost:${PROXY_PORT}/health" >/dev/null 2>&1; then
    break
  fi
  if [ "$i" -eq "$HEALTH_TIMEOUT" ]; then
    echo ""
    echo "  ERROR: Health check timed out after 30s."
    echo "  Check container logs: docker logs houndshield-proxy"
    echo "  Check port conflicts: lsof -i :${PROXY_PORT}"
    exit 1
  fi
  sleep 2
done

STATUS=$(curl -sf --max-time 5 "http://localhost:${PROXY_PORT}/health" 2>/dev/null || echo "failed")
if [[ "$STATUS" == *"ok"* ]]; then
  echo ""
  echo "  ✓ Hound Shield proxy running on port ${PROXY_PORT}"
  echo ""
  echo "  ── One change in your AI client ────────────────────────────────"
  echo "  Set: baseURL = \"http://localhost:${PROXY_PORT}/v1\""
  echo ""
  echo "  OpenAI SDK:"
  echo "    const openai = new OpenAI({"
  echo "      apiKey: process.env.OPENAI_API_KEY,"
  echo "      baseURL: 'http://localhost:${PROXY_PORT}/v1'"
  echo "    })"
  echo ""
  echo "  Python / LangChain:"
  echo "    client = OpenAI(base_url='http://localhost:${PROXY_PORT}/v1', api_key=os.environ['OPENAI_API_KEY'])"
  echo ""
  echo "  Test a CUI block:"
  echo "    curl -X POST http://localhost:${PROXY_PORT}/v1/chat/completions \\"
  echo "      -H 'Content-Type: application/json' \\"
  echo "      -d '{\"messages\":[{\"role\":\"user\",\"content\":\"CAGE 1ABC2 project\"}]}'"
  echo "  ──────────────────────────────────────────────────────────────────"
  echo ""
  echo "  Dashboard: https://houndshield.com/dashboard"
  echo "  Docs:      https://houndshield.com/docs"
  echo ""
else
  echo "  ERROR: Health check failed. Container may have crashed."
  echo "  Logs: docker logs houndshield-proxy"
  exit 1
fi
