import { exec } from 'child_process';
import { promisify } from 'util';
import { appStatus } from './AppStatus.js';
import fetch, { Response as FetchResponse } from 'node-fetch';
import { Readable } from 'stream';

const execAsync = promisify(exec);

interface Model {
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

interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onEnd: (fullText: string) => void;
  onError: (error: Error) => void;
}

interface OllamaListModelsResponse {
  models: Model[];
}

interface OllamaGenerateResponse {
  response: string;
  // Add other potential properties if needed, based on Ollama API docs
  // e.g., done, context, total_duration, load_duration, prompt_eval_count, eval_count, eval_duration
}

interface OllamaConnectionStatus {
  connected: boolean;
  error?: string;
}

export class OllamaClient {
  private baseUrl: string;
  private mockMode: boolean;
  private currentModel: string = 'llama2';

  constructor(baseUrl = 'http://localhost:11434', _apiKey: string | null = null, mockMode = false) {
    this.baseUrl = baseUrl;
    this.mockMode = mockMode;
  }

  async sendMessage(message: string): Promise<string> {
    if (this.mockMode) {
      return Promise.resolve(`Mock response to: ${message}`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.currentModel,
          prompt: message,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json() as OllamaGenerateResponse;
      return data.response.trim();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/`);
      return response.ok;
    } catch (error) {
      console.error('Error checking Ollama health:', error);
      return false;
    }
  }

  async sendMessageStream(message: string, callbacks: StreamCallbacks): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.currentModel,
          prompt: message,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const stream = response.body as Readable;
      const decoder = new TextDecoder();
      let fullText = '';

      stream.on('data', (chunk: Buffer | string) => {
        const textChunk = typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
        // The API streams JSON objects, need to parse and extract the response
        try {
          // Split chunk by newlines to handle multiple JSON objects in one chunk
          textChunk.split('\n').forEach(line => {
            if (line.trim()) { // Ensure line is not empty
              const jsonChunk = JSON.parse(line);
              if (jsonChunk.response) {
                fullText += jsonChunk.response;
                callbacks.onChunk(jsonChunk.response);
              }
            }
          });
        } catch (e) {
          // Ignore non-JSON chunks or incomplete JSON
          console.error('Error parsing stream chunk:', e, 'Chunk:', textChunk);
        }
      });

      stream.on('end', () => {
        callbacks.onEnd(fullText);
      });

      stream.on('error', (error: Error) => {
        console.error('Error streaming message:', error);
        callbacks.onError(error);
      });

    } catch (error) {
      console.error('Error streaming message (initial fetch):', error);
      callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async listModels(): Promise<Model[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json() as OllamaListModelsResponse;
      return data.models;
    } catch (error) {
      console.error('Error listing models:', error);
      throw error;
    }
  }

  async setModel(modelName: string): Promise<void> {
    // In a real app, you might want to pull the model here if it doesn't exist locally
    // For now, just set the current model
    this.currentModel = modelName;
  }

  getCurrentModel() {
    return this.currentModel;
  }

  async checkConnection(): Promise<OllamaConnectionStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return {
        connected: response.ok,
        ...(response.ok ? {} : { error: `HTTP ${response.status}` })
      };
    } catch (error) {
      console.error('Error checking Ollama connection:', error);
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
