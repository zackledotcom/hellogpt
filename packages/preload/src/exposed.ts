import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, isValidIpcChannel } from '@app/shared/ipcChannels';

// Helper to create typed event listeners with cleanup
function createTypedListener(channel: string) {
  const listeners = new Set<(data: any) => void>();
  
  const handler = (_event: Electron.IpcRendererEvent, data: any) => {
    listeners.forEach(listener => listener(data));
  };

  ipcRenderer.on(channel, handler);

  return {
    addListener: (callback: (data: any) => void) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners(channel);
      listeners.clear();
    }
  };
}

// Create typed listeners for each channel
const streamChunkListener = createTypedListener(IPC_CHANNELS.CHAT.STREAM_CHUNK);
const streamEndListener = createTypedListener(IPC_CHANNELS.CHAT.STREAM_END);
const streamErrorListener = createTypedListener(IPC_CHANNELS.CHAT.STREAM_ERROR);

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message: string) => 
    ipcRenderer.invoke(IPC_CHANNELS.CHAT.SEND_MESSAGE, message),
  
  healthCheck: () => 
    ipcRenderer.invoke(IPC_CHANNELS.APP.HEALTH_CHECK),
  
  onStreamChunk: (callback: (chunk: string) => void) => {
    return streamChunkListener.addListener(callback);
  },
  
  onStreamEnd: (callback: (fullText: string) => void) => {
    return streamEndListener.addListener(callback);
  },
  
  onStreamError: (callback: (error: string) => void) => {
    return streamErrorListener.addListener(callback);
  },
  
  sendMessageStream: (message: string) => 
    ipcRenderer.invoke(IPC_CHANNELS.CHAT.SEND_MESSAGE_STREAM, message),
  
  // Ollama API
  ollama: {
    listModels: () => 
      ipcRenderer.invoke(IPC_CHANNELS.OLLAMA.LIST_MODELS),
    setModel: (modelName: string) => 
      ipcRenderer.invoke(IPC_CHANNELS.OLLAMA.SET_MODEL, modelName),
    checkConnection: () =>
      ipcRenderer.invoke(IPC_CHANNELS.OLLAMA.CHECK_CONNECTION),
  },

  // Cleanup method
  cleanup: () => {
    streamChunkListener.removeAllListeners();
    streamEndListener.removeAllListeners();
    streamErrorListener.removeAllListeners();
  }
});
