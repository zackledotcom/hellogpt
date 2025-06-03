import React from 'react';
import { useModelStatus } from '../hooks/useModelStatus';

interface ProgressBarProps {
  value: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value }) => {
  return (
    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300 ease-in-out"
        style={{ width: `${value}%` }}
      />
    </div>
  );
};

const OllamaLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M24 4C12.954 4 4 12.954 4 24C4 35.046 12.954 44 24 44C35.046 44 44 35.046 44 24C44 12.954 35.046 4 24 4ZM24 40C15.163 40 8 32.837 8 24C8 15.163 15.163 8 24 8C32.837 8 40 15.163 40 24C40 32.837 32.837 40 24 40Z"
      fill="currentColor"
    />
    <path
      d="M24 12C17.373 12 12 17.373 12 24C12 30.627 17.373 36 24 36C30.627 36 36 30.627 36 24C36 17.373 30.627 12 24 12ZM24 32C19.582 32 16 28.418 16 24C16 19.582 19.582 16 24 16C28.418 16 32 19.582 32 24C32 28.418 28.418 32 24 32Z"
      fill="currentColor"
    />
  </svg>
);

const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)} seconds`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes} minute${minutes > 1 ? 's' : ''}${remainingSeconds > 0 ? ` ${remainingSeconds} seconds` : ''}`;
};

export const ModelLoadingOverlay: React.FC = () => {
  const { isLoading, modelName, progress, estimatedTimeRemaining, error } = useModelStatus();

  if (!isLoading) return null;

  const handleCancel = () => {
    // TODO: Implement cancel functionality
    console.log('Cancel model loading');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-blue-600 dark:text-blue-400">
            <OllamaLogo className="animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Loading {modelName}
          </h3>
          <div className="w-full">
            <ProgressBar value={progress} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {estimatedTimeRemaining > 0
              ? `About ${formatTime(estimatedTimeRemaining)} remaining`
              : 'Initializing model...'}
          </p>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <button
            onClick={handleCancel}
            className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelLoadingOverlay; 