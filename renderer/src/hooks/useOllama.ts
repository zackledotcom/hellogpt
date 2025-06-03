import { useState, useCallback, useEffect } from 'react';
import type { ChatMessage, ChatResponse, OllamaModel, OllamaConnectionStatus, AppStatus, IpcMessageMap } from '../types/ipc';

declare global {
  interface Window {
    electron: {
      ipc: {
        invoke: <K extends keyof IpcMessageMap>(
          channel: K,
          request: IpcMessageMap[K]['request']
        ) => Promise<IpcMessageMap[K]['response']>;
        on: <K extends string>(
          channel: K,
          callback: (...args: any[]) => void
        ) => () => void;
      };
    };
  }
}

export function useOllama() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthScore, setHealthScore] = useState(100);

  // Health check
  const checkHealth = useCallback(async () => {
    try {
      const status = await window.electron.ipc.invoke('app:health-check', undefined);
      setIsConnected(status.status === 'healthy');
      setCurrentModel(status.details?.currentModel || '');
      setHealthScore(status.details?.healthScore || 100);
    } catch (err) {
      setIsConnected(false);
      setError(err instanceof Error ? err.message : 'Failed to check health');
      setHealthScore(0);
    }
  }, []);

  // List models
  const listModels = useCallback(async () => {
    try {
      const { models } = await window.electron.ipc.invoke('ollama:list-models', undefined);
      setAvailableModels(models);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list models');
    }
  }, []);

  // Set model
  const setModel = useCallback(async (modelName: string) => {
    try {
      await window.electron.ipc.invoke('ollama:set-model', { modelName });
      setCurrentModel(modelName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set model');
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (message: ChatMessage): Promise<ChatResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      return await window.electron.ipc.invoke('chat:send-message', message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send message stream
  const sendMessageStream = useCallback((
    message: ChatMessage,
    callbacks: {
      onChunk: (chunk: string) => void;
      onError: (error: string) => void;
      onComplete: () => void;
    }
  ) => {
    setIsLoading(true);
    setError(null);

    const cleanup = [
      window.electron.ipc.on('chat:stream-chunk', callbacks.onChunk),
      window.electron.ipc.on('chat:stream-error', callbacks.onError),
      window.electron.ipc.on('chat:stream-complete', () => {
        setIsLoading(false);
        callbacks.onComplete();
      })
    ];

    window.electron.ipc.invoke('chat:send-message-stream', message).catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      callbacks.onError(err instanceof Error ? err.message : 'Failed to send message');
      setIsLoading(false);
    });

    return () => cleanup.forEach(fn => fn());
  }, []);

  // Initial setup
  useEffect(() => {
    checkHealth();
    listModels();

    // Set up health check interval
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth, listModels]);

  return {
    isConnected,
    currentModel,
    availableModels,
    isLoading,
    error,
    sendMessage,
    sendMessageStream,
    setModel,
    checkHealth,
    listModels,
    healthScore
  };
} 