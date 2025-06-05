import { useState, useEffect } from 'react';
import type { OllamaModel, ModelLoadingState } from '@electron-app/types/ollama';

export function useOllama() {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [currentModel, setCurrentModel] = useState<OllamaModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<ModelLoadingState | null>(null);

  const loadModels = async () => {
    try {
      setIsLoading(true);
      const loadedModels = await window.electron.ipc.invoke('ollama:list-models', undefined);
      setModels(loadedModels);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
    } finally {
      setIsLoading(false);
    }
  };

  const setModel = async (modelName: string) => {
    try {
      setIsLoading(true);
      await window.electron.ipc.invoke('ollama:set-model', { modelName });
      const model = models.find(m => m.name === modelName);
      if (model) {
        setCurrentModel(model);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set model');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModels();

    const unsubscribe = window.electron.ipc.on('ollama:model-loading-state', (state: ModelLoadingState) => {
      setLoadingState(state);
      if (state.status === 'loaded') {
        setIsLoading(false);
      } else if (state.status === 'loading') {
        setIsLoading(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    models,
    currentModel,
    isLoading,
    error,
    loadingState,
    loadModels,
    setModel
  };
} 