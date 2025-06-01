/**
 * This file defines the APIs and objects exposed to the renderer process
 * via Electron's contextBridge for secure IPC communication.
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (channel: string, message: any) => {
    // List of valid channels
    const validChannels = ['chat:sendMessage', 'app:healthCheck'];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, message);
    }
    throw new Error(`Invalid IPC channel: ${channel}`);
  },
  onMessage: (channel: string, callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => {
    const validChannels = ['chat:response', 'app:statusUpdate'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    } else {
      throw new Error(`Invalid IPC channel: ${channel}`);
    }
  },
  removeListener: (channel: string, callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  }
});
