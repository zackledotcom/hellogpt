#!/bin/bash
# Script to remove unnecessary files from the project
# WARNING: This script attempts to be careful and only remove files identified as duplicates or unused.
# Review the list of files before running.

echo "Starting cleanup of unnecessary files..."

# List of files identified as duplicates or unnecessary
files_to_remove=(
  "packages/main/src/ModuleRunner.js"
  "packages/main/src/ModuleContext.js"
  "packages/main/src/AppInitConfig.js"
  "packages/main/src/index.js"
  "packages/main/src/__tests__/OllamaClient.test.js"
  "packages/main/src/__tests__/WindowManager.test.js"
  "packages/main/src/__tests__/ipcHandlers.test.js"
  "packages/main/src/ipcHandlers.js"
  "packages/main/src/AppModule.js"
  "packages/main/src/modules/OllamaClient.js"
  "packages/main/src/modules/WindowManager.js"
  "packages/main/src/modules/BlockNotAllowdOrigins.js"
  "packages/main/src/modules/ChromeDevToolsExtension.js"
  "packages/main/src/modules/HardwareAccelerationModule.js"
  "packages/main/src/modules/SingleInstanceApp.js"
  "packages/main/src/modules/AutoUpdater.js"
  "packages/main/src/modules/ExternalUrls.js"
  "packages/main/src/modules/AbstractSecurityModule.js"
  "packages/main/src/modules/AppStatus.js"
  "packages/main/src/modules/ApplicationTerminatorOnLastWindowClose.js"
)

echo "The following files will be removed:"
for file in "\${files_to_remove[@]}"; do
  echo "  \$file"
done

read -p "Do you want to proceed with deletion? (yes/no): " confirm
if [ "\$confirm" != "yes" ]; then
  echo "Aborting cleanup."
  exit 1
fi

for file in "\${files_to_remove[@]}"; do
  if [ -f "\$file" ]; then
    rm -f "\$file"
    echo "Removed \$file"
  else
    echo "File not found: \$file"
  fi
done

echo "Cleanup completed."
