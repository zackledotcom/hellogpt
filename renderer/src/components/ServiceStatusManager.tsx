import React, { useEffect, useState } from 'react';
import { ServiceName, ServiceState, ServiceToast } from '../types/services';
import { IpcMessageMap } from '../types/ipc';

export const ServiceStatusManager: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [serviceStatuses, setServiceStatuses] = useState<Map<ServiceName, ServiceState>>(new Map());
  const [toasts, setToasts] = useState<ServiceToast[]>([]);

  useEffect(() => {
    const checkServices = async () => {
      try {
        const statuses = await window.electron.ipc.invoke('app:health-check', undefined);
        if (statuses && typeof statuses === 'object') {
          const newStatuses = new Map<ServiceName, ServiceState>();
          Object.entries(statuses).forEach(([service, state]) => {
            newStatuses.set(service as ServiceName, state as ServiceState);
          });
          setServiceStatuses(newStatuses);

          // Create toasts for services with errors
          const newToasts: ServiceToast[] = [];
          newStatuses.forEach((state, service) => {
            if (state.status === 'error' || state.status === 'unavailable') {
              newToasts.push({
                id: `${service}-${Date.now()}`,
                message: `${service} service is ${state.status}`,
                type: state.status,
              });
            }
          });
          setToasts(newToasts);
        }
      } catch (error) {
        console.error('Failed to check service status:', error);
      }
    };

    checkServices();
    const interval = setInterval(checkServices, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (service: ServiceName) => {
    try {
      await window.electron.ipc.invoke('app:retry-service', service);
      // Status will be updated on next health check
    } catch (error) {
      console.error(`Failed to retry ${service} service:`, error);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-40">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b">
            <button
              className="flex items-center justify-between w-full text-left"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <h2 className="text-lg font-semibold">Service Status</h2>
              <span className="text-gray-500">{isExpanded ? '▼' : '▶'}</span>
            </button>
          </div>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="p-4 space-y-4">
              {Array.from(serviceStatuses.entries()).map(([service, state]) => (
                <div key={service} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative inline-block">
                      <div
                        className={`w-3 h-3 rounded-full cursor-pointer ${
                          state.status === 'ok'
                            ? 'bg-green-500'
                            : state.status === 'degraded'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        tabIndex={0}
                      />
                    </div>
                    <div>
                      <div className="font-medium capitalize">{service}</div>
                      <div className="text-sm text-gray-500">
                        {service === 'ollama'
                          ? 'Local LLM Service'
                          : service === 'embedding'
                          ? 'Text Embedding Service'
                          : service === 'vectorStore'
                          ? 'Vector Database'
                          : 'Memory Management'}
                      </div>
                    </div>
                  </div>
                  {state.status !== 'ok' && (
                    <button
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      onClick={() => handleRetry(service)}
                    >
                      Retry
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center p-4 mb-4 rounded-lg shadow-lg ${
              toast.type === 'error' || toast.type === 'unavailable'
                ? 'bg-red-500'
                : 'bg-yellow-500'
            } text-white animate-slide-up`}
          >
            <div className="flex-shrink-0 mr-3">
              <span className="text-xl">•</span>
            </div>
            <div className="flex-grow">
              <h3 className="font-semibold capitalize">{toast.type}</h3>
              <p className="text-sm opacity-90">{toast.message}</p>
            </div>
            <button
              className="ml-4 text-white hover:text-gray-200 focus:outline-none"
              onClick={() => removeToast(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="fixed bottom-4 left-4 z-40 space-x-2">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          onClick={() => window.electron.ipc.invoke('app:show-setup-guide', undefined)}
        >
          Setup Guide
        </button>
        <button
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
          onClick={() => window.electron.ipc.invoke('app:show-troubleshooter', undefined)}
        >
          Troubleshoot
        </button>
      </div>
    </>
  );
}; 