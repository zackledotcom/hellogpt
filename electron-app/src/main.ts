import { app, BrowserWindow, ipcMain } from 'electron';
import { setupIpcHandlers } from './ipc/handlers';
import { logger } from './utils/logger';
import * as path from 'path';
import { EmbeddingService } from './services/EmbeddingService';
import { OllamaService } from './services/OllamaService';
import { IPC_CHANNELS } from './ipc/channels';

class MainWindow {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.setupAppEvents();
  }

  private setupAppEvents(): void {
    app.on('ready', () => this.createWindow());
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
    app.on('activate', () => {
      if (!this.mainWindow) {
        this.createWindow();
      }
    });
  }

  private createWindow(): void {
    const preloadPath = process.env.NODE_ENV === 'development'
      ? path.join(__dirname, 'preload.js')
      : path.join(__dirname, '../dist/preload.js');

    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        preload: preloadPath
      }
    });

    if (!this.mainWindow) {
      throw new Error('Failed to create main window');
    }

    // In development, load from Vite dev server
    if (process.env.NODE_ENV === 'development') {
      const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
      this.mainWindow.loadURL(VITE_DEV_SERVER_URL).catch(err => {
        console.error('Failed to load development URL:', err);
        // Fallback to production build if dev server is not available
        this.mainWindow?.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
      });
      this.mainWindow.webContents.openDevTools();
    } else {
      // In production, load the built index.html
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
    }

    // Handle window errors
    this.mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
      console.error('Window failed to load:', errorCode, errorDescription);
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  public getWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  public sendToWindow(channel: string, ...args: any[]): void {
    this.mainWindow?.webContents.send(channel, ...args);
  }
}

// Initialize main window
const mainWindow = new MainWindow();

async function setupEmbeddingHandlers(): Promise<void> {
  const ollamaService = new OllamaService();
  const embeddingService = new EmbeddingService(ollamaService);

  ipcMain.handle(IPC_CHANNELS.EMBEDDING.GET_CONFIG, async () => {
    return embeddingService.getConfig();
  });

  ipcMain.handle(IPC_CHANNELS.EMBEDDING.UPDATE_CONFIG, async (_, config) => {
    return embeddingService.updateConfig(config);
  });
}

// Setup IPC handlers
setupIpcHandlers().catch(error => {
  logger.error('Failed to setup IPC handlers:', error);
  app.quit();
});

async function initialize(): Promise<void> {
  try {
    await setupEmbeddingHandlers();
  } catch (error) {
    console.error('Failed to initialize application:', error);
    app.quit();
  }
}

app.whenReady().then(initialize); 