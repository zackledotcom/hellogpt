#!/bin/bash
set -euo pipefail

trap 'echo "[CLEANUP] Killing background jobs..."; jobs -p | xargs -r kill' EXIT

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

log "[BUILD] Installing and building main package..."
cd packages/main
npm install || { log "[ERROR] npm install failed in main"; exit 1; }
npm run build || { log "[ERROR] Build failed in main"; exit 1; }

log "[BUILD] Installing and building preload package..."
cd ../preload
npm install || { log "[ERROR] npm install failed in preload"; exit 1; }
npm run build || { log "[ERROR] Build failed in preload"; exit 1; }

log "[BUILD] Installing and building renderer package..."
cd ../renderer
npm install || { log "[ERROR] npm install failed in renderer"; exit 1; }
npm run build || { log "[ERROR] Build failed in renderer"; exit 1; }

log "[START] Starting Vite dev server for renderer..."
npx vite &

VITE_PID=$!

log "[START] Starting Electron app..."
cd ../main
MODE=development VITE_DEV_SERVER_URL=http://localhost:3000 npx electron ./start-electron.js || { log "[ERROR] Electron failed to start"; kill $VITE_PID; exit 1; }

log "[CLEANUP] Killing Vite dev server..."
kill $VITE_PID
