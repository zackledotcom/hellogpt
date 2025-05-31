declare module 'electron-devtools-installer' {
  const REDUX_DEVTOOLS: string;
  const VUEJS_DEVTOOLS: string;
  const VUEJS3_DEVTOOLS: string;
  const EMBER_INSPECTOR: string;
  const BACKBONE_DEBUGGER: string;
  const REACT_DEVELOPER_TOOLS: string;
  const APOLLO_DEVELOPER_TOOLS: string;
  const JQUERY_DEBUGGER: string;
  const ANGULARJS_BATARANG: string;
  const MOBX_DEVTOOLS: string;
  const CYCLEJS_DEVTOOL: string;

  function installExtension(extension: string): Promise<void>;

  export {
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
    installExtension as default,
  };
}
