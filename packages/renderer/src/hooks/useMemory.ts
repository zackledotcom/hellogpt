import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface MemoryChunk {
  id: string;
  content: string;
  metadata: {
    timestamp: number;
    source: string;
    type: string;
    tags?: string[];
    [key: string]: any;
  };
}

interface MemoryAPI {
  initialize: () => Promise<{ success: boolean; error?: string }>;
  store: (content: string, metadata: Omit<MemoryChunk['metadata'], 'timestamp'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  search: (query: string, options?: { limit?: number }) => Promise<{ success: boolean; results?: MemoryChunk[]; error?: string }>;
  getRecent: (limit?: number) => Promise<{ success: boolean; results?: MemoryChunk[]; error?: string }>;
}

declare global {
  interface Window {
    memoryAPI: MemoryAPI;
  }
}

interface MemoryState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  searchMemory: (query: string, options?: { limit?: number }) => Promise<MemoryChunk[]>;
  storeMemory: (content: string, metadata: Omit<MemoryChunk['metadata'], 'timestamp'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  getRecentMemories: (limit?: number) => Promise<MemoryChunk[]>;
}

export function useMemory(): MemoryState {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeMemory = async () => {
      if (window.memoryAPI?.initialize) {
        try {
          const result = await window.memoryAPI.initialize();
          setIsInitialized(result.success);
          setError(result.error || null);
          toast.success('Memory service initialized!');
        } catch (err: any) {
          console.error('Error initializing memory service:', err);
          setError(err.message);
          toast.error(`Failed to initialize memory service: ${err.message}`);
        }
      } else {
        setError('Memory API not exposed in preload script.');
        toast.error('Memory API not available.');
        console.error('Memory API not exposed in preload script.');
      }
      setIsLoading(false);
    };

    initializeMemory();
  }, []);

  const searchMemory = async (query: string, options?: { limit?: number }): Promise<MemoryChunk[]> => {
    if (!window.memoryAPI?.search) {
      throw new Error('Memory API not available');
    }
    const result = await window.memoryAPI.search(query, options);
    if (!result.success) {
      throw new Error(result.error || 'Failed to search memories');
    }
    return result.results || [];
  };

  const storeMemory = async (content: string, metadata: Omit<MemoryChunk['metadata'], 'timestamp'>): Promise<{ success: boolean; id?: string; error?: string }> => {
    if (!window.memoryAPI?.store) {
      throw new Error('Memory API not available');
    }
    return window.memoryAPI.store(content, metadata);
  };

  const getRecentMemories = async (limit?: number): Promise<MemoryChunk[]> => {
    if (!window.memoryAPI?.getRecent) {
      throw new Error('Memory API not available');
    }
    const result = await window.memoryAPI.getRecent(limit);
    if (!result.success) {
      throw new Error(result.error || 'Failed to get recent memories');
    }
    return result.results || [];
  };

  return {
    isInitialized,
    isLoading,
    error,
    searchMemory,
    storeMemory,
    getRecentMemories
  };
} 