export class HardwareAccelerationModule {
    #shouldBeDisabled;
    constructor({ enable }) {
        this.#shouldBeDisabled = !enable;
    }
    enable({ app }) {
        if (this.#shouldBeDisabled) {
            app.disableHardwareAcceleration();
        }
    }
}
export function hardwareAccelerationMode(...args) {
    return new HardwareAccelerationModule(...args);
}
