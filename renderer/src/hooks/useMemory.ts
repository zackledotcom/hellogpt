import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface MemoryChunk {
  id: string;
  content: string;
  metadata: {
    timestamp: number;
    type: string;
    source: string;
    tags?: string[];
    [key: string]: any;
  };
}

interface MemoryAPI {
  initialize: () => Promise<{ success: boolean; error?: string }>;
  store: (content: string, metadata: Omit<MemoryChunk['metadata'], 'timestamp'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  search: (query: string, options?: { limit?: number }) => Promise<{ success: boolean; results?: MemoryChunk[]; error?: string }>;
  getRecent: (limit?: number) => Promise<{ success: boolean; results?: MemoryChunk[]; error?: string }>;
  delete: (id: string) => Promise<{ success: boolean; error?: string }>;
  clear: () => Promise<{ success: boolean; error?: string }>;
  onInitialized: (callback: () => void) => () => void;
  onStored: (callback: (memory: MemoryChunk) => void) => () => void;
  onSearched: (callback: (memories: MemoryChunk[]) => void) => () => void;
  onRecent: (callback: (memories: MemoryChunk[]) => void) => () => void;
  onDeleted: (callback: (id: string) => void) => () => void;
  onCleared: (callback: () => void) => () => void;
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
  memories: MemoryChunk[];
  searchMemory: (query: string, options?: { limit?: number }) => Promise<MemoryChunk[]>;
  storeMemory: (content: string, metadata: Omit<MemoryChunk['metadata'], 'timestamp'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  getRecentMemories: (limit?: number) => Promise<MemoryChunk[]>;
  deleteMemory: (id: string) => Promise<{ success: boolean; error?: string }>;
  clearMemories: () => Promise<{ success: boolean; error?: string }>;
}

export function useMemory(): MemoryState {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memories, setMemories] = useState<MemoryChunk[]>([]);

  useEffect(() => {
    const initializeMemory = async () => {
      if (window.memoryAPI?.initialize) {
        try {
          const result = await window.memoryAPI.initialize();
          setIsInitialized(result.success);
          setError(result.error || null);
          if (result.success) {
            toast.success('Memory service initialized!');
          } else {
            toast.error(`Failed to initialize memory service: ${result.error}`);
          }
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

  // Set up event listeners
  useEffect(() => {
    if (!window.memoryAPI) return;

    const cleanup = [
      window.memoryAPI.onInitialized(() => {
        setIsInitialized(true);
        setError(null);
      }),

      window.memoryAPI.onStored((memory) => {
        setMemories(prev => [memory, ...prev]);
      }),

      window.memoryAPI.onSearched((newMemories) => {
        setMemories(newMemories);
      }),

      window.memoryAPI.onRecent((newMemories) => {
        setMemories(newMemories);
      }),

      window.memoryAPI.onDeleted((id) => {
        setMemories(prev => prev.filter(m => m.id !== id));
      }),

      window.memoryAPI.onCleared(() => {
        setMemories([]);
      })
    ];

    return () => cleanup.forEach(fn => fn());
  }, []);

  const searchMemory = useCallback(async (query: string, options?: { limit?: number }): Promise<MemoryChunk[]> => {
    if (!window.memoryAPI?.search) {
      throw new Error('Memory API not available');
    }
    const result = await window.memoryAPI.search(query, options);
    if (!result.success) {
      throw new Error(result.error || 'Failed to search memories');
    }
    return result.results || [];
  }, []);

  const storeMemory = useCallback(async (content: string, metadata: Omit<MemoryChunk['metadata'], 'timestamp'>): Promise<{ success: boolean; id?: string; error?: string }> => {
    if (!window.memoryAPI?.store) {
      throw new Error('Memory API not available');
    }
    return window.memoryAPI.store(content, metadata);
  }, []);

  const getRecentMemories = useCallback(async (limit?: number): Promise<MemoryChunk[]> => {
    if (!window.memoryAPI?.getRecent) {
      throw new Error('Memory API not available');
    }
    const result = await window.memoryAPI.getRecent(limit);
    if (!result.success) {
      throw new Error(result.error || 'Failed to get recent memories');
    }
    return result.results || [];
  }, []);

  const deleteMemory = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!window.memoryAPI?.delete) {
      throw new Error('Memory API not available');
    }
    return window.memoryAPI.delete(id);
  }, []);

  const clearMemories = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!window.memoryAPI?.clear) {
      throw new Error('Memory API not available');
    }
    return window.memoryAPI.clear();
  }, []);

  return {
    isInitialized,
    isLoading,
    error,
    memories,
    searchMemory,
    storeMemory,
    getRecentMemories,
    deleteMemory,
    clearMemories
  };
} 