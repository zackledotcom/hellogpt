import { useState, useEffect } from 'react';
import { ModelLoadingState } from '../../../shared/ipcTypes';

export function useModelStatus(): ModelLoadingState {
  const [state, setState] = useState<ModelLoadingState>({
    isLoading: false,
    modelName: '',
    progress: 0,
    estimatedTimeRemaining: 0
  });

  useEffect(() => {
    const handleModelLoadingStateChanged = (newState: ModelLoadingState) => {
      setState(newState);
    };

    // Subscribe to model loading state changes
    window.electronAPI.onModelLoadingStateChanged(handleModelLoadingStateChanged);

    return () => {
      // Cleanup subscription
      window.electronAPI.offModelLoadingStateChanged(handleModelLoadingStateChanged);
    };
  }, []);

  return state;
} 