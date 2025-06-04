import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModelStatus } from '@/hooks/useModelStatus';
import { X, Loader2 } from 'lucide-react';

interface ProgressBarProps {
  value: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value }) => {
  return (
    <div className="w-full h-2 glass rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-mint/20"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
};

const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.ceil(seconds)} seconds`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.ceil(seconds % 60);
  return `${minutes} minute${minutes > 1 ? 's' : ''}${remainingSeconds > 0 ? ` ${remainingSeconds} seconds` : ''}`;
};

export const ModelLoadingOverlay: React.FC = () => {
  const { isLoading, modelName, progress, estimatedTimeRemaining, error } = useModelStatus();

  if (!isLoading) return null;

  const handleCancel = () => {
    // TODO: Implement cancel functionality through IPC
    window.electron.ipc.invoke('ollama:cancel-load', undefined);
  };

  return (
    <div className="absolute inset-0 glass backdrop-blur-glass flex items-center justify-center">
      <div className="glass p-6 rounded-xl shadow-glass flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-mint" />
        <p className="text-sm text-foreground">Processing...</p>
        {progress !== undefined && (
          <div className="w-full max-w-xs">
            <ProgressBar value={progress} />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {estimatedTimeRemaining !== undefined && formatTime(estimatedTimeRemaining)}
            </p>
          </div>
        )}
        <button
          onClick={handleCancel}
          className="btn btn-ghost p-2 mt-2"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
