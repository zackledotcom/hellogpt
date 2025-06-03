import { useState, useEffect } from 'react';
import type { ModelLoadingState } from '../types/ipc';

export function useModelStatus() {
  const [state, setState] = useState<ModelLoadingState>({
    isLoading: false,
    modelName: '',
    progress: 0,
    estimatedTimeRemaining: 0
  });

  useEffect(() => {
    const unsubscribe = window.electronAPI.onModelLoadingStateChanged((newState: ModelLoadingState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return state;
} 