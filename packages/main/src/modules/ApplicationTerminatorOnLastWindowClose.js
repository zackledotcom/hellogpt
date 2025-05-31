class ApplicationTerminatorOnLastWindowClose {
    enable({ app }) {
        app.on('window-all-closed', () => app.quit());
    }
}
export function terminateAppOnLastWindowClose(...args) {
    return new ApplicationTerminatorOnLastWindowClose(...args);
}
