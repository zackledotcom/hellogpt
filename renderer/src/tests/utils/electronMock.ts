import { vi } from 'vitest';
import type { ElectronAPI } from '../../types/ipc';
import type { OllamaModel, ModelLoadingState } from '@electron-app/types/ollama';

export const mockElectron: ElectronAPI = {
  ipc: {
    invoke: vi.fn(),
    on: vi.fn(),
  },
  ollama: {
    listModels: vi.fn(),
    setModel: vi.fn(),
    checkConnection: vi.fn(),
    cancelLoad: vi.fn(),
    saveConfig: vi.fn(),
    onModelLoadingStateChanged: vi.fn(),
  },
  vectorStore: {
    search: vi.fn(),
    add: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  },
  chat: {
    sendMessage: vi.fn(),
    sendMessageStream: vi.fn(),
    onStreamChunk: vi.fn(),
    onStreamEnd: vi.fn(),
    onStreamError: vi.fn(),
  },
  conversation: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

// Mock the window.electron object
Object.defineProperty(window, 'electron', {
  value: mockElectron,
  writable: true,
});

// Reset all mocks before each test
export const resetMocks = () => {
  vi.clearAllMocks();
}; 