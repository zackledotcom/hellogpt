import { vi } from 'vitest';

// Mock the Electron API
const mockElectronAPI = {
  ollama: {
    onModelLoadingStateChanged: vi.fn(),
    onModelLoaded: vi.fn(),
    onModelLoadError: vi.fn(),
    loadModel: vi.fn(),
    getModelStatus: vi.fn(),
    getAvailableModels: vi.fn(),
    removeModel: vi.fn()
  },
  embedding: {
    onEmbeddingStateChanged: vi.fn(),
    onEmbeddingComplete: vi.fn(),
    onEmbeddingError: vi.fn(),
    generateEmbedding: vi.fn(),
    getEmbeddingStatus: vi.fn()
  },
  vectorStore: {
    onVectorStoreStateChanged: vi.fn(),
    onVectorStoreComplete: vi.fn(),
    onVectorStoreError: vi.fn(),
    storeVectors: vi.fn(),
    getVectorStoreStatus: vi.fn()
  },
  memory: {
    onMemoryStateChanged: vi.fn(),
    onMemoryComplete: vi.fn(),
    onMemoryError: vi.fn(),
    storeMemory: vi.fn(),
    getMemoryStatus: vi.fn()
  }
};

// Mock the window.electron object
Object.defineProperty(window, 'electron', {
  value: mockElectronAPI,
  writable: true
});

export { mockElectronAPI }; 