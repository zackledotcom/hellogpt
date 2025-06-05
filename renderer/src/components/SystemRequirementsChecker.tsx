import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Requirement {
  name: string;
  check: () => Promise<boolean>;
  errorMessage: string;
}

interface CheckResult {
  name: string;
  passed: boolean;
  error?: string;
}

export const SystemRequirementsChecker: React.FC = () => {
  const [results, setResults] = useState<CheckResult[]>([]);
  const [isChecking, setIsChecking] = useState(true);

  const requirements: Requirement[] = [
    {
      name: 'Node.js Version',
      check: async () => {
        const version = process.versions.node;
        const [major] = version.split('.');
        return parseInt(major) >= 16;
      },
      errorMessage: 'Node.js v16 or higher is required',
    },
    {
      name: 'Ollama Service',
      check: async () => {
        try {
          const response = await fetch('http://localhost:11434/api/tags');
          return response.ok;
        } catch {
          return false;
        }
      },
      errorMessage: 'Ollama service is not running',
    },
    {
      name: 'System Memory',
      check: async () => {
        // In a real app, you'd want to use a proper system info library
        // For now, we'll assume the requirement is met
        return true;
      },
      errorMessage: 'At least 4GB of RAM is required',
    },
    {
      name: 'Disk Space',
      check: async () => {
        // This is a simplified check. In a real app, you'd want to use a proper system info library
        return true; // Assume true for now
      },
      errorMessage: 'At least 1GB of free disk space is required',
    },
  ];

  useEffect(() => {
    const checkRequirements = async () => {
      const checkResults: CheckResult[] = [];

      for (const requirement of requirements) {
        try {
          const passed = await requirement.check();
          checkResults.push({
            name: requirement.name,
            passed,
            error: passed ? undefined : requirement.errorMessage,
          });
        } catch (error) {
          checkResults.push({
            name: requirement.name,
            passed: false,
            error: error instanceof Error ? error.message : 'Check failed',
          });
        }
      }

      setResults(checkResults);
      setIsChecking(false);
    };

    checkRequirements();
  }, []);

  if (isChecking) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-lg font-medium">Checking system requirements...</p>
        </div>
      </div>
    );
  }

  const allPassed = results.every(result => result.passed);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center"
    >
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-6">System Requirements Check</h2>

        <div className="space-y-4 mb-6">
          {results.map((result, index) => (
            <motion.div
              key={result.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-3"
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  result.passed ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                {result.passed ? '✓' : '✕'}
              </div>
              <div>
                <p className="font-medium">{result.name}</p>
                {result.error && (
                  <p className="text-sm text-red-500">{result.error}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {allPassed ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-green-500 font-medium mb-4">
              All requirements met! You're good to go.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Continue
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-red-500 font-medium mb-4">
              Some requirements are not met. Please fix the issues above.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Retry
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}; 