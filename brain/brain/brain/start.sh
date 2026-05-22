#!/usr/bin/env bash
# VedicBrain.AI — Startup script
# Zero API cost. No Ollama daemon. Loads qwen3-coder directly via llama-cpp-python.
# Usage: cd compliance-firewall-agent && bash brain/start.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║          VedicBrain.AI — Local Dev Assistant             ║"
echo "║  Zero API cost · No token limits · Your own AI           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── 1. Verify model file ──────────────────────────────────────────────────────
MODEL_PATH="${HOME}/.ollama/models/blobs/sha256-1194192cf2a187eb02722edcc3f77b11d21f537048ce04b67ccf8ba78863006a"
if [[ ! -f "${MODEL_PATH}" ]]; then
  echo "✗  Model not found at: ${MODEL_PATH}"
  echo "   Run: ollama pull qwen2.5-coder:latest   (downloads once, then Ollama can be stopped)"
  echo "   Or set LLAMA_MODEL_PATH in brain/.env to your GGUF file path."
  exit 1
fi
echo "✓  Model found: $(du -sh "${MODEL_PATH}" | cut -f1) at ${MODEL_PATH}"

# ── 2. Install llama-cpp-python with Metal GPU support (Apple Silicon) ────────
if ! python3 -c "import llama_cpp" &>/dev/null; then
  echo ""
  echo "→  Installing llama-cpp-python with Metal GPU support..."
  echo "   (This compiles llama.cpp with GGML_METAL=on — takes ~2 minutes once)"
  CMAKE_ARGS="-DGGML_METAL=on" \
  FORCE_CMAKE=1 \
  pip install "llama-cpp-python>=0.3.0" --no-cache-dir
  echo "✓  llama-cpp-python installed"
else
  echo "✓  llama-cpp-python already installed"
fi

# ── 3. Install vedic_brain package (editable) ─────────────────────────────────
echo ""
echo "→  Installing vedic_brain package..."
pip install -e "${ROOT_DIR}" --quiet
echo "✓  vedic_brain installed"

# ── 4. Install remaining Python deps ─────────────────────────────────────────
if [[ -f "${ROOT_DIR}/requirements.txt" ]]; then
  echo "→  Installing requirements..."
  pip install -r "${ROOT_DIR}/requirements.txt" --quiet
  echo "✓  Requirements installed"
fi

# ── 5. Start the server ───────────────────────────────────────────────────────
echo ""
echo "→  Starting VedicBrain.AI server on http://localhost:8080"
echo "   OpenAI-compatible: http://localhost:8080/v1/chat/completions"
echo "   Health check:      http://localhost:8080/health"
echo "   API docs:          http://localhost:8080/docs"
echo ""
echo "   Press Ctrl+C to stop."
echo ""

cd "${ROOT_DIR}"
python3 -m uvicorn vedic_brain.api.server:app \
  --host 0.0.0.0 \
  --port 8080 \
  --reload \
  --log-level info
