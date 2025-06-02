import {sha256sum} from './nodeCrypto.js';
import {versions} from './versions.js';
import {ipcRenderer} from 'electron';

function sendMessage(message: string) {
  return ipcRenderer.invoke('app:sendMessage', message);
}

function sendMessageStream(message: string) {
  return ipcRenderer.invoke('app:sendMessageStream', message);
}

async function healthCheck() {
  return ipcRenderer.invoke('app:healthCheck');
}

// Expose streaming event handlers
function onStreamChunk(callback: (chunk: string) => void) {
  ipcRenderer.on('app:streamChunk', (_event, chunk) => callback(chunk));
}

function onStreamEnd(callback: (fullText: string) => void) {
  ipcRenderer.on('app:streamEnd', (_event, fullText) => callback(fullText));
}

function onStreamError(callback: (error: string) => void) {
  ipcRenderer.on('app:streamError', (_event, error) => callback(error));
}

// Expose the API to the renderer process
window.electronAPI = {
  sendMessage,
  sendMessageStream,
  healthCheck,
  onStreamChunk,
  onStreamEnd,
  onStreamError
};

export {sha256sum, versions, sendMessage, sendMessageStream, healthCheck};
