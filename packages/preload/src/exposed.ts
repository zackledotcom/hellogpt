import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message: string) => ipcRenderer.invoke('send-message', message),
  healthCheck: () => ipcRenderer.invoke('health-check'),
  onStreamChunk: (callback: (chunk: string) => void) => {
    ipcRenderer.on('stream-chunk', (_event, chunk) => callback(chunk));
  },
  onStreamEnd: (callback: (fullText: string) => void) => {
    ipcRenderer.on('stream-end', (_event, fullText) => callback(fullText));
  },
  onStreamError: (callback: (error: string) => void) => {
    ipcRenderer.on('stream-error', (_event, error) => callback(error));
  },
  sendMessageStream: (message: string) => ipcRenderer.invoke('send-message-stream', message)
});
