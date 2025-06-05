import { useState, useEffect } from 'react';
import type { EmbeddingConfig } from '../types/embedding';

export function useEmbedding() {
  const [config, setConfig] = useState<EmbeddingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const loadedConfig = await window.electron.ipc.invoke('embedding:get-config', undefined);
      setConfig(loadedConfig);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load embedding config');
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = async (newConfig: Partial<EmbeddingConfig>) => {
    try {
      setIsLoading(true);
      const updatedConfig = await window.electron.ipc.invoke('embedding:update-config', newConfig);
      setConfig(updatedConfig);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update embedding config');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();

    const unsubscribe = window.electron.ipc.on('embedding:config-updated', (updatedConfig: EmbeddingConfig) => {
      setConfig(updatedConfig);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    config,
    isLoading,
    error,
    loadConfig,
    updateConfig
  };
} 