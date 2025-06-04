import type { ChatMessage, ChatResponse, ModelLoadingState, Conversation, OllamaModel, OllamaConnectionStatus, AppStatus } from './ipc';

export type { ChatMessage, ChatResponse, ModelLoadingState, Conversation, OllamaModel, OllamaConnectionStatus, AppStatus };

export enum Role {
  User = 'user',
  Assistant = 'assistant',
}

declare global {
  interface Window {
    electronAPI: {
      // Chat methods
      sendMessage: (message: ChatMessage) => Promise<ChatResponse>;
      sendMessageStream: (message: ChatMessage) => Promise<void>;
      onStreamChunk: (callback: (chunk: string) => void) => () => void;
      onStreamEnd: (callback: () => void) => () => void;
      onStreamError: (callback: (error: Error) => void) => () => void;

      // Message persistence methods
      createConversation: (title: string) => Promise<string>;
      getConversation: (id: string) => Promise<ChatMessage[]>;
      listConversations: () => Promise<Conversation[]>;
      deleteConversation: (id: string) => Promise<void>;
      updateConversationTitle: (id: string, title: string) => Promise<void>;

      // App methods
      healthCheck: () => Promise<AppStatus>;

      // Ollama methods
      listModels: () => Promise<{ models: OllamaModel[] }>;
      setModel: (model: { modelName: string }) => Promise<void>;
      checkConnection: () => Promise<OllamaConnectionStatus>;

      // Model loading events
      onModelLoadingStateChanged: (callback: (state: ModelLoadingState) => void) => () => void;
    };
  }
} 