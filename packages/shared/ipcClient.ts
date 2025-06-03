import { IPC_CHANNELS } from './ipcChannels';
import type { IpcMessageMap, ChatMessage, ChatResponse, AppStatus, OllamaModel } from './ipcTypes';

declare global {
  interface Window {
    electronAPI: {
      sendMessage: (message: string) => Promise<ChatResponse>;
      healthCheck: () => Promise<AppStatus>;
      onStreamChunk: (callback: (chunk: string) => void) => () => void;
      onStreamEnd: (callback: (fullText: string) => void) => () => void;
      onStreamError: (callback: (error: string) => void) => () => void;
      sendMessageStream: (message: string) => Promise<void>;
      ollama: {
        listModels: () => Promise<{ models: OllamaModel[] }>;
        setModel: (modelName: string) => Promise<void>;
        checkConnection: () => Promise<{ connected: boolean; error?: string }>;
      };
      cleanup: () => void;
    };
  }
}

export class IpcClient {
  private static instance: IpcClient;
  private cleanupCallbacks: Array<() => void> = [];

  private constructor() {}

  static getInstance(): IpcClient {
    if (!IpcClient.instance) {
      IpcClient.instance = new IpcClient();
    }
    return IpcClient.instance;
  }

  // Chat methods
  async sendMessage(message: ChatMessage): Promise<ChatResponse> {
    return window.electronAPI.sendMessage(message.content);
  }

  async sendMessageStream(message: ChatMessage): Promise<void> {
    return window.electronAPI.sendMessageStream(message.content);
  }

  onStreamChunk(callback: (chunk: string) => void): () => void {
    const cleanup = window.electronAPI.onStreamChunk(callback);
    this.cleanupCallbacks.push(cleanup);
    return cleanup;
  }

  onStreamEnd(callback: (fullText: string) => void): () => void {
    const cleanup = window.electronAPI.onStreamEnd(callback);
    this.cleanupCallbacks.push(cleanup);
    return cleanup;
  }

  onStreamError(callback: (error: string) => void): () => void {
    const cleanup = window.electronAPI.onStreamError(callback);
    this.cleanupCallbacks.push(cleanup);
    return cleanup;
  }

  // App methods
  async healthCheck(): Promise<AppStatus> {
    return window.electronAPI.healthCheck();
  }

  // Ollama methods
  async listModels(): Promise<{ models: OllamaModel[] }> {
    return window.electronAPI.ollama.listModels();
  }

  async setModel(modelName: string): Promise<void> {
    return window.electronAPI.ollama.setModel(modelName);
  }

  async checkConnection(): Promise<{ connected: boolean; error?: string }> {
    return window.electronAPI.ollama.checkConnection();
  }

  // Cleanup method
  cleanup(): void {
    this.cleanupCallbacks.forEach(cleanup => cleanup());
    this.cleanupCallbacks = [];
    window.electronAPI.cleanup();
  }
} 