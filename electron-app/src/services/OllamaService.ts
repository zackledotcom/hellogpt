import { OllamaClient } from './OllamaClient';
import type { ChatResponse } from '../types/ipc';
import { logger } from '../utils/logger';
import { Role } from '../types/ipc';
import { v4 as uuidv4 } from 'uuid';

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export class OllamaService {
  private static instance: OllamaService;
  private client: OllamaClient;
  private currentModel: string;
  private readonly baseUrl = 'http://localhost:11434';
  private initializationPromise: Promise<void> | null = null;
  private fallbackResponses: Map<string, string> = new Map([
    ['error', 'I apologize, but I am currently unable to process your request. The Ollama service is temporarily unavailable.'],
    ['greeting', 'Hello! I am currently operating in limited mode. Some features may be unavailable.'],
    ['help', 'I can help you with basic tasks, but advanced features are currently unavailable due to service limitations.']
  ]);

  private constructor() {
    this.client = OllamaClient.getInstance();
    this.currentModel = '';
  }

  public static getInstance(): OllamaService {
    if (!OllamaService.instance) {
      OllamaService.instance = new OllamaService();
    }
    return OllamaService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        logger.info('Initializing OllamaService');
        const connectionStatus = await this.checkConnection();
        
        if (connectionStatus.status === 'disconnected') {
          logger.warn('Ollama service is not available. Some features may be limited.');
        }
      } catch (error) {
        logger.error('Error initializing Ollama service:', error);
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  async checkConnection(): Promise<{ status: 'connected' | 'disconnected' }> {
    try {
      const isConnected = await this.client.checkConnection();
      return { status: isConnected ? 'connected' : 'disconnected' };
    } catch (error) {
      logger.error('Error checking Ollama connection:', error);
      return { status: 'disconnected' };
    }
  }

  private getFallbackResponse(message: string): ChatResponse {
    // Simple keyword matching for fallback responses
    const lowerMessage = message.toLowerCase();
    let responseType = 'error';

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      responseType = 'greeting';
    } else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      responseType = 'help';
    }

    return {
      id: uuidv4(),
      content: this.fallbackResponses.get(responseType) || this.fallbackResponses.get('error')!,
      role: Role.Assistant,
      timestamp: Date.now()
    };
  }

  async listModels(): Promise<{ models: OllamaModel[] }> {
    try {
      if (this.client.isInFallbackMode()) {
        throw new Error('Service is in fallback mode');
      }

      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      logger.error('Error listing models:', error);
      throw error;
    }
  }

  async pullModel(modelName: string): Promise<void> {
    if (!this.client.isServiceConnected()) {
      throw new Error('Cannot pull model: Ollama service is not connected');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: modelName }),
      });

      if (!response.ok) {
        throw new Error(`Failed to pull model: ${response.statusText}`);
      }

      // Wait for the pull to complete
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // Process the stream if needed
      }
    } catch (error) {
      logger.error('Error pulling model:', error);
      throw error;
    }
  }

  async setModel(modelName: string): Promise<void> {
    try {
      if (this.client.isInFallbackMode()) {
        throw new Error('Cannot set model: Service is in fallback mode');
      }

      const models = await this.listModels();
      if (!models.models.some(model => model.name === modelName)) {
        throw new Error(`Model ${modelName} not found`);
      }
      this.currentModel = modelName;
    } catch (error) {
      logger.error('Error setting model:', error);
      throw error;
    }
  }

  getCurrentModel(): string {
    return this.currentModel;
  }

  async cancelLoad(): Promise<void> {
    try {
      if (this.client.isInFallbackMode()) {
        throw new Error('Cannot cancel load: Service is in fallback mode');
      }

      const response = await fetch(`${this.baseUrl}/api/cancel`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`Failed to cancel load: ${response.statusText}`);
      }
    } catch (error) {
      logger.error('Error canceling load:', error);
      throw error;
    }
  }

  async generateResponse(message: string): Promise<ChatResponse> {
    if (!this.client.isServiceConnected()) {
      logger.warn('Generating fallback response due to service unavailability');
      return this.getFallbackResponse(message);
    }

    try {
      const response = await this.client.sendMessage(message);
      return {
        id: uuidv4(),
        content: response.response,
        role: Role.Assistant,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Error generating response:', error);
      return this.getFallbackResponse(message);
    }
  }

  isServiceAvailable(): boolean {
    return this.client.isServiceConnected();
  }

  isInFallbackMode(): boolean {
    return this.client.isInFallbackMode();
  }

  getConnectionStatus(): { 
    isConnected: boolean; 
    isFallbackMode: boolean; 
    lastSuccessfulConnection: number;
    connectionAttempts: number;
  } {
    return {
      isConnected: this.client.isServiceConnected(),
      isFallbackMode: this.client.isInFallbackMode(),
      lastSuccessfulConnection: this.client.getLastSuccessfulConnection(),
      connectionAttempts: this.client.getConnectionAttempts()
    };
  }
} 