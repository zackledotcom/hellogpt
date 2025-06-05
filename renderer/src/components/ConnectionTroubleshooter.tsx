import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ServiceName } from '../types/services';

interface TroubleshootingStep {
  title: string;
  description: string;
  solution: string;
}

const ollamaTroubleshootingSteps: TroubleshootingStep[] = [
  {
    title: 'Ollama Not Running',
    description: 'The Ollama service is not running on your system.',
    solution: 'Start Ollama by running "ollama serve" in your terminal.',
  },
  {
    title: 'Wrong Endpoint',
    description: 'The application cannot connect to Ollama at the default endpoint.',
    solution: 'Verify that Ollama is running at http://localhost:11434',
  },
  {
    title: 'Model Not Found',
    description: 'The required model is not available in Ollama.',
    solution: 'Pull the required model using "ollama pull <model-name>"',
  },
  {
    title: 'Insufficient Resources',
    description: 'Your system does not meet the minimum requirements.',
    solution: 'Ensure you have at least 4GB RAM and 1GB free disk space.',
  },
];

interface ConnectionTroubleshooterProps {
  serviceName: ServiceName;
  onTestConnection: () => Promise<void>;
  onRetry: () => void;
}

export const ConnectionTroubleshooter: React.FC<ConnectionTroubleshooterProps> = ({
  serviceName,
  onTestConnection,
  onRetry,
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    setErrorMessage('');

    try {
      await onTestConnection();
      setTestResult('success');
    } catch (error) {
      setTestResult('error');
      setErrorMessage(error instanceof Error ? error.message : 'Connection test failed');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg p-6 max-w-lg w-full mx-4"
      >
        <h2 className="text-2xl font-bold mb-4">Connection Troubleshooter</h2>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-2">Common Issues</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Service not running</li>
              <li>Port conflicts</li>
              <li>Firewall blocking connection</li>
              <li>Incorrect configuration</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-2">Quick Checks</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Verify service is installed</li>
              <li>Check service is running</li>
              <li>Confirm port availability</li>
              <li>Validate configuration</li>
            </ul>
          </div>

          <div className="flex flex-col space-y-2">
            <button
              onClick={handleTest}
              disabled={isTesting}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>

            <button
              onClick={onRetry}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Retry Connection
            </button>
          </div>

          <AnimatePresence>
            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`p-4 rounded ${
                  testResult === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {testResult === 'success' ? (
                  <p>Connection test successful!</p>
                ) : (
                  <p>Connection test failed: {errorMessage}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}; 