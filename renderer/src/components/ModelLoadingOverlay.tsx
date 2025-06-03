import React from 'react';
import { motion } from 'framer-motion';

interface ModelLoadingOverlayProps {
  modelName: string;
  progress: number; // 0–100
  estimatedTimeRemaining: number; // in seconds
  error?: string;
}

export const ModelLoadingOverlay: React.FC<ModelLoadingOverlayProps> = ({
  modelName,
  progress,
  estimatedTimeRemaining,
  error
}) => {
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center">
      <motion.div
        className="bg-zinc-900 text-white rounded-xl p-6 max-w-md w-full shadow-xl border border-zinc-700"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <h3 className="text-xl font-semibold mb-2 tracking-tight">
          Initializing Model: <span className="text-blue-400">{modelName}</span>
        </h3>

        {error ? (
          <div className="text-red-400 mt-4 font-mono">{error}</div>
        ) : (
          <>
            <div className="w-full bg-zinc-800 rounded-full h-2.5 mb-3 overflow-hidden">
              <motion.div
                className="bg-blue-500 h-2.5"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <p className="text-sm text-zinc-400 font-mono">
              {progress.toFixed(1)}% • ETA: {formatTime(estimatedTimeRemaining)}
            </p>

            <motion.div
              className="mt-3 text-xs text-zinc-500 italic"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              Optimizing weights, loading tensors, allocating context window...
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
};
