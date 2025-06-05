import { useState, useEffect } from 'react';
import type { ServiceName, ServiceState, ServiceStatus } from '../types/services';

export function useServiceStatus() {
  const [serviceStates, setServiceStates] = useState<Record<ServiceName, ServiceState>>({
    ollama: { status: 'unavailable' as ServiceStatus, lastCheck: Date.now() },
    embedding: { status: 'unavailable' as ServiceStatus, lastCheck: Date.now() },
    vectorStore: { status: 'unavailable' as ServiceStatus, lastCheck: Date.now() },
    memory: { status: 'unavailable' as ServiceStatus, lastCheck: Date.now() }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkServiceStatus = async () => {
    try {
      setIsLoading(true);
      const status = await window.electron.ipc.invoke('app:health-check', undefined);
      setServiceStates(status);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check service status');
    } finally {
      setIsLoading(false);
    }
  };

  const retryService = async (serviceName: ServiceName) => {
    try {
      setIsLoading(true);
      await window.electron.ipc.invoke('app:retry-service', { serviceName });
      await checkServiceStatus();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry service');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkServiceStatus();

    const unsubscribe = window.electron.ipc.on('app:service-status-changed', (status: Record<ServiceName, ServiceState>) => {
      setServiceStates(status);
    });

    const interval = setInterval(checkServiceStatus, 30000);
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  return {
    serviceStates,
    isLoading,
    error,
    checkServiceStatus,
    retryService
  };
} 