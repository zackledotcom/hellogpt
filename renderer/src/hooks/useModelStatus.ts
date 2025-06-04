import { useState, useEffect } from 'react';
import type { ModelLoadingState } from '@/types/ipc';

export function useModelStatus() {
  const [isLoading, setIsLoading] = useState(false);
  const [modelName, setModelName] = useState<string | undefined>();
  const [progress, setProgress] = useState<number | undefined>();
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const unsubscribe = window.electronAPI.ollama.onModelLoadingStateChanged((newState: ModelLoadingState) => {
      setIsLoading(newState.isLoading);
      setModelName(newState.modelName);
      setProgress(newState.progress);
      setEstimatedTimeRemaining(newState.estimatedTimeRemaining);
      setError(newState.error);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isLoading,
    modelName,
    progress,
    estimatedTimeRemaining,
    error,
  };
} 