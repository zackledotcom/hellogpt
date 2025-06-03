import { IPC_CHANNELS } from './ipcChannels';

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

export interface HealthCheckResponse {
  model: string;
  windows: number;
  error?: string;
}

// App status types
export interface AppStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: number;
  details?: {
    ollamaConnected: boolean;
    currentModel?: string;
  };
}

// Ollama types
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
  connected: boolean;
  error?: string;
}

// IPC Message type mapping
export type IpcMessageMap = {
  [IPC_CHANNELS.CHAT.SEND_MESSAGE]: {
    request: ChatMessage;
    response: ChatResponse;
  };
  [IPC_CHANNELS.CHAT.SEND_MESSAGE_STREAM]: {
    request: ChatMessage;
    response: void;
  };
  [IPC_CHANNELS.APP.HEALTH_CHECK]: {
    request: void;
    response: AppStatus;
  };
  [IPC_CHANNELS.OLLAMA.LIST_MODELS]: {
    request: void;
    response: { models: OllamaModel[] };
  };
  [IPC_CHANNELS.OLLAMA.SET_MODEL]: {
    request: { modelName: string };
    response: void;
  };
  [IPC_CHANNELS.OLLAMA.CHECK_CONNECTION]: {
    request: void;
    response: OllamaConnectionStatus;
  };
};
