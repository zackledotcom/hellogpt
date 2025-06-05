import React from 'react';
import { motion } from 'framer-motion';

interface OllamaSetupGuideProps {
  onClose: () => void;
}

export const OllamaSetupGuide: React.FC<OllamaSetupGuideProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Ollama Setup Guide</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold mb-3">System Requirements</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>macOS, Linux, or Windows with WSL2</li>
              <li>4GB RAM minimum (8GB recommended)</li>
              <li>1GB free disk space</li>
              <li>Node.js 16 or higher</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">Installation Steps</h3>
            <ol className="list-decimal list-inside space-y-4 text-gray-700">
              <li>
                <div className="font-medium">Install Ollama</div>
                <p className="ml-6 mt-1">
                  Download and install Ollama from{' '}
                  <a
                    href="https://ollama.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600"
                  >
                    https://ollama.ai
                  </a>
                </p>
              </li>
              <li>
                <div className="font-medium">Start Ollama Service</div>
                <p className="ml-6 mt-1">
                  Open a terminal and run:
                  <code className="block bg-gray-100 p-2 rounded mt-2 font-mono text-sm">
                    ollama serve
                  </code>
                </p>
              </li>
              <li>
                <div className="font-medium">Pull Required Models</div>
                <p className="ml-6 mt-1">
                  In a new terminal, run:
                  <code className="block bg-gray-100 p-2 rounded mt-2 font-mono text-sm">
                    ollama pull llama2
                  </code>
                </p>
              </li>
            </ol>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">Troubleshooting</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium mb-2">Service Not Starting</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Verify Ollama is installed correctly</li>
                  <li>Check if port 11434 is available</li>
                  <li>Check system logs for errors</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium mb-2">Model Loading Issues</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Ensure sufficient disk space</li>
                  <li>Check internet connection</li>
                  <li>Try pulling the model again</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium mb-2">Performance Issues</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Increase system swap space</li>
                  <li>Close resource-intensive applications</li>
                  <li>Consider using a smaller model</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">Configuration</h3>
            <p className="text-gray-700">
              You can adjust Ollama settings in the application settings panel:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mt-2">
              <li>Model selection</li>
              <li>API endpoint configuration</li>
              <li>Performance settings</li>
              <li>Memory allocation</li>
            </ul>
          </section>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}; 