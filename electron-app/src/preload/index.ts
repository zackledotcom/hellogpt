import { contextBridge, ipcRenderer } from 'electron';
import type { IpcMessageMap } from '../types/ipc';

// Type-safe wrapper for IPC calls
const ipc = {
  invoke: async <K extends keyof IpcMessageMap>(
    channel: K,
    request: IpcMessageMap[K]['request']
  ): Promise<IpcMessageMap[K]['response']> => {
    return ipcRenderer.invoke(channel, request);
  },
  on: <K extends string>(
    channel: K,
    callback: (...args: any[]) => void
  ) => {
    ipcRenderer.on(channel, (_, ...args) => callback(...args));
    return () => ipcRenderer.removeListener(channel, callback);
  }
};

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electron', {
  ipc,
  // Add any other electron APIs here
}); 