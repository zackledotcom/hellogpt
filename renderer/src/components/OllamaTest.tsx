import { useEffect, useState } from 'react';
import type { OllamaModel, OllamaConnectionStatus, ModelLoadingState } from '@electron-app/types/ollama';

export function OllamaTest() {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<OllamaConnectionStatus | null>(null);
  const [loadingState, setLoadingState] = useState<ModelLoadingState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Test connection
    const checkConnection = async () => {
      try {
        const status = await window.electron.ollama.checkConnection();
        setConnectionStatus(status);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check connection');
      }
    };

    // List models
    const listModels = async () => {
      try {
        const { models } = await window.electron.ollama.listModels();
        setModels(models);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to list models');
      }
    };

    // Subscribe to model loading state changes
    const unsubscribe = window.electron.ollama.onModelLoadingStateChanged((state) => {
      setLoadingState(state);
    });

    checkConnection();
    listModels();

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Ollama API Test</h2>
      
      {/* Connection Status */}
      <div>
        <h3 className="font-semibold">Connection Status:</h3>
        {connectionStatus ? (
          <div className={`inline-block px-2 py-1 rounded ${
            connectionStatus.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {connectionStatus.connected ? 'Connected' : 'Disconnected'}
            {connectionStatus.error && <p className="text-sm">{connectionStatus.error}</p>}
          </div>
        ) : (
          <p>Checking connection...</p>
        )}
      </div>

      {/* Loading State */}
      {loadingState && (
        <div>
          <h3 className="font-semibold">Model Loading State:</h3>
          <div className="space-y-2">
            <p>Status: {loadingState.status}</p>
            {loadingState.isLoading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${loadingState.progress || 0}%` }}
                ></div>
              </div>
            )}
            {loadingState.error && (
              <p className="text-red-600">{loadingState.error}</p>
            )}
            {loadingState.modelName && (
              <p>Model: {loadingState.modelName}</p>
            )}
          </div>
        </div>
      )}

      {/* Models List */}
      <div>
        <h3 className="font-semibold">Available Models:</h3>
        {models.length > 0 ? (
          <ul className="space-y-2">
            {models.map((model) => (
              <li key={model.name} className="p-2 bg-gray-50 rounded">
                <p className="font-medium">{model.name}</p>
                <p className="text-sm text-gray-600">
                  Size: {(model.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-sm text-gray-600">
                  Format: {model.details.format}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No models found</p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-2 bg-red-100 text-red-800 rounded">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
} 