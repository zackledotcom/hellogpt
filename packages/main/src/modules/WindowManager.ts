import type {AppModule} from '../AppModule.js';
import {ModuleContext} from '../ModuleContext.js';
import {BrowserWindow} from 'electron';
import type {AppInitConfig} from '../AppInitConfig.js';

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
      // Fix: Use path.join to resolve file path dynamically and validate existence
      const path = require('path');
      const fs = require('fs');
      const filePath = path.join(__dirname, '../../renderer/dist/index.html');
      if (!fs.existsSync(filePath)) {
        console.warn(`Renderer file missing: ${filePath}, falling back to localhost`);
        this.#renderer = { type: 'url', value: 'http://localhost:3000' };
      } else {
        this.#renderer = { type: 'file', value: filePath };
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
    }
  }

  async createWindow(): Promise<BrowserWindow> {
    console.log('Creating BrowserWindow with preload path:', this.#preload.path);
    const browserWindow = new BrowserWindow({
      show: false, // Use the 'ready-to-show' event to show the instantiated BrowserWindow.
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false, // Sandbox disabled because the demo of preload script depend on the Node.js api
        webviewTag: false, // The webview tag is not recommended. Consider alternatives like an iframe or Electron's BrowserView. @see https://www.electronjs.org/docs/latest/api/webview-tag#warning
        preload: this.#preload.path,
      },
    });

      try {
      if (this.#renderer.type === 'url') {
        console.log('Loading renderer URL:', this.#renderer.value);
        await browserWindow.loadURL(this.#renderer.value);
      } else {
        console.log('Loading renderer file:', this.#renderer.value);
        try {
          await browserWindow.loadFile(this.#renderer.value);
        } catch (error) {
          console.error('Failed to load file:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error loading renderer:', error);
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
