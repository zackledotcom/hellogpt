import React, { useEffect, useState } from 'react';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import ChatContainer from './ChatContainer';
import MemoryChat from './MemoryChat';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '../contexts/ThemeContext';
import ErrorBoundary from './ErrorBoundary';

interface Model {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export const AppLayout: React.FC = () => {
  const { theme } = useTheme();
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      if (window.ollama?.listModels) {
        try {
          const response = await window.ollama.listModels();
          setModels(response.models);
          if (response.models.length > 0) {
            setSelectedModel(response.models[0].name);
          }
        } catch (err) {
          setError('Failed to fetch models');
          console.error('Error fetching models:', err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setError('Ollama API not exposed in preload script.');
        setIsLoading(false);
        console.error('Ollama API not exposed.');
      }
    };

    fetchModels();
  }, []);

  const handleModelChange = async (modelName: string) => {
    if (window.ollama?.setModel) {
      try {
        await window.ollama.setModel(modelName);
        setSelectedModel(modelName);
      } catch (err) {
        setError('Failed to set model');
        console.error('Error setting model:', err);
      }
    } else {
      setError('Ollama API not exposed in preload script.');
      console.error('Ollama API not exposed.');
    }
  };

  return (
    <ThemeProvider>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              HelloGPT
            </h1>
            <ThemeToggle />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                <div className="mb-6">
                  <label
                    htmlFor="model-select"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Select Model
                  </label>
                  <select
                    id="model-select"
                    value={selectedModel}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-blue-500 focus:border-indigo-500 dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <option>Loading models...</option>
                    ) : error ? (
                      <option>Error loading models</option>
                    ) : (
                      models.map((model) => (
                        <option key={model.name} value={model.name}>
                          {model.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {models.map((model) => (
                    <div
                      key={model.name}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {model.name}
                      </h3>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Size</p>
                          <p className="text-gray-900 dark:text-white">
                            {(model.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Modified</p>
                          <p className="text-gray-900 dark:text-white">
                            {new Date(model.modified_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Format</p>
                          <p className="text-gray-900 dark:text-white">
                            {model.details.format}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Family</p>
                          <p className="text-gray-900 dark:text-white">
                            {model.details.family}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <MemoryChat />
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-[calc(100vh-12rem)]">
                <ErrorBoundary>
                  <ChatContainer />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default AppLayout; 