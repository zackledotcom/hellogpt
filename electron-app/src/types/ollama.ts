export interface RequestQueueItem {
  id: string;
  request: () => Promise<any>;
  retries: number;
  maxRetries: number;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
}

export interface StreamParserOptions {
  onChunk: (chunk: string) => void;
  onError: (error: Error) => void;
  onComplete: () => void;
}

export interface OllamaRequestOptions {
  model?: string;
  stream?: boolean;
  context?: number[];
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repeat_penalty?: number;
    stop?: string[];
    [key: string]: any;
  };
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
  eval_count?: number;
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

export interface OllamaError extends Error {
  code?: string;
  status?: number;
  details?: any;
}

export interface ModelLoadingState {
  status: 'loading' | 'loaded' | 'error';
  isLoading: boolean;
  error?: string;
  progress?: number;
  estimatedTimeRemaining?: number;
  modelName?: string;
}

export interface OllamaConnectionStatus {
  connected: boolean;
  error?: string;
  lastChecked?: number;
} 