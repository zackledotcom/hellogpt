import fetch from 'node-fetch';
import { appStatus } from './AppStatus.js';

export class OllamaClient {
  private apiUrl: string;
  private mockMode: boolean;

  constructor(apiUrl = 'http://localhost:11434/api/chat', _apiKey: string | null = null, mockMode = false) {
    this.apiUrl = apiUrl;
    this.mockMode = mockMode;
  }

  async sendMessage(message: string): Promise<string> {
    if (this.mockMode) {
      return Promise.resolve(`Mock response to: ${message}`);
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3', // or whatever model you've pulled
          messages: [
            { role: 'user', content: message }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        appStatus.lastModelLoadError = `API error: ${response.status} ${errorText}`;
        throw new Error(appStatus.lastModelLoadError);
      }

      const json = await response.json();

      // Ollama streams the response; for now assume single block
      const data = json as { message?: { content?: string } };
      appStatus.lastModelLoadError = null;
      appStatus.ollamaModelLoaded = true;

      return data.message?.content || 'No response from Ollama API';
    } catch (error: any) {
      appStatus.lastModelLoadError = error.message || 'Unknown error';
      appStatus.ollamaModelLoaded = false;
      throw error;
    }
  }

  getApiUrl() {
    return this.apiUrl;
  }
}
