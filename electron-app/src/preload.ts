import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { IPC_CHANNELS } from './ipc/channels';
import type { IpcMessageMap } from './types/ipc';

// Type-safe wrapper for IPC calls
function createIpcClient() {
  return {
    // Chat methods
    sendMessage: (message: IpcMessageMap['chat:send-message']['request']) =>
      ipcRenderer.invoke(IPC_CHANNELS.CHAT.SEND_MESSAGE, message),

    sendMessageStream: (message: IpcMessageMap['chat:send-message-stream']['request']) =>
      ipcRenderer.invoke(IPC_CHANNELS.CHAT.SEND_MESSAGE_STREAM, message),

    onStreamChunk: (callback: (chunk: string) => void) => {
      const handler = (_event: IpcRendererEvent, chunk: string) => callback(chunk);
      ipcRenderer.on(IPC_CHANNELS.CHAT.STREAM_CHUNK, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.CHAT.STREAM_CHUNK, handler);
    },

    onStreamEnd: (callback: () => void) => {
      const handler = (_event: IpcRendererEvent) => callback();
      ipcRenderer.on(IPC_CHANNELS.CHAT.STREAM_END, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.CHAT.STREAM_END, handler);
    },

    onStreamError: (callback: (error: Error) => void) => {
      const handler = (_event: IpcRendererEvent, error: Error) => callback(error);
      ipcRenderer.on(IPC_CHANNELS.CHAT.STREAM_ERROR, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.CHAT.STREAM_ERROR, handler);
    },

    // App methods
    healthCheck: () =>
      ipcRenderer.invoke(IPC_CHANNELS.APP.HEALTH_CHECK),

    // Ollama methods
    listModels: () =>
      ipcRenderer.invoke(IPC_CHANNELS.OLLAMA.LIST_MODELS),

    setModel: (model: IpcMessageMap['ollama:set-model']['request']) =>
      ipcRenderer.invoke(IPC_CHANNELS.OLLAMA.SET_MODEL, model),

    checkConnection: () =>
      ipcRenderer.invoke(IPC_CHANNELS.OLLAMA.CHECK_CONNECTION)
  };
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', createIpcClient()); 