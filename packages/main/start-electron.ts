import path from 'path';
import { fileURLToPath } from 'url';
import { app, ipcMain } from 'electron';
import { createWindowManagerModule } from './src/modules/WindowManager.js';
import { ipcHandlers } from './src/ipcHandlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Register IPC handlers
  ipcHandlers.forEach(({ channel, handler }) => {
    ipcMain.handle(channel, handler);
    console.log(`IPC handler registered for channel: ${channel}`);
  });

  // Initialize and enable the window manager module
  const windowManager = createWindowManagerModule({
    initConfig: {
      preload: { path: path.join(__dirname, './dist/exposed.mjs') },
      renderer: { path: path.join(__dirname, './dist/index.html') },
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
