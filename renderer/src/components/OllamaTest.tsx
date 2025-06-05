import React, { useState, useEffect } from 'react';
import type { OllamaModel, ModelLoadingState } from '@electron-app/types/ollama';

export default function OllamaTest() {
  const [isConnected, setIsConnected] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isSubscribed = true;
    let unsubscribe: (() => void) | undefined;

    const checkConnection = async () => {
      try {
        const models = await window.electron.ollama.listModels();
        if (isSubscribed) {
          setIsConnected(true);
          setModels(models.map(model => model.name));
          setError(null);
        }
      } catch (err) {
        if (isSubscribed) {
          setIsConnected(false);
          setError(err instanceof Error ? err.message : 'Failed to connect to Ollama');
        }
      }
    };

    checkConnection();

    // Subscribe to model loading state changes
    if (window.electron.ollama.onModelLoadingStateChanged) {
      unsubscribe = window.electron.ollama.onModelLoadingStateChanged((state: ModelLoadingState) => {
        if (isSubscribed) {
          setIsLoading(state.isLoading);
        }
      });
    }

    return () => {
      isSubscribed = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Ollama API Test</h2>
      <div className="space-y-4">
        <div>
          <p className="font-semibold">Connection Status:</p>
          <p className={isConnected ? 'text-green-500' : 'text-red-500'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </p>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
        <div>
          <p className="font-semibold">Available Models:</p>
          <p>{models.length > 0 ? models.join(', ') : 'No models found'}</p>
        </div>
        {isLoading && (
          <div className="text-blue-500">
            Loading...
          </div>
        )}
      </div>
    </div>
  );
} 