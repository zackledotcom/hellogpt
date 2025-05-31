import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ipcHandlers } from '../ipcHandlers.js';
import { OllamaClient } from '../modules/OllamaClient.js';

vi.mock('../modules/OllamaClient.js', () => {
  return {
    OllamaClient: vi.fn().mockImplementation(() => {
      return {
        sendMessage: vi.fn(),
      };
    }),
  };
});

describe('ipcHandlers', () => {
  let sendMessageMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    const clientInstance = new OllamaClient('https://api.ollama.com/v1/chat', null, false);
    sendMessageMock = clientInstance.sendMessage;
  });

  it('should handle chat:sendMessage successfully', async () => {
    sendMessageMock.mockResolvedValue('Hello from Ollama');
    const handler = ipcHandlers.find(h => h.channel === 'chat:sendMessage')?.handler;
    expect(handler).toBeDefined();
    if (handler) {
      const result = await handler({} as any, 'Test message');
      expect(result).toEqual({ success: true, data: 'Hello from Ollama' });
      expect(sendMessageMock).toHaveBeenCalledWith('Test message');
    }
  });

  it('should handle chat:sendMessage error', async () => {
    sendMessageMock.mockRejectedValue(new Error('API failure'));
    const handler = ipcHandlers.find(h => h.channel === 'chat:sendMessage')?.handler;
    expect(handler).toBeDefined();
    if (handler) {
      const result = await handler({} as any, 'Test message');
      expect(result.success).toBe(false);
      expect(result.error).toBe('API failure');
    }
  });

  it('should handle app:healthCheck successfully', async () => {
    const handler = ipcHandlers.find(h => h.channel === 'app:healthCheck')?.handler;
    expect(handler).toBeDefined();
    if (handler) {
      const result = await handler();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('ipcReady');
      expect(result.data).toHaveProperty('ollamaModelLoaded');
      expect(result.data).toHaveProperty('windowsOpen');
    }
  });
});
