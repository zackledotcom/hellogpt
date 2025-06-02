import type {AppModule} from '../AppModule.js';
import type {ModuleContext} from '../ModuleContext.js';
import {BrowserWindow} from 'electron';
import type {AppInitConfig} from '../AppInitConfig.js';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class WindowManager implements AppModule {
  readonly #preload: {path: string};
  readonly #renderer: {type: 'url' | 'file'; value: string};
  readonly #openDevTools;

  constructor({initConfig, openDevTools = false}: {initConfig: AppInitConfig, openDevTools?: boolean}) {
    this.#preload = initConfig.preload;

    if (typeof initConfig.renderer === 'string') {
      this.#renderer = { type: 'url', value: initConfig.renderer };
    } else if (initConfig.renderer instanceof URL) {
      this.#renderer = { type: 'url', value: initConfig.renderer.toString() };
    } else {
      // Fix: Use absolute path for renderer in production
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) {
        this.#renderer = { type: 'url', value: 'http://localhost:5173' };
      } else {
        // Get the project root by going up from the current file's location
        const projectRoot = path.resolve(__dirname, '../../../../');
        const filePath = path.join(projectRoot, 'packages', 'renderer', 'dist', 'index.html');
        console.log('Project root:', projectRoot);
        console.log('Renderer path:', filePath);
        
        if (!fs.existsSync(filePath)) {
          console.warn(`Renderer file missing: ${filePath}, falling back to localhost`);
          this.#renderer = { type: 'url', value: 'http://localhost:5173' };
        } else {
          this.#renderer = { type: 'file', value: filePath };
        }
      }
    }

    this.#openDevTools = openDevTools;
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
      throw error;
    }

    return browserWindow;
  }

  async restoreOrCreateWindow(show = false) {
    let window = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());

    try {
      if (window === undefined) {
        window = await this.createWindow();
      }

      if (!show) {
        return window;
      }

      if (window.isMinimized()) {
        window.restore();
      }

      window?.show();

      if (this.#openDevTools) {
        window?.webContents.openDevTools();
      }

      window.focus();

      return window;
    } catch (error) {
      console.error('Error in restoreOrCreateWindow:', error);
      throw error;
    }
  }
}

export function createWindowManagerModule(...args: ConstructorParameters<typeof WindowManager>) {
  return new WindowManager(...args);
}
