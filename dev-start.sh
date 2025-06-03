#!/bin/bash

# Only run npm install if node_modules doesn't exist or if --install flag is passed
if [ ! -d "node_modules" ] || [ "$1" == "--install" ]; then
    echo "[$(date)] [BUILD] Installing packages from root..."
    npm install --legacy-peer-deps || { echo "[$(date)] [ERROR] npm install failed"; exit 1; }
fi

echo "[$(date)] [BUILD] Building preload package..."
npm run build:preload || { echo "[$(date)] [ERROR] Preload build failed"; exit 1; }

echo "[$(date)] [BUILD] Building main package..."
npm run build:main || { echo "[$(date)] [ERROR] Main build failed"; exit 1; }

echo "[$(date)] [START] Starting Vite dev server and Electron..."
npm run start || { echo "[$(date)] [ERROR] Start failed"; exit 1; }
