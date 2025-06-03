const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI',
  {
    ollama: {
      listModels: () => ipcRenderer.invoke('ollama:listModels'),
      generate: (prompt: string, model: string) => ipcRenderer.invoke('ollama:generate', prompt, model),
      stream: (prompt: string, model: string) => {
        const channel = 'ollama-stream';
        ipcRenderer.send('ollama:stream', prompt, model);
        return {
          onChunk: (callback: (chunk: string) => void) => {
            ipcRenderer.on(channel, (_event: Electron.IpcRendererEvent, chunk: string) => callback(chunk));
          },
          stop: () => {
            ipcRenderer.removeAllListeners(channel);
            ipcRenderer.send('ollama:stop');
          }
        };
      }
    }
  }
);

contextBridge.exposeInMainWorld(
  'memoryAPI',
  {
    initialize: () => ipcRenderer.invoke('memory:initialize'),
    store: (text: string) => ipcRenderer.invoke('memory:store', text),
    search: (query: string) => ipcRenderer.invoke('memory:search', query),
    recent: () => ipcRenderer.invoke('memory:recent')
  }
); 