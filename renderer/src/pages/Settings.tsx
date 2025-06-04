import React, { useState } from 'react';
import { EmbeddingConfigPanel } from '../components/EmbeddingConfig';
import { PerformanceStats } from '../components/PerformanceStats';
import type { EmbeddingConfig as EmbeddingConfigType } from '../types/embedding';
import { validateConfig, getConfigValidationMessage } from '../utils/configValidation';

export const Settings: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleConfigChange = async (config: Partial<EmbeddingConfigType>) => {
    try {
      // Validate configuration
      const validationErrors = validateConfig(config);
      if (validationErrors.length > 0) {
        setError(getConfigValidationMessage(validationErrors));
        return;
      }

      setIsSaving(true);
      setError(null);
      setSuccess(false);
      await window.electron.ipc.invoke('embedding:update-config', config);
      setSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError('Failed to update configuration. Please try again.');
      console.error('Failed to update embedding config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 whitespace-pre-line">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600">Settings saved successfully!</p>
        </div>
      )}
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Personality</h2>
          <p className="text-gray-600 mb-4">
            Customize how the AI behaves in conversations. Choose a preset or fine-tune the settings to match your preferences.
          </p>
          <div className="relative">
            {isSaving && (
              <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            <EmbeddingConfigPanel onConfigChange={handleConfigChange} />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance</h2>
          <p className="text-gray-600 mb-4">
            Monitor the performance of the embedding model and adjust settings for optimal results.
          </p>
          <PerformanceStats />
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Preset Descriptions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Balanced</h3>
              <p className="text-gray-600">
                A well-rounded personality that balances accuracy, creativity, and efficiency. Good for general conversations.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Focused</h3>
              <p className="text-gray-600">
                Stays strictly on topic with concise, accurate responses. Ideal for technical discussions and problem-solving.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Creative</h3>
              <p className="text-gray-600">
                More expressive and imaginative responses. Great for brainstorming and creative writing.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Precise</h3>
              <p className="text-gray-600">
                Highly accurate and detailed responses. Perfect for research and analysis.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tips</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Lower temperature values (0.2-0.4) make responses more focused and deterministic</li>
            <li>Higher temperature values (0.7-0.9) allow for more creative and diverse responses</li>
            <li>Enable "Rerank Results" for more accurate and relevant responses</li>
            <li>Adjust the similarity threshold to control how closely responses match the context</li>
            <li>Use the "Focused" preset for technical discussions and the "Creative" preset for brainstorming</li>
            <li>Monitor performance metrics to optimize batch size and caching settings</li>
            <li>Higher batch sizes improve throughput but increase memory usage</li>
            <li>Enable caching for frequently used embeddings to improve response time</li>
          </ul>
        </section>
      </div>
    </div>
  );
}; 