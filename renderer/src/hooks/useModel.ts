import { useState, useCallback } from 'react';
import type { OllamaModel } from '@/types/ipc';

export function useModel() {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await window.electronAPI.ollama.listModels();
      setModels(response);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setModel = useCallback(async (modelName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await window.electronAPI.ollama.setModel(modelName);
      setCurrentModel(modelName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set model');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    models,
    currentModel,
    isLoading,
    error,
    loadModels,
    setModel,
  };
} 