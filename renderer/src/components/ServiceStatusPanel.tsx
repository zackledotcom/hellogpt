import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ServiceName, ServiceStatus } from '../types/services';
import { StatusIndicator } from './StatusIndicator';

interface ServiceState {
  status: ServiceStatus;
  lastCheck: number;
  error?: string;
}

interface ServiceStatusPanelProps {
  serviceStatuses: Map<ServiceName, ServiceState>;
  onRetry: (serviceName: ServiceName) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const serviceDescriptions: Record<ServiceName, string> = {
  ollama: 'Local LLM Service',
  embedding: 'Text Embedding Service',
  vectorStore: 'Vector Database',
  memory: 'Memory Management',
};

export const ServiceStatusPanel: React.FC<ServiceStatusPanelProps> = ({
  serviceStatuses,
  onRetry,
  isExpanded,
  onToggle,
}) => {
  return (
    <motion.div
      layout
      className="bg-white rounded-lg shadow-lg overflow-hidden"
    >
      <div className="p-4 border-b">
        <button
          onClick={onToggle}
          className="flex items-center justify-between w-full text-left"
        >
          <h2 className="text-lg font-semibold">Service Status</h2>
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="text-gray-500"
          >
            ▼
          </motion.span>
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {Array.from(serviceStatuses.entries()).map(([serviceName, state]) => (
                <div key={serviceName} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <StatusIndicator
                      serviceName={serviceName}
                      status={state.status}
                      lastCheck={state.lastCheck}
                      error={state.error}
                    />
                    <div>
                      <div className="font-medium capitalize">{serviceName}</div>
                      <div className="text-sm text-gray-500">
                        {serviceDescriptions[serviceName]}
                      </div>
                    </div>
                  </div>

                  {state.status !== 'operational' && (
                    <button
                      onClick={() => onRetry(serviceName)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      Retry
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}; 