import { shell } from 'electron';
import { URL } from 'node:url';
export class ExternalUrls {
    #externalUrls;
    constructor(externalUrls) {
        this.#externalUrls = externalUrls;
    }
    enable({ app }) {
        app.on('web-contents-created', (_, contents) => {
            contents.setWindowOpenHandler(({ url }) => {
                const { origin } = new URL(url);
                if (this.#externalUrls.has(origin)) {
                    shell.openExternal(url).catch(console.error);
                }
                else if (process.env.DEV) {
                    console.warn(`Blocked the opening of a disallowed external origin: ${origin}`);
                }
                // Prevent creating a new window.
                return { action: 'deny' };
            });
        });
    }
}
export function allowExternalUrls(...args) {
    return new ExternalUrls(...args);
}
