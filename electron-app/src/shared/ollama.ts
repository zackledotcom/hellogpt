import type { ChatMessage, ChatResponse, OllamaModel, OllamaConnectionStatus } from '../types/ipc';

const OLLAMA_BASE_URL = 'http://localhost:11434';

export class OllamaClient {
  private currentModel: string = 'llama2';

  async sendMessage(message: ChatMessage): Promise<ChatResponse> {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
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
  }

  async sendMessageStream(
    message: ChatMessage,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
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

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      onChunk(chunk);
    }
  }

  async healthCheck(): Promise<{ status: 'ok' | 'error'; message?: string }> {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }
      return { status: 'ok' };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async listModels(): Promise<OllamaModel[]> {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
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
  }

  async setModel(model: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      this.currentModel = model;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async checkConnection(): Promise<OllamaConnectionStatus> {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }
      return { connected: true };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 