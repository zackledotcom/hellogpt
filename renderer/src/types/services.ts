export type ServiceName = 'ollama' | 'embedding' | 'vectorStore' | 'memory';

export type ServiceStatus = 'ok' | 'error' | 'degraded' | 'unavailable' | 'operational';

export interface ServiceState {
  status: ServiceStatus;
  lastCheck: number;
  error?: string;
  details?: {
    currentModel?: string;
    healthScore?: number;
    ollamaConnected?: boolean;
  };
}

export interface ServiceToast {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
} 