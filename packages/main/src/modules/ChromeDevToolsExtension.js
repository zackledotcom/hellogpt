import installExtension, { REDUX_DEVTOOLS, VUEJS_DEVTOOLS, VUEJS3_DEVTOOLS, EMBER_INSPECTOR, BACKBONE_DEBUGGER, REACT_DEVELOPER_TOOLS, APOLLO_DEVELOPER_TOOLS, JQUERY_DEBUGGER, ANGULARJS_BATARANG, MOBX_DEVTOOLS, CYCLEJS_DEVTOOL, } from 'electron-devtools-installer';
const extensionsDictionary = {
    REDUX_DEVTOOLS,
    VUEJS_DEVTOOLS,
    VUEJS3_DEVTOOLS,
    EMBER_INSPECTOR,
    BACKBONE_DEBUGGER,
    REACT_DEVELOPER_TOOLS,
    APOLLO_DEVELOPER_TOOLS,
    JQUERY_DEBUGGER,
    ANGULARJS_BATARANG,
    MOBX_DEVTOOLS,
    CYCLEJS_DEVTOOL,
};
export class ChromeDevToolsExtension {
    #extension;
    constructor({ extension }) {
        this.#extension = extension;
    }
    async enable({ app }) {
        await app.whenReady();
        await installExtension(extensionsDictionary[this.#extension]);
    }
}
export function chromeDevToolsExtension(...args) {
    return new ChromeDevToolsExtension(...args);
}
