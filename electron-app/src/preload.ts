import { contextBridge, ipcRenderer } from 'electron';
import type { 
  OllamaModel, 
  OllamaConnectionStatus,
  ModelLoadingState,
  OllamaRequestOptions
} from './types/ollama';

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

type OllamaInvokeChannels = 
  | 'ollama:list-models'
  | 'ollama:set-model'
  | 'ollama:check-connection'
  | 'ollama:cancel-load'
  | 'ollama:save-config';

type OllamaListenerChannels = 
  | 'ollama:model-loading-state-changed';

// Channel validation for security
const ALLOWED_CHANNELS = {
  invoke: [
    'ollama:list-models',
    'ollama:set-model',
    'ollama:check-connection',
    'ollama:cancel-load',
    'ollama:save-config',
    // Add other allowed invoke channels here
  ] as OllamaInvokeChannels[],
  on: [
    'ollama:model-loading-state-changed',
    // Add other allowed listener channels here
  ] as OllamaListenerChannels[]
} as const;

function validateChannel(channel: string, type: 'invoke' | 'on'): channel is OllamaInvokeChannels | OllamaListenerChannels {
  return (ALLOWED_CHANNELS[type] as readonly string[]).includes(channel);
}

// Optimized API with validation and cleanup
const electronAPI: ElectronAPI = {
  ipc: {
    invoke: async <T = any>(channel: string, ...args: any[]): Promise<T> => {
      if (!validateChannel(channel, 'invoke')) {
        throw new Error(`Invalid invoke channel: ${channel}`);
      }
      return ipcRenderer.invoke(channel, ...args);
    },

    on: (channel: string, callback: (...args: any[]) => void) => {
      if (!validateChannel(channel, 'on')) {
        throw new Error(`Invalid listener channel: ${channel}`);
      }
      
      const wrappedCallback = (_event: any, ...args: any[]) => callback(...args);
      ipcRenderer.on(channel, wrappedCallback);
      
      // Return cleanup function for easier memory management
      return () => ipcRenderer.removeListener(channel, wrappedCallback);
    },

    once: (channel: string, callback: (...args: any[]) => void) => {
      if (!validateChannel(channel, 'on')) {
        throw new Error(`Invalid listener channel: ${channel}`);
      }
      ipcRenderer.once(channel, (_event, ...args) => callback(...args));
    },

    removeListener: (channel: string, callback: (...args: any[]) => void) => {
      ipcRenderer.removeListener(channel, callback);
    },

    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    }
  },
  
  ollama: {
    listModels: () => ipcRenderer.invoke('ollama:list-models'),
    setModel: (modelName: string) => ipcRenderer.invoke('ollama:set-model', modelName),
    checkConnection: () => ipcRenderer.invoke('ollama:check-connection'),
    cancelLoad: () => ipcRenderer.invoke('ollama:cancel-load'),
    saveConfig: (modelName: string, config: OllamaRequestOptions) => 
      ipcRenderer.invoke('ollama:save-config', modelName, config),
    onModelLoadingStateChanged: (callback: (state: ModelLoadingState) => void) => {
      const wrappedCallback = (_event: any, state: ModelLoadingState) => callback(state);
      ipcRenderer.on('ollama:model-loading-state-changed', wrappedCallback);
      return () => ipcRenderer.removeListener('ollama:model-loading-state-changed', wrappedCallback);
    }
  }
};

// Expose with proper typing
contextBridge.exposeInMainWorld('electron', electronAPI);

// Optional: Expose type definitions for renderer process
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}