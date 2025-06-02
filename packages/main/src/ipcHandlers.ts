import fetch, { Response as FetchResponse } from 'node-fetch';
import { appStatus } from './modules/AppStatus.js';

type Role = 'user' | 'system' | 'assistant';

interface ChatMessage {
  role: Role;
  content: string;
}

interface SendMessageOptions {
  model?: string;
  stream?: boolean;
  cache?: boolean;
}

export class OllamaClient {
  private apiUrl: string;
  private apiKey: string | null;
  private mockMode: boolean;
  private cache: Map<string, string>;

  constructor(
    apiUrl: string = 'http://localhost:11434/api/chat',
    apiKey: string | null = null,
    mockMode: boolean = false
  ) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.mockMode = mockMode;
    this.cache = new Map();
  }

  async sendMessage(
    prompt: string,
    options: SendMessageOptions = {}
  ): Promise<string> {
    if (this.mockMode) {
      return `Mock response to: ${prompt}`;
    }

    const model = options.model ?? 'llama3';
    const shouldStream = options.stream ?? false;
    const useCache = options.cache ?? true;

    const cacheKey = `${model}:${prompt}`;
    if (useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const payload = {
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: shouldStream
    };

    try {
      const response = await this.retryFetch(payload, 3);

      if (shouldStream) {
        const fullResponse = await this.handleStreamingResponse(response);
        this.cache.set(cacheKey, fullResponse);
        return fullResponse;
      }

      const json = await response.json();
      const text = (json as any)?.message?.content ?? (json as any)?.response;

      if (!text) {
        throw new Error('Invalid Ollama response');
      }

      appStatus.lastModelLoadError = null;
      appStatus.ollamaModelLoaded = true;

      this.cache.set(cacheKey, text);
      return text;
    } catch (error: any) {
      appStatus.lastModelLoadError = error.message || 'Unknown error';
      appStatus.ollamaModelLoaded = false;
      throw error;
    }
  }

  private async retryFetch(body: any, retries = 3): Promise<FetchResponse> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {})
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`API error ${response.status}: ${errText}`);
        }

        return response;
      } catch (error) {
        if (attempt === retries) throw error;
        await this.delay(200 * attempt); // Exponential backoff
      }
    }

    throw new Error('Unreachable retry condition');
  }

  private async handleStreamingResponse(response: FetchResponse): Promise<string> {
    const reader = (response.body as unknown as ReadableStream<Uint8Array>).getReader();
    const decoder = new TextDecoder();
    let result = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
    }

    return result.trim();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getApiUrl(): string {
    return this.apiUrl;
  }
}

export const ipcHandlers = [
  {
    channel: 'app:sendMessage',
    handler: async (_event: any, message: string) => {
      const client = new OllamaClient();
      try {
        const data = await client.sendMessage(message);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message || 'Unknown error' };
      }
    },
  },
  {
    channel: 'app:healthCheck',
    handler: async (_event: any) => {
      return { success: true, data: { status: 'ok', timestamp: Date.now() } };
    },
  },
  {
    channel: 'app:sendMessageStream',
    handler: async (event: any, message: string) => {
      const client = new OllamaClient();
      const payload = {
        model: 'llama3',
        messages: [{ role: 'user', content: message }],
        stream: true
      };
      try {
        const response = await fetch(client.getApiUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.body) throw new Error('No response body');
        const reader = (response.body as unknown as ReadableStream<Uint8Array>).getReader();
        const decoder = new TextDecoder();
        let done = false;
        let fullText = '';
        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;
            event.sender.send('app:streamChunk', chunk);
          }
        }
        event.sender.send('app:streamEnd', fullText);
        return { success: true, data: fullText };
      } catch (error: any) {
        event.sender.send('app:streamError', error.message || 'Unknown error');
        return { success: false, error: error.message || 'Unknown error' };
      }
    },
  },
];
