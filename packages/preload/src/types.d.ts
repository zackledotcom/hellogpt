interface ElectronAPI {
  sendMessage: (message: string) => Promise<string>;
  sendMessageStream: (message: string) => Promise<any>;
  healthCheck: () => Promise<{ status: string; timestamp: number }>;
  onStreamChunk: (callback: (chunk: string) => void) => void;
  onStreamEnd: (callback: (fullText: string) => void) => void;
  onStreamError: (callback: (error: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
} 