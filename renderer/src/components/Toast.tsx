import React from 'react';
import { motion } from 'framer-motion';
import { ServiceName, ServiceStatus } from '../types/services';

interface ToastProps {
  id: string;
  serviceName: ServiceName;
  status: ServiceStatus;
  message: string;
  onRemove: (id: string) => void;
}

const getStatusColor = (status: ServiceStatus): string => {
  switch (status) {
    case 'operational':
      return 'bg-green-500';
    case 'degraded':
      return 'bg-yellow-500';
    case 'unavailable':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusIcon = (status: ServiceStatus): string => {
  switch (status) {
    case 'operational':
      return '✓';
    case 'degraded':
      return '⚠';
    case 'unavailable':
      return '✕';
    default:
      return '•';
  }
};

export const Toast: React.FC<ToastProps> = ({
  id,
  serviceName,
  status,
  message,
  onRemove,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`flex items-center p-4 mb-4 rounded-lg shadow-lg ${getStatusColor(status)} text-white`}
    >
      <div className="flex-shrink-0 mr-3">
        <span className="text-xl">{getStatusIcon(status)}</span>
      </div>
      
      <div className="flex-grow">
        <h3 className="font-semibold capitalize">{serviceName}</h3>
        <p className="text-sm opacity-90">{message}</p>
      </div>

      <button
        onClick={() => onRemove(id)}
        className="ml-4 text-white hover:text-gray-200 focus:outline-none"
      >
        ×
      </button>
    </motion.div>
  );
}; 