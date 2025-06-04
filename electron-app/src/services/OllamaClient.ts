import type { 
  RequestQueueItem, 
  StreamParserOptions, 
  OllamaRequestOptions, 
  OllamaResponse, 
  OllamaModel,
  OllamaError,
  ModelLoadingState
} from '../types/ollama';
import { RequestQueue } from '../utils/RequestQueue';
import { logger } from '../utils/logger';

const OLLAMA_BASE_URL = 'http://localhost:11434';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const CONNECTION_TIMEOUT_MS = 5000;

export class OllamaClient {
  private static instance: OllamaClient;
  private requestQueue: RequestQueue<any>;
  private currentModel: string = '';
  private modelConfigs: Map<string, OllamaRequestOptions> = new Map();
  private modelLoadingState: ModelLoadingState = {
    status: 'loaded',
    isLoading: false
  };
  private modelLoadingStateListeners: ((state: ModelLoadingState) => void)[] = [];
  private isConnected: boolean = false;
  private connectionCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.requestQueue = new RequestQueue((ms) => new Promise(resolve => setTimeout(resolve, ms)));
    this.startConnectionCheck();
  }

  private startConnectionCheck() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }
    
    this.connectionCheckInterval = setInterval(async () => {
      try {
        const connected = await this.checkConnection();
        if (connected !== this.isConnected) {
          this.isConnected = connected;
          logger.info(`Ollama connection status changed: ${connected ? 'connected' : 'disconnected'}`);
        }
      } catch (error) {
        logger.error('Error checking Ollama connection:', error);
        this.isConnected = false;
      }
    }, 5000);
  }

  public static getInstance(): OllamaClient {
    if (!OllamaClient.instance) {
      OllamaClient.instance = new OllamaClient();
    }
    return OllamaClient.instance;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<T> {
    const url = `${OLLAMA_BASE_URL}${endpoint}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT_MS);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`) as OllamaError;
        error.status = response.status;
        try {
          error.details = await response.json();
        } catch {
          error.details = await response.text();
        }
        throw error;
      }

      return response.json();
    } catch (error) {
      if (retryCount < MAX_RETRIES && this.shouldRetry(error)) {
        logger.warn(`Retrying request to ${endpoint} (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (retryCount + 1)));
        return this.makeRequest(endpoint, options, retryCount + 1);
      }
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    if (error instanceof Error) {
      // Retry on network errors or 5xx server errors
      if (error.name === 'AbortError' || error instanceof TypeError) {
        return true;
      }
      const ollamaError = error as OllamaError;
      return ollamaError.status !== undefined && ollamaError.status >= 500;
    }
    return false;
  }

  public async checkConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/api/tags');
      return true;
    } catch (error) {
      logger.error('Ollama connection check failed:', error);
      return false;
    }
  }

  public isServiceConnected(): boolean {
    return this.isConnected;
  }

  private queueRequest<T>(request: () => Promise<T>, maxRetries: number = MAX_RETRIES): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.enqueue({
        id: Math.random().toString(36).substring(2, 9),
        request,
        retries: 0,
        maxRetries,
        resolve,
        reject,
      });
    });
  }

  public async listModels(): Promise<{ models: OllamaModel[] }> {
    return this.queueRequest(() => this.makeRequest('/api/tags'));
  }

  public async setModel(modelName: string): Promise<void> {
    this.currentModel = modelName;
    this.updateModelLoadingState({ status: 'loading', isLoading: true });
    try {
      await this.makeRequest('/api/pull', {
        method: 'POST',
        body: JSON.stringify({ name: modelName }),
      });
      this.updateModelLoadingState({ status: 'loaded', isLoading: false });
    } catch (error) {
      this.updateModelLoadingState({ 
        status: 'error', 
        isLoading: false, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  public async cancelLoad(): Promise<void> {
    try {
      await this.makeRequest('/api/cancel', { method: 'POST' });
    } catch (error) {
      logger.error('Failed to cancel model load:', error);
      throw error;
    }
  }

  public onModelLoadingStateChanged(callback: (state: ModelLoadingState) => void): () => void {
    this.modelLoadingStateListeners.push(callback);
    return () => {
      this.modelLoadingStateListeners = this.modelLoadingStateListeners.filter(cb => cb !== callback);
    };
  }

  private updateModelLoadingState(state: Partial<ModelLoadingState>): void {
    this.modelLoadingState = { ...this.modelLoadingState, ...state };
    this.modelLoadingStateListeners.forEach(callback => callback(this.modelLoadingState));
  }

  public async updateModelConfig(modelName: string, config: OllamaRequestOptions): Promise<void> {
    this.modelConfigs.set(modelName, config);
    // If this is the current model, update the configuration immediately
    if (this.currentModel === modelName) {
      try {
        await this.makeRequest('/api/generate', {
          method: 'POST',
          body: JSON.stringify({
            model: modelName,
            options: config.options
          })
        });
      } catch (error) {
        logger.error('Failed to update model configuration:', error);
        throw error;
      }
    }
  }

  public async sendMessage(message: string, options: OllamaRequestOptions = {}): Promise<OllamaResponse> {
    const modelConfig = this.modelConfigs.get(this.currentModel) || {};
    const requestOptions: OllamaRequestOptions = {
      model: this.currentModel,
      ...modelConfig,
      ...options,
    };

    return this.queueRequest(() => 
      this.makeRequest('/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: message,
          ...requestOptions,
        }),
      })
    );
  }

  public async streamMessage(
    message: string,
    options: OllamaRequestOptions & StreamParserOptions
  ): Promise<void> {
    const { onChunk, onError, onComplete, ...requestOptions } = options;
    const url = `${OLLAMA_BASE_URL}/api/generate`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: message,
          model: this.currentModel,
          stream: true,
          ...requestOptions,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.error) {
              onError(new Error(data.error));
              return;
            }
            onChunk(data.response);
            if (data.done) {
              onComplete();
              return;
            }
          } catch (error) {
            onError(error as Error);
            return;
          }
        }
      }
    } catch (error) {
      onError(error as Error);
    }
  }
} 