import electronUpdater from 'electron-updater';
export class AutoUpdater {
    #logger;
    #notification;
    constructor({ logger = null, downloadNotification = undefined, } = {}) {
        this.#logger = logger;
        this.#notification = downloadNotification;
    }
    async enable() {
        await this.runAutoUpdater();
    }
    getAutoUpdater() {
        // Using destructuring to access autoUpdater due to the CommonJS module of 'electron-updater'.
        // It is a workaround for ESM compatibility issues, see https://github.com/electron-userland/electron-builder/issues/7976.
        const { autoUpdater } = electronUpdater;
        return autoUpdater;
    }
    async runAutoUpdater() {
        const updater = this.getAutoUpdater();
        try {
            updater.logger = this.#logger || null;
            updater.fullChangelog = true;
            if (process.env.VITE_DISTRIBUTION_CHANNEL) {
                updater.channel = process.env.VITE_DISTRIBUTION_CHANNEL;
            }
            return await updater.checkForUpdatesAndNotify(this.#notification);
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('No published versions')) {
                    return null;
                }
            }
            throw error;
        }
    }
}
export function autoUpdater(...args) {
    return new AutoUpdater(...args);
}
