import React from 'react';
import { motion } from 'framer-motion';
import { ServiceName, ServiceStatus } from '../types/services';

interface StatusIndicatorProps {
  serviceName: ServiceName;
  status: ServiceStatus;
  lastCheck?: number;
  error?: string;
  onClick?: () => void;
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

const getStatusTooltip = (status: ServiceStatus, error?: string): string => {
  switch (status) {
    case 'operational':
      return 'Service is operational';
    case 'degraded':
      return 'Service is degraded';
    case 'unavailable':
      return error || 'Service is unavailable';
    default:
      return 'Unknown status';
  }
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  serviceName,
  status,
  lastCheck,
  error,
  onClick,
}) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div className="relative inline-block">
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`w-3 h-3 rounded-full ${getStatusColor(status)} cursor-pointer`}
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      />

      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50"
        >
          <div className="font-semibold capitalize mb-1">{serviceName}</div>
          <div>{getStatusTooltip(status, error)}</div>
          {lastCheck && (
            <div className="text-xs opacity-75 mt-1">
              Last check: {new Date(lastCheck).toLocaleTimeString()}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}; 