import { app, ipcMain } from 'electron';
import { createWindowManagerModule } from './modules/WindowManager.js';
import { ipcHandlers } from './ipcHandlers.js';

export async function initApp(initConfig: { preload: { path: string }; renderer: { path: string } | URL }) {
  console.log('Main process starting with initConfig:', initConfig);

  // Register IPC handlers
  ipcHandlers.forEach(({ channel, handler }) => {
    ipcMain.handle(channel, handler);
    console.log(`Registered IPC handler for channel: ${channel}`);
  });

  // Initialize and enable the window manager module with proper config
  const windowManager = createWindowManagerModule({
    initConfig,
    openDevTools: process.env.NODE_ENV === 'development',
  });

  await windowManager.enable({ app });
}