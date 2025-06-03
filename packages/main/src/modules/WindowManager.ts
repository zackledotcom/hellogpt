import type {AppModule} from '../AppModule.js';
import type {ModuleContext} from '../ModuleContext.js';
import {BrowserWindow, app} from 'electron';
import type {AppInitConfig} from '../AppInitConfig.js';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface RendererPath {
  type: 'url' | 'file';
  value: string;
}

export class WindowManager implements AppModule {
  readonly #preload: {path: string};
  readonly #renderer: RendererPath;
  #mainWindow: BrowserWindow | null = null;

  constructor(preloadPath: string) {
    this.#preload = {path: preloadPath};
    this.#renderer = this.resolveRendererPath();
  }

  private resolveRendererPath(): RendererPath {
    if (process.env.NODE_ENV === 'development') {
      const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
      console.log('Development mode, using URL:', devUrl);
      return { 
        type: 'url', 
        value: devUrl 
      };
    }
    
    // Production: Use app.getAppPath() for packaged app
    const appPath = app.getAppPath();
    const indexPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar', 'renderer', 'index.html')
      : path.join(appPath, 'packages', 'renderer', 'dist', 'index.html');
      
    console.log('Production mode, checking path:', indexPath);
    
    if (!fs.existsSync(indexPath)) {
      console.error(`Renderer not found at: ${indexPath}`);
      throw new Error(`Renderer not found at: ${indexPath}`);
    }
    
    return { type: 'file', value: indexPath };
  }

  private createErrorWindow(error: Error): BrowserWindow {
    const errorWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              padding: 2rem;
              color: #333;
              line-height: 1.6;
            }
            .error-container {
              max-width: 600px;
              margin: 0 auto;
              padding: 2rem;
              border: 1px solid #ff4444;
              border-radius: 8px;
              background-color: #fff5f5;
            }
            h1 { color: #ff4444; }
            pre {
              background: #f8f8f8;
              padding: 1rem;
              border-radius: 4px;
              overflow-x: auto;
            }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1>Application Error</h1>
            <p>The application encountered an error while starting:</p>
            <pre>${error.message}</pre>
            <p>Please check the application logs for more details.</p>
          </div>
        </body>
      </html>
    `;

    errorWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
    return errorWindow;
  }

  async enable({app}: ModuleContext): Promise<void> {
    try {
      await app.whenReady();
      await this.restoreOrCreateWindow(true);
      app.on('second-instance', () => {
        this.restoreOrCreateWindow(true).catch(err => console.error('Error on second-instance:', err));
      });
      app.on('activate', () => {
        this.restoreOrCreateWindow(true).catch(err => console.error('Error on activate:', err));
      });
    } catch (error) {
      console.error('Error in WindowManager enable:', error);
      throw error;
    }
  }

  async createWindow(): Promise<BrowserWindow> {
    console.log('Creating BrowserWindow with preload path:', this.#preload.path);
    const browserWindow = new BrowserWindow({
      show: false,
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        webviewTag: false,
        preload: this.#preload.path,
      },
    });

    // Handle window ready to show
    browserWindow.once('ready-to-show', () => {
      console.log('Window ready to show');
      browserWindow.show();
    });

    // Handle window errors
    browserWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Failed to load:', errorCode, errorDescription);
      this.createErrorWindow(new Error(`Failed to load: ${errorDescription} (${errorCode})`));
    });

    // Handle renderer process errors
    browserWindow.webContents.on('render-process-gone', (event, details) => {
      console.error('Renderer process gone:', details.reason);
      this.createErrorWindow(new Error(`Renderer process ${details.reason}. Please restart the application.`));
    });

    // Handle unresponsive renderer
    browserWindow.on('unresponsive', () => {
      console.error('Renderer process became unresponsive');
      this.createErrorWindow(new Error('Application became unresponsive. Please restart the application.'));
    });

    try {
      if (this.#renderer.type === 'url') {
        console.log('Loading renderer URL:', this.#renderer.value);
        await browserWindow.loadURL(this.#renderer.value);
      } else {
        console.log('Loading renderer file:', this.#renderer.value);
        await browserWindow.loadFile(this.#renderer.value);
      }
    } catch (error) {
      console.error('Error loading renderer:', error);
      this.createErrorWindow(error instanceof Error ? error : new Error('Unknown error loading renderer'));
      throw error;
    }

    return browserWindow;
  }

  async restoreOrCreateWindow(show: boolean): Promise<void> {
    if (this.#mainWindow) {
      if (this.#mainWindow.isDestroyed()) {
        this.#mainWindow = null;
      } else {
        if (show) {
          this.#mainWindow.show();
          this.#mainWindow.focus();
        }
        return;
      }
    }

    try {
      this.#mainWindow = await this.createWindow();
    } catch (error) {
      console.error('Error creating window:', error);
      this.createErrorWindow(error instanceof Error ? error : new Error('Failed to create window'));
      throw error;
    }
  }
}

export function createWindowManagerModule(...args: ConstructorParameters<typeof WindowManager>) {
  return new WindowManager(...args);
}
