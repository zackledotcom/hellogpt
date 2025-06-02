import path from 'path';
import { fileURLToPath } from 'url';
import { app, ipcMain } from 'electron';
import { createWindowManagerModule } from './dist/modules/WindowManager.js';
import { ipcHandlers } from './dist/ipcHandlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Register IPC handlers
  ipcHandlers.forEach(({ channel, handler }) => {
    ipcMain.handle(channel, handler);
    console.log(`IPC handler registered for channel: ${channel}`);
  });

  // Resolve project root
  const projectRoot = path.resolve(__dirname, '../../');

  // Determine renderer path or URL based on environment
  const devURL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  const prodFile = path.join(projectRoot, 'packages', 'renderer', 'dist', 'index.html');

  console.log('Project root:', projectRoot);
  console.log('Production file path:', prodFile);

  const isDevMode = () => process.env.NODE_ENV === 'development';

  const rendererEntry = isDevMode()
    ? { type: 'url', value: devURL }
    : { type: 'file', value: prodFile };

  const preloadPath = path.resolve(projectRoot, 'packages/preload/dist/exposed.mjs');

  console.log('Using preload path:', preloadPath);
  console.log(`🔍 Loading renderer via ${rendererEntry.type}: ${rendererEntry.value}`);

  // Initialize and enable the window manager module
  const windowManager = createWindowManagerModule({
    initConfig: {
      preload: { path: preloadPath },
      renderer: rendererEntry,
    },
    openDevTools: process.env.NODE_ENV === 'development',
  });

  await windowManager.enable({ app });
}

app.whenReady().then(main);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
