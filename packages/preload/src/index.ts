import {sha256sum} from './nodeCrypto.js';
import {versions} from './versions.js';
import {ipcRenderer} from 'electron';

function send(channel: string, message: string) {
  return ipcRenderer.invoke(channel, message);
}

async function healthCheck() {
  return ipcRenderer.invoke('app:healthCheck');
}

export {sha256sum, versions, send, healthCheck};
