import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
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
  sendMessageStream: (message: string) => ipcRenderer.invoke('send-message-stream', message),
  
  // Ollama API
  ollama: {
    listModels: () => ipcRenderer.invoke('ollama:listModels'),
    setModel: (modelName: string) => ipcRenderer.invoke('ollama:setModel', modelName),
  },
});
