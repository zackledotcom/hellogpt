import type { 
  OllamaModel, 
  OllamaConnectionStatus,
  ModelLoadingState
} from '@electron-app/types/ipc';

import type {
  OllamaRequestOptions
} from '@electron-app/types/ollama';

// Type definitions for better type safety
interface ElectronAPI {
  ipc: {
    invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>;
    on: (channel: string, callback: (...args: any[]) => void) => () => void;
    once: (channel: string, callback: (...args: any[]) => void) => void;
    removeListener: (channel: string, callback: (...args: any[]) => void) => void;
    removeAllListeners: (channel: string) => void;
  };
  ollama: {
    listModels: () => Promise<{ models: OllamaModel[] }>;
    setModel: (modelName: string) => Promise<void>;
    checkConnection: () => Promise<OllamaConnectionStatus>;
    cancelLoad: () => Promise<void>;
    saveConfig: (modelName: string, config: OllamaRequestOptions) => Promise<void>;
    onModelLoadingStateChanged: (callback: (state: ModelLoadingState) => void) => () => void;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export const ollamaAPI = {
  listModels: () => window.electron.ollama.listModels(),
  
  setModel: (modelName: string) => window.electron.ollama.setModel(modelName),
  
  checkConnection: () => window.electron.ollama.checkConnection(),
  
  cancelLoad: () => window.electron.ollama.cancelLoad(),
  
  saveConfig: (modelName: string, config: OllamaRequestOptions) => 
    window.electron.ollama.saveConfig(modelName, config),
  
  onModelLoadingStateChanged: (callback: (state: ModelLoadingState) => void) => 
    window.electron.ollama.onModelLoadingStateChanged(callback),

  onConnectionStatusChanged: (callback: (status: OllamaConnectionStatus) => void) => {
    const checkStatus = async () => {
      try {
        const status = await window.electron.ollama.checkConnection();
        callback(status);
      } catch (error) {
        callback({ status: 'disconnected', lastChecked: Date.now() });
      }
    };

    // Initial check
    checkStatus();

    // Set up periodic checks
    const interval = setInterval(checkStatus, 5000);

    // Return cleanup function
    return () => {
      clearInterval(interval);
    };
  }
}; 