#!/usr/bin/env bash
# Idempotent: creates the OmniVoice venv (CPU torch). Prints the venv python path on the last line.
set -euo pipefail
VENV="${OMNI_VENV:-$HOME/.cache/tiktok-omni/venv}"
if ! "$VENV/bin/python" -c "import omnivoice, torch" 2>/dev/null; then
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q --upgrade pip
  "$VENV/bin/pip" install -q torch==2.8.0 torchaudio==2.8.0 --index-url https://download.pytorch.org/whl/cpu
  "$VENV/bin/pip" install -q omnivoice==0.2.1
fi
echo "$VENV/bin/python"
