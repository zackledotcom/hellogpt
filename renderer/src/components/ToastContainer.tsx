import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toast } from './Toast';
import { ServiceName, ServiceStatus } from '../types/services';

interface Toast {
  id: string;
  serviceName: ServiceName;
  status: ServiceStatus;
  message: string;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            serviceName={toast.serviceName}
            status={toast.status}
            message={toast.message}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}; 