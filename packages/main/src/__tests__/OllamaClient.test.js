import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OllamaClient } from '../modules/OllamaClient.js';
import { appStatus } from '../modules/AppStatus.js';
describe('OllamaClient', () => {
    const apiUrl = 'http://localhost:11434/api/chat';
    beforeEach(() => {
        vi.resetAllMocks();
        appStatus.ollamaModelLoaded = false;
        appStatus.lastModelLoadError = null;
    });
    it('should return mock response in mock mode', async () => {
        const client = new OllamaClient(apiUrl, null, true);
        const response = await client.sendMessage('Hello');
        expect(response).toBe('Mock response to: Hello');
        expect(appStatus.ollamaModelLoaded).toBe(false); // mock mode does not set loaded true
    });
    it('should send message and receive response', async () => {
        const mockFetch = vi.fn(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ response: 'Hi there!' }),
        }));
        global.fetch = mockFetch;
        const client = new OllamaClient(apiUrl, null, false);
        const response = await client.sendMessage('Hello');
        expect(response).toBe('Hi there!');
        expect(appStatus.ollamaModelLoaded).toBe(true);
        expect(appStatus.lastModelLoadError).toBeNull();
        expect(mockFetch).toHaveBeenCalledWith(apiUrl, expect.any(Object));
    });
    it('should handle API error response', async () => {
        const mockFetch = vi.fn(() => Promise.resolve({
            ok: false,
            status: 500,
            text: () => Promise.resolve('Internal Server Error'),
        }));
        global.fetch = mockFetch;
        const client = new OllamaClient(apiUrl, null, false);
        await expect(client.sendMessage('Hello')).rejects.toThrow('API error: 500 Internal Server Error');
        expect(appStatus.ollamaModelLoaded).toBe(false);
        expect(appStatus.lastModelLoadError).toContain('API error: 500');
    });
    it('should handle fetch exception', async () => {
        const mockFetch = vi.fn(() => Promise.reject(new Error('Network failure')));
        global.fetch = mockFetch;
        const client = new OllamaClient(apiUrl, null, false);
        await expect(client.sendMessage('Hello')).rejects.toThrow('Network failure');
        expect(appStatus.ollamaModelLoaded).toBe(false);
        expect(appStatus.lastModelLoadError).toBe('Network failure');
    });
});
