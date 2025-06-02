#!/bin/bash
set -euo pipefail

trap 'echo "[CLEANUP] Killing background jobs..."; jobs -p | xargs -r kill' EXIT

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

log "[BUILD] Installing packages from root..."
cd "$(dirname "$0")"
npm install || { log "[ERROR] npm install failed"; exit 1; }

log "[BUILD] Building main package..."
cd packages/main
npm run build || { log "[ERROR] Build failed in main"; exit 1; }

log "[BUILD] Building preload package..."
cd ../preload
npm run build || { log "[ERROR] Build failed in preload"; exit 1; }

log "[START] Starting Vite dev server for renderer..."
cd ../renderer
npx vite --port 5173 &

VITE_PID=$!

log "[START] Starting Electron app..."
cd ../main
NODE_ENV=development MODE=development VITE_DEV_SERVER_URL=http://localhost:5173 npx electron ./start-electron.js || { log "[ERROR] Electron failed to start"; kill $VITE_PID; exit 1; }

log "[CLEANUP] Killing Vite dev server..."
kill $VITE_PID
