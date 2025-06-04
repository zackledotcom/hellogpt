import { EmbeddingConfig } from '../../electron-app/src/services/EmbeddingService';
import type { 
  ChatMessage, 
  ChatResponse, 
  Conversation, 
  AppStatus, 
  OllamaModel, 
  OllamaConnectionStatus,
  ModelLoadingState
} from '@electron-app/types/ipc';

import type {
  OllamaResponse,
  OllamaRequestOptions
} from '@electron-app/types/ollama';

declare global {
  interface Window {
    electron: {
      ipc: {
        invoke(channel: keyof IpcMessageMap, ...args: any[]): Promise<any>;
        on(channel: keyof IpcMessageMap, func: (...args: any[]) => void): void;
        once(channel: keyof IpcMessageMap, func: (...args: any[]) => void): void;
      };
    };
    electronAPI: {
      // Chat functionality
      sendMessage: (message: ChatMessage) => Promise<ChatResponse>;
      sendMessageStream: (message: ChatMessage) => Promise<void>;
      getConversations: () => Promise<Conversation[]>;
      getConversation: (id: string) => Promise<ChatMessage[]>;
      createConversation: (title: string) => Promise<string>;
      deleteConversation: (id: string) => Promise<void>;
      updateConversationTitle: (id: string, title: string) => Promise<void>;
      
      // Health check
      healthCheck: () => Promise<AppStatus>;
      
      // Stream listeners with cleanup
      stream: {
        onChunk: (callback: (chunk: string) => void) => () => void;
        onEnd: (callback: (fullText: string) => void) => () => void;
        onError: (callback: (error: string) => void) => () => void;
      };
      
      // Ollama API
      ollama: {
        listModels: () => Promise<{ models: OllamaModel[] }>;
        setModel: (modelName: string) => Promise<void>;
        checkConnection: () => Promise<OllamaConnectionStatus>;
        cancelLoad: () => Promise<void>;
        onModelLoadingStateChanged: (callback: (state: ModelLoadingState) => void) => () => void;
      };
      
      // Utility functions
      removeAllListeners: (channel?: string) => void;
    };
  }
}

export interface IpcMessageMap {
  'embedding:get-config': {
    request: void;
    response: EmbeddingConfig;
  };
  'embedding:update-config': {
    request: Partial<EmbeddingConfig>;
    response: EmbeddingConfig;
  };
  // ... existing IPC channels ...
} 