import fetch from 'node-fetch';
import { appStatus } from './AppStatus.js';
export class OllamaClient {
    apiUrl;
    apiKey;
    mockMode;
    constructor(apiUrl, apiKey = null, mockMode = false) {
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.mockMode = mockMode;
    }
    async sendMessage(message) {
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
            const data = json;
            appStatus.lastModelLoadError = null;
            appStatus.ollamaModelLoaded = true;
            // Assuming the API returns a field 'response' with the text
            return data.response || 'No response from Ollama API';
        }
        catch (error) {
            appStatus.lastModelLoadError = error.message || 'Unknown error';
            appStatus.ollamaModelLoaded = false;
            throw error;
        }
    }
}
