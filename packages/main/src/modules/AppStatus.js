class AppStatus {
    static instance;
    ollamaModelLoaded = false;
    lastModelLoadError = null;
    openWindows = 0;
    constructor() { }
    static getInstance() {
        if (!AppStatus.instance) {
            AppStatus.instance = new AppStatus();
        }
        return AppStatus.instance;
    }
    getHealth() {
        return {
            modelLoaded: this.ollamaModelLoaded,
            lastError: this.lastModelLoadError,
            openWindows: this.openWindows,
        };
    }
}
export const appStatus = AppStatus.getInstance();
