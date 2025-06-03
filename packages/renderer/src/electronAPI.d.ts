export {}; // This ensures the file is treated as a module

interface ElectronAPI {
  sendMessage: (message: string) => Promise<string>;
  healthCheck: () => Promise<{ status: string; timestamp: number }>;
  onStreamChunk: (callback: (chunk: string) => void) => void;
  onStreamEnd: (callback: (fullText: string) => void) => void;
  onStreamError: (callback: (error: string) => void) => void;
  sendMessageStream: (message: string) => Promise<void>;
  ollama: {
    listModels: () => Promise<{
      models: Array<{
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
      }>;
    }>;
    setModel: (modelName: string) => Promise<void>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
} 