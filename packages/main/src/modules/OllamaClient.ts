import fetch from 'node-fetch';
import { appStatus } from './AppStatus.js';

export class OllamaClient {
  private apiUrl: string;
  private apiKey: string | null;
  private mockMode: boolean;

  constructor(apiUrl: string, apiKey: string | null = null, mockMode = false) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.mockMode = mockMode;
  }

  async sendMessage(message: string): Promise<string> {
    if (this.mockMode) {
      // Return a mock response for testing
      return Promise.resolve(`Mock response to: ${message}`);
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({ prompt: message }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        appStatus.lastModelLoadError = `API error: ${response.status} ${errorText}`;
        throw new Error(appStatus.lastModelLoadError);
      }

      const json = await response.json();
      const data = json as { response?: string };
      appStatus.lastModelLoadError = null;
      appStatus.ollamaModelLoaded = true;

      // Assuming the API returns a field 'response' with the text
      return data.response || 'No response from Ollama API';
    } catch (error: any) {
      appStatus.lastModelLoadError = error.message || 'Unknown error';
      appStatus.ollamaModelLoaded = false;
      throw error;
    }
  }
}
