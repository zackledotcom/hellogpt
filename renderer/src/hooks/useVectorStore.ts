import { useState, useCallback } from 'react';
import type { Document } from '@/types/ipc';

export interface UseVectorStoreReturn {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  searchDocuments: (query: string) => Promise<void>;
  addDocument: (file: File) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  clearDocuments: () => Promise<void>;
}

export function useVectorStore(): UseVectorStoreReturn {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchDocuments = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await window.electronAPI.vectorStore.search(query);
      setDocuments(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addDocument = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const content = await file.text();
      await window.electronAPI.vectorStore.add({
        id: crypto.randomUUID(),
        content,
        metadata: {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
        },
      });
      await searchDocuments('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add document');
    } finally {
      setIsLoading(false);
    }
  }, [searchDocuments]);

  const deleteDocument = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await window.electronAPI.vectorStore.delete(id);
      await searchDocuments('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setIsLoading(false);
    }
  }, [searchDocuments]);

  const clearDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await window.electronAPI.vectorStore.clear();
      setDocuments([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    documents,
    isLoading,
    error,
    searchDocuments,
    addDocument,
    deleteDocument,
    clearDocuments,
  };
} 