import type {AppModule} from '../AppModule.js';
import type {ModuleContext} from '../ModuleContext.js';
// @ts-ignore
const {default: install, REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS} = require('electron-devtools-installer');

const extensions = [
  { id: REDUX_DEVTOOLS, name: 'Redux DevTools' },
  { id: REACT_DEVELOPER_TOOLS, name: 'React Developer Tools' },
] as const;

export class ChromeDevToolsExtension implements AppModule {
  async enable({app}: ModuleContext): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      try {
        for (const { id, name } of extensions) {
          await install(id);
          console.log(`Installed ${name}`);
        }
      } catch (e) {
        console.error('Failed to install dev tools:', e);
      }
    }
  }
}
