import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOllama } from '../hooks/useOllama';
import { useModelStatus } from '../hooks/useModelStatus';
import { Plug, Unplug, ChevronDown, AlertCircle, CheckCircle2, Loader2, BatteryFull, BatteryMedium, BatteryLow } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const {
    isConnected,
    currentModel,
    availableModels,
    isLoading,
    error,
    setModel,
    checkHealth,
    healthScore = 100 // Default to 100 if not provided
  } = useOllama();

  const {
    isLoading: isModelLoading,
    modelName: loadingModelName,
    progress,
    estimatedTimeRemaining,
    error: modelError
  } = useModelStatus();

  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [lastHealthCheck, setLastHealthCheck] = useState<number>(Date.now());

  const handleModelSelect = useCallback(async (modelName: string) => {
    await setModel(modelName);
    setIsModelMenuOpen(false);
  }, [setModel]);

  const handleHealthCheck = useCallback(async () => {
    await checkHealth();
    setLastHealthCheck(Date.now());
  }, [checkHealth]);

  const getStatusIcon = () => {
    if (isModelLoading) return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    if (isLoading) return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    if (error || modelError) return <AlertCircle className="w-4 h-4 text-red-500" />;
    return isConnected ? <Plug className="w-4 h-4 text-green-500" /> : <Unplug className="w-4 h-4 text-gray-500" />;
  };

  const getBatteryIcon = () => {
    if (healthScore > 66) return (
      <div title="Healthy">
        <BatteryFull className="w-4 h-4 text-green-500" />
      </div>
    );
    if (healthScore > 33) return (
      <div title="Moderate health">
        <BatteryMedium className="w-4 h-4 text-yellow-500" />
      </div>
    );
    return (
      <div title="Low health - reduce input size or restart model">
        <BatteryLow className="w-4 h-4 text-red-500" />
      </div>
    );
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <motion.div
              animate={{ scale: isConnected ? 1 : [1, 1.1, 1] }}
              className="flex items-center space-x-1.5"
            >
              {getStatusIcon()}
              <span className="text-sm font-medium text-gray-300">
                {isModelLoading 
                  ? `Loading ${loadingModelName} (${progress}%)`
                  : isLoading 
                    ? 'Checking...' 
                    : isConnected 
                      ? 'Connected' 
                      : 'Disconnected'}
              </span>
            </motion.div>
            {(error || modelError) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs text-red-400 max-w-[200px] truncate"
              >
                {error || modelError}
              </motion.div>
            )}
            {isModelLoading && estimatedTimeRemaining > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs text-gray-400"
              >
                {Math.ceil(estimatedTimeRemaining)}s remaining
              </motion.div>
            )}
          </div>

          {/* Model Selection */}
          <div className="relative">
            <button
              onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-gray-800/50 hover:bg-gray-800 transition-colors"
              disabled={isModelLoading}
            >
              <span className="text-sm font-medium text-gray-200">{currentModel || 'Select Model'}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isModelMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full right-0 mb-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50"
                >
                  <div className="max-h-60 overflow-y-auto">
                    {availableModels.map((model) => (
                      <button
                        key={model.name}
                        onClick={() => handleModelSelect(model.name)}
                        className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-700/50 transition-colors ${
                          model.name === currentModel ? 'bg-gray-700/50 text-blue-400' : 'text-gray-200'
                        }`}
                        disabled={isModelLoading}
                      >
                        <div className="flex items-center justify-between">
                          <span>{model.name}</span>
                          {model.name === currentModel && (
                            <CheckCircle2 className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {model.details.parameter_size} • {model.details.quantization_level}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Health Check */}
          <div className="flex items-center space-x-2">
            {getBatteryIcon()}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleHealthCheck}
              className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
              disabled={isModelLoading}
            >
              Last check: {new Date(lastHealthCheck).toLocaleTimeString()}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};