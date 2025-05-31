import { BrowserWindow } from 'electron';
class WindowManager {
    #preload;
    #renderer;
    #openDevTools;
    constructor({ initConfig, openDevTools = false }) {
        this.#preload = initConfig.preload;
        if (initConfig.renderer instanceof URL) {
            this.#renderer = { type: 'url', value: initConfig.renderer.toString() };
        }
        else {
            this.#renderer = { type: 'file', value: initConfig.renderer.path };
        }
        this.#openDevTools = openDevTools;
    }
    async enable({ app }) {
        await app.whenReady();
        await this.restoreOrCreateWindow(true);
        app.on('second-instance', () => this.restoreOrCreateWindow(true));
        app.on('activate', () => this.restoreOrCreateWindow(true));
    }
    async createWindow() {
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
        if (this.#renderer.type === 'url') {
            console.log('Loading renderer URL:', this.#renderer.value);
            await browserWindow.loadURL(this.#renderer.value);
        }
        else {
            console.log('Loading renderer file:', this.#renderer.value);
            await browserWindow.loadFile(this.#renderer.value);
        }
        return browserWindow;
    }
    async restoreOrCreateWindow(show = false) {
        let window = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
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
    }
}
export function createWindowManagerModule(...args) {
    return new WindowManager(...args);
}
