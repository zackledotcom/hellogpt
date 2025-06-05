import type { ServiceName, ServiceState, ServiceStatus } from './services';
import type { OllamaModel, ModelLoadingState } from '@electron-app/types/ollama';
import type { EmbeddingConfig } from './embedding';

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

export interface OllamaConnectionStatus {
  connected: boolean;
  error?: string;
}

export interface AppStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: number;
  details: {
    ollamaConnected: boolean;
    currentModel: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
}

export interface IpcMessageMap {
  'app:health-check': {
    request: undefined;
    response: Record<ServiceName, ServiceState>;
  };
  'app:retry-service': {
    request: { serviceName: ServiceName };
    response: boolean;
  };
  'app:show-setup-guide': {
    request: undefined;
    response: void;
  };
  'app:show-troubleshooter': {
    request: undefined;
    response: void;
  };
  'app:service-status-changed': {
    request: void;
    response: { serviceName: ServiceName; status: ServiceStatus; error?: string };
  };
  'ollama:list-models': {
    request: undefined;
    response: OllamaModel[];
  };
  'ollama:set-model': {
    request: { modelName: string };
    response: boolean;
  };
  'ollama:check-connection': {
    request: undefined;
    response: boolean;
  };
  'ollama:cancel-load': {
    request: undefined;
    response: void;
  };
  'ollama:save-config': {
    request: { modelName: string; config: any };
    response: void;
  };
  'embedding:get-config': {
    request: undefined;
    response: EmbeddingConfig;
  };
  'embedding:update-config': {
    request: Partial<EmbeddingConfig>;
    response: EmbeddingConfig;
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
    request: undefined;
    response: Conversation[];
  };
  'conversation:get': {
    request: { id: string };
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
    request: { id: string };
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

export interface ElectronAPI {
  ipc: {
    invoke: <K extends keyof IpcMessageMap>(
      channel: K,
      request: IpcMessageMap[K]['request']
    ) => Promise<IpcMessageMap[K]['response']>;
    on: <K extends string>(
      channel: K,
      callback: (...args: any[]) => void
    ) => () => void;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
} 