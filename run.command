#!/usr/bin/env bash
# Make Something — Resume Script
# Resume script — double-click this file to restart your project

set -e

# cd to script directory (works even if called from elsewhere)
cd "$(dirname "$0")"

# Check for node
if ! command -v node &>/dev/null; then
  echo ""
  echo "  Node.js not found."
  echo "  Try closing this terminal and opening a new one, then double-clicking run.command again."
  exit 1
fi

echo ""
echo "  ╔══════════════════════════════════╗"
echo "  ║        Make Something            ║"
echo "  ╚══════════════════════════════════╝"
echo ""

# --- 1. Check dependencies ---
if [[ ! -d "node_modules" ]]; then
  echo "→ Installing dependencies..."
  npm install
else
  echo "✓ Dependencies ready"
fi

# --- 2. Kill any existing process on port 3000 ---
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true

# --- 3. Start dev server in background ---
echo "→ Starting dev server..."
npm run dev > /dev/null &
DEV_PID=$!
trap 'echo ""; echo "  Stopping dev server..."; kill $DEV_PID 2>/dev/null || true; lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true' EXIT

# --- 4. Wait for server to be ready ---
echo "→ Waiting for your app to start..."
TRIES=0
MAX_TRIES=30
while ! curl -s -o /dev/null http://localhost:3000 2>/dev/null; do
  sleep 1
  TRIES=$((TRIES + 1))
  if [[ $TRIES -ge $MAX_TRIES ]]; then
    echo "⚠ Dev server took too long to start."
    break
  fi
done

# --- 5. Open browser ---
if grep -qi microsoft /proc/version 2>/dev/null; then
  cmd.exe /c start http://localhost:3000 2>/dev/null || true
elif command -v open &>/dev/null; then
  open http://localhost:3000
elif command -v xdg-open &>/dev/null; then
  xdg-open http://localhost:3000
fi

echo ""
echo "  ✓ Ready! Launching Codex..."
echo ""

# --- 6. Launch Codex (full-auto so beginners never see approval prompts) ---
codex --full-auto

