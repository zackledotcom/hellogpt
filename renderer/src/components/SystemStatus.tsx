import React from 'react';
import { motion } from 'framer-motion';
import { ServiceName, ServiceState } from '../types/services';
import { StatusIndicator } from './StatusIndicator';

interface SystemStatusProps {
  serviceStatuses: Map<ServiceName, ServiceState>;
  onRetry: (serviceName: ServiceName) => void;
}

const serviceLabels: Record<ServiceName, string> = {
  ollama: 'Ollama Service',
  embedding: 'Embedding Service',
  vectorStore: 'Vector Store',
  memory: 'Memory Service',
};

export const SystemStatus: React.FC<SystemStatusProps> = ({ serviceStatuses, onRetry }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">System Status</h2>
      
      <div className="space-y-4">
        {Array.from(serviceStatuses.entries()).map(([serviceName, state]) => (
          <motion.div
            key={serviceName}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <StatusIndicator
              serviceName={serviceLabels[serviceName]}
              status={state.status}
              error={state.error}
            />
            
            {state.status !== 'operational' && (
              <button
                onClick={() => onRetry(serviceName)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Retry
              </button>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">System Requirements</h3>
        <ul className="space-y-2">
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            <span>Node.js v16 or higher</span>
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            <span>Ollama v0.1.0 or higher</span>
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            <span>4GB RAM minimum</span>
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            <span>1GB free disk space</span>
          </li>
        </ul>
      </div>
    </div>
  );
}; 