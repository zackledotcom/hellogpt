import type { ChatMessage, ChatResponse, OllamaModel, OllamaConnectionStatus } from '../../types/ipc';
import { EventEmitter } from 'events';

interface RequestQueueItem {
  id: string;
  request: () => Promise<any>;
  retries: number;
  maxRetries: number;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
}

interface StreamParserOptions {
  onChunk: (chunk: string) => void;
  onError: (error: Error) => void;
  onComplete: () => void;
}

export class OllamaClient extends EventEmitter {
  private static instance: OllamaClient;
  private baseUrl: string;
  private currentModel: string;
  private fallbackModels: string[];
  private connectionPool: Set<WebSocket>;
  private maxConnections: number;
  private requestQueue: RequestQueueItem[];
  private isProcessingQueue: boolean;
  private healthCheckInterval: NodeJS.Timeout | null;
  private connectionStatus: OllamaConnectionStatus;

  private constructor() {
    super();
    this.baseUrl = 'http://localhost:11434';
    this.currentModel = 'llama2';
    this.fallbackModels = ['mistral', 'codellama', 'neural-chat'];
    this.connectionPool = new Set();
    this.maxConnections = 5;
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.healthCheckInterval = null;
    this.connectionStatus = { status: 'disconnected', lastChecked: Date.now() };
  }

  public static getInstance(): OllamaClient {
    if (!OllamaClient.instance) {
      OllamaClient.instance = new OllamaClient();
    }
    return OllamaClient.instance;
  }

  private async createConnection(): Promise<WebSocket> {
    const ws = new WebSocket(`ws://localhost:11434/api/chat`);
    return new Promise((resolve, reject) => {
      ws.onopen = () => resolve(ws);
      ws.onerror = (error) => reject(error);
    });
  }

  private async getConnection(): Promise<WebSocket> {
    // Try to get an existing connection
    for (const conn of this.connectionPool) {
      if (conn.readyState === WebSocket.OPEN) {
        return conn;
      }
    }

    // Create new connection if pool isn't full
    if (this.connectionPool.size < this.maxConnections) {
      const conn = await this.createConnection();
      this.connectionPool.add(conn);
      return conn;
    }

    // Wait for a connection to become available
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        for (const conn of this.connectionPool) {
          if (conn.readyState === WebSocket.OPEN) {
            clearInterval(checkInterval);
            resolve(conn);
            return;
          }
        }
      }, 100);
    });
  }

  private async queueRequest<T>(
    request: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const queueItem: RequestQueueItem = {
        id: Math.random().toString(36).substr(2, 9),
        request,
        retries: 0,
        maxRetries,
        resolve,
        reject,
      };

      this.requestQueue.push(queueItem);
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;

    this.isProcessingQueue = true;
    const item = this.requestQueue[0];

    try {
      const result = await item.request();
      item.resolve(result);
    } catch (error) {
      if (item.retries < item.maxRetries) {
        item.retries++;
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, item.retries) * 1000));
        this.processQueue();
        return;
      }
      item.reject(error as Error);
    }

    this.requestQueue.shift();
    this.isProcessingQueue = false;
    this.processQueue();
  }

  private async parseStream(
    response: Response,
    options: StreamParserOptions
  ): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const chunk = JSON.parse(line);
              options.onChunk(chunk.response || '');
            } catch (parseError) {
              options.onError(new Error(`Failed to parse chunk: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`));
            }
          }
        }
      }
      options.onComplete();
    } catch (streamError) {
      options.onError(streamError instanceof Error ? streamError : new Error('Unknown stream error'));
    } finally {
      reader.releaseLock();
    }
  }

  private async tryFallbackModel(error: Error): Promise<boolean> {
    const currentIndex = this.fallbackModels.indexOf(this.currentModel);
    if (currentIndex === -1 || currentIndex === this.fallbackModels.length - 1) {
      return false;
    }

    const nextModel = this.fallbackModels[currentIndex + 1];
    try {
      await this.setModel(nextModel);
      return true;
    } catch {
      return false;
    }
  }

  public async sendMessage(message: ChatMessage): Promise<ChatResponse> {
    return this.queueRequest(async () => {
      try {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.currentModel,
            messages: [message]
          })
        });

        if (!response.ok) {
          throw new Error(`Ollama API error: ${response.statusText}`);
        }

        return response.json();
      } catch (error) {
        if (await this.tryFallbackModel(error as Error)) {
          return this.sendMessage(message);
        }
        throw error;
      }
    });
  }

  public async sendMessageStream(
    message: ChatMessage,
    options: StreamParserOptions
  ): Promise<void> {
    return this.queueRequest(async () => {
      try {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.currentModel,
            messages: [message],
            stream: true
          })
        });

        if (!response.ok) {
          throw new Error(`Ollama API error: ${response.statusText}`);
        }

        await this.parseStream(response, options);
      } catch (error) {
        if (await this.tryFallbackModel(error as Error)) {
          return this.sendMessageStream(message, options);
        }
        throw error;
      }
    });
  }

  public async listModels(): Promise<OllamaModel[]> {
    return this.queueRequest(async () => {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.models.map((model: any) => ({
        name: model.name,
        size: model.size,
        digest: model.digest,
        modifiedAt: model.modified_at
      }));
    });
  }

  public async setModel(modelName: string): Promise<void> {
    return this.queueRequest(async () => {
      this.currentModel = modelName;
      this.emit('modelChanged', modelName);
    });
  }

  public async checkConnection(): Promise<OllamaConnectionStatus> {
    return this.queueRequest(async () => {
      try {
        const response = await fetch(`${this.baseUrl}/api/tags`);
        this.connectionStatus = {
          status: response.ok ? 'connected' : 'error',
          lastChecked: Date.now()
        };
      } catch (error) {
        this.connectionStatus = {
          status: 'disconnected',
          lastChecked: Date.now()
        };
      }
      return this.connectionStatus;
    });
  }

  public startHealthCheck(interval: number = 30000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      const status = await this.checkConnection();
      this.emit('healthCheck', status);
    }, interval);
  }

  public stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  public getConnectionStatus(): OllamaConnectionStatus {
    return this.connectionStatus;
  }

  public getCurrentModel(): string {
    return this.currentModel;
  }
} 