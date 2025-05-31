import { app } from 'electron';
class ModuleRunner {
    #promise;
    constructor() {
        this.#promise = Promise.resolve();
    }
    then(onfulfilled, onrejected) {
        return this.#promise.then(onfulfilled, onrejected);
    }
    init(module) {
        const p = module.enable(this.#createModuleContext());
        if (p instanceof Promise) {
            this.#promise = this.#promise.then(() => p);
        }
        return this;
    }
    #createModuleContext() {
        return {
            app,
        };
    }
}
export function createModuleRunner() {
    return new ModuleRunner();
}
