import * as exports from './index.js';
import {contextBridge} from 'electron';

console.log('Preload script loaded, exposing keys:', Object.keys(exports));

const isExport = (key: string): key is keyof typeof exports => Object.hasOwn(exports, key);

for (const exportsKey in exports) {
  if (isExport(exportsKey)) {
    console.log(`Exposing key to main world: ${exportsKey} (base64: ${btoa(exportsKey)})`);
    contextBridge.exposeInMainWorld(btoa(exportsKey), exports[exportsKey]);
  }
}

// Re-export for tests
export * from './index.js';
