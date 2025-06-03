export {}; // This ensures the file is treated as a module

interface ModelLoadingState {
  isLoading: boolean;
  modelName: string;
  progress: number;
  estimatedTimeRemaining: number;
  error?: string;
}

interface ElectronAPI {
  sendMessage: (message: string) => Promise<string>;
  healthCheck: () => Promise<{ status: string; timestamp: number }>;
  onStreamChunk: (callback: (chunk: string) => void) => void;
  onStreamEnd: (callback: (fullText: string) => void) => void;
  onStreamError: (callback: (error: string) => void) => void;
  sendMessageStream: (message: string) => Promise<void>;
  onMemoryUpdate: (callback: (memory: any) => void) => void;
  onMemoryError: (callback: (error: string) => void) => void;
  onMemoryInitialized: (callback: () => void) => void;
  onMemoryLoading: (callback: (isLoading: boolean) => void) => void;
  onMemoryStored: (callback: (memory: any) => void) => void;
  onMemorySearched: (callback: (memories: any[]) => void) => void;
  onMemoryRecent: (callback: (memories: any[]) => void) => void;
  onModelLoadingStateChanged: (callback: (state: ModelLoadingState) => void) => void;
  offModelLoadingStateChanged: (callback: (state: ModelLoadingState) => void) => void;
}

interface OllamaModel {
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

interface OllamaAPI {
  listModels: () => Promise<{ models: OllamaModel[] }>;
  setModel: (modelName: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    ollama: OllamaAPI;
  }
} 