import type { 
  OllamaModel, 
  OllamaConnectionStatus,
  ModelLoadingState,
  OllamaRequestOptions
} from '@electron-app/types/ollama';

interface OllamaAPI {
  listModels: () => Promise<{ models: Model[] }>;
  setModel: (model: { modelName: string }) => Promise<void>;
  checkConnection: () => Promise<OllamaConnectionStatus>;
}

interface Model {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

interface OllamaConnectionStatus {
  status: 'connected' | 'disconnected' | 'error';
  lastChecked: number;
}

declare global {
  interface Window {
    electron: {
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
    };
  }
} 