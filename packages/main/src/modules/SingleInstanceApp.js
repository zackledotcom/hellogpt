class SingleInstanceApp {
    enable({ app }) {
        const isSingleInstance = app.requestSingleInstanceLock();
        if (!isSingleInstance) {
            app.quit();
            process.exit(0);
        }
    }
}
export function disallowMultipleAppInstance(...args) {
    return new SingleInstanceApp(...args);
}
