export const enum Role {
  System = 'system',
  User = 'user',
  Assistant = 'assistant',
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
}

export interface ChatResponse {
  message: ChatMessage;
  error?: string;
}

export interface OllamaModel {
  name: string;
  size: number;
  parameter_size: string;
  quantization_level: string;
}

export interface OllamaConnectionStatus {
  connected: boolean;
  error?: string;
}

export interface AppStatus {
  status: 'ok' | 'error';
  message?: string;
}

export interface ModelLoadingState {
  isLoading: boolean;
  modelName?: string;
  progress?: number;
  estimatedTimeRemaining?: number;
  error?: string;
}

export interface IpcMessageMap {
  'ollama:list-models': {
    request: void;
    response: OllamaModel[];
  };
  'ollama:set-model': {
    request: string;
    response: void;
  };
  'ollama:check-connection': {
    request: void;
    response: OllamaConnectionStatus;
  };
  'ollama:cancel-load': {
    request: void;
    response: void;
  };
  'ollama:save-config': {
    request: { modelName: string; config: any };
    response: void;
  };
  'ollama:model-loading-state': {
    request: void;
    response: ModelLoadingState;
  };
  'ollama:connection-status': {
    request: void;
    response: OllamaConnectionStatus;
  };
  'conversation:list': {
    request: void;
    response: Conversation[];
  };
  'conversation:get': {
    request: string;
    response: Conversation;
  };
  'conversation:create': {
    request: { title: string };
    response: Conversation;
  };
  'conversation:update': {
    request: { id: string; title: string };
    response: Conversation;
  };
  'conversation:delete': {
    request: string;
    response: void;
  };
  'vector-store:search': {
    request: string;
    response: Document[];
  };
  'vector-store:add': {
    request: Document;
    response: void;
  };
  'vector-store:delete': {
    request: string;
    response: void;
  };
  'vector-store:clear': {
    request: void;
    response: void;
  };
  'chat:send-message': {
    request: ChatMessage;
    response: ChatResponse;
  };
  'chat:send-message-stream': {
    request: ChatMessage;
    response: void;
  };
  'chat:stream-chunk': {
    request: void;
    response: string;
  };
  'chat:stream-end': {
    request: void;
    response: void;
  };
  'chat:stream-error': {
    request: void;
    response: Error;
  };
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
}

export interface ElectronAPI {
  ipc: {
    invoke: <K extends keyof IpcMessageMap>(
      channel: K,
      request: IpcMessageMap[K]['request']
    ) => Promise<IpcMessageMap[K]['response']>;
    on: <K extends string>(channel: K, callback: (...args: any[]) => void) => () => void;
  };
  ollama: {
    listModels: () => Promise<OllamaModel[]>;
    setModel: (modelName: string) => Promise<void>;
    checkConnection: () => Promise<OllamaConnectionStatus>;
    cancelLoad: () => Promise<void>;
    saveConfig: (modelName: string, config: any) => Promise<void>;
    onModelLoadingStateChanged: (callback: (state: ModelLoadingState) => void) => () => void;
  };
  vectorStore: {
    search: (query: string) => Promise<Document[]>;
    add: (document: Document) => Promise<void>;
    delete: (id: string) => Promise<void>;
    clear: () => Promise<void>;
  };
  chat: {
    sendMessage: (message: ChatMessage) => Promise<ChatResponse>;
    sendMessageStream: (message: ChatMessage) => Promise<void>;
    onStreamChunk: (callback: (chunk: string) => void) => () => void;
    onStreamEnd: (callback: () => void) => () => void;
    onStreamError: (callback: (error: Error) => void) => () => void;
  };
  conversation: {
    list: () => Promise<Conversation[]>;
    get: (id: string) => Promise<Conversation>;
    create: (title: string) => Promise<Conversation>;
    update: (id: string, title: string) => Promise<Conversation>;
    delete: (id: string) => Promise<void>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
} 