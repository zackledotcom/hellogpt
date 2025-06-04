import type { MemoryChunk } from '../services/MemoryService';
import type { EmbeddingConfig } from '../services/EmbeddingService';
import type { OllamaRequestOptions } from './ollama';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
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
  metadata: {
    filename?: string;
    type?: string;
    size?: number;
    timestamp: number;
    source?: string;
    [key: string]: any;
  };
}

export enum Role {
  User = 'user',
  Assistant = 'assistant',
  System = 'system'
}

export interface AppStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: number;
  details: {
    ollamaConnected: boolean;
    currentModel: string;
  };
}

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaConnectionStatus {
  status: 'connected' | 'disconnected' | 'error';
  lastChecked: number;
  error?: string;
  details?: {
    version?: string;
    models?: string[];
    currentModel?: string;
    [key: string]: any;
  };
}

export interface IpcMessageMap {
  'chat:send-message': {
    request: ChatMessage;
    response: ChatMessage;
  };
  'chat:send-message-stream': {
    request: ChatMessage;
    response: void;
  };
  'chat:create-conversation': {
    request: string;
    response: string;
  };
  'chat:get-conversation': {
    request: string;
    response: ChatMessage[];
  };
  'chat:get-conversations': {
    request: void;
    response: Conversation[];
  };
  'chat:delete-conversation': {
    request: string;
    response: void;
  };
  'chat:update-conversation-title': {
    request: { id: string; title: string };
    response: void;
  };
  'chat:message-received': {
    request: ChatMessage;
    response: void;
  };
  'app:health-check': {
    request: void;
    response: AppStatus;
  };
  'ollama:list-models': {
    request: void;
    response: { models: OllamaModel[] };
  };
  'ollama:set-model': {
    request: { modelName: string };
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
    request: { modelName: string; config: OllamaRequestOptions };
    response: void;
  };
  'ollama:model-loading-state-changed': {
    request: ModelLoadingState;
    response: void;
  };
  'memory:initialize': {
    request: void;
    response: void;
  };
  'memory:store': {
    request: { content: string; metadata: Omit<MemoryChunk['metadata'], 'timestamp'> };
    response: MemoryChunk;
  };
  'memory:search': {
    request: { query: string; options?: { limit?: number } };
    response: MemoryChunk[];
  };
  'memory:get-recent': {
    request: { limit?: number };
    response: MemoryChunk[];
  };
  'memory:delete': {
    request: { id: string };
    response: void;
  };
  'memory:clear': {
    request: void;
    response: void;
  };
  'vector:search': {
    request: string;
    response: Document[];
  };
  'vector:add': {
    request: Omit<Document, 'id'>;
    response: void;
  };
  'vector:delete': {
    request: string;
    response: void;
  };
  'vector:clear': {
    request: void;
    response: void;
  };
  'embedding:get-config': {
    request: void;
    response: EmbeddingConfig;
  };
  'embedding:update-config': {
    request: Partial<EmbeddingConfig>;
    response: void;
  };
}

export interface ChatResponse {
  id: string;
  content: string;
  role: Role;
  timestamp: number;
  metadata?: {
    model?: string;
    tokens?: number;
    processingTime?: number;
    [key: string]: any;
  };
}

export interface ModelLoadingState {
  status: 'loading' | 'loaded' | 'error';
  progress?: number;
  error?: string;
  isLoading: boolean;
  estimatedTimeRemaining?: number;
  modelName?: string;
} 