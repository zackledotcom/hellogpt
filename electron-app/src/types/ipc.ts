export const enum Role {
  User = 'user',
  Assistant = 'assistant',
}

export interface ChatMessage {
  role: Role;
  content: string;
  timestamp?: number;
}

export interface ChatResponse {
  content: string;
  timestamp: number;
}

export interface AppStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: number;
  details?: {
    ollamaConnected: boolean;
    currentModel?: string;
  };
}

export interface OllamaModel {
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

export interface OllamaConnectionStatus {
  status: 'connected' | 'disconnected' | 'error';
  lastChecked: number;
}

export interface ModelLoadingState {
  isLoading: boolean;
  modelName: string;
  progress: number;
  estimatedTimeRemaining: number;
  error?: string;
}

export interface IpcMessageMap {
  'chat:send-message': {
    request: ChatMessage;
    response: ChatResponse;
  };
  'chat:send-message-stream': {
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
} 