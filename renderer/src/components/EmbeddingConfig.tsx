import React, { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import { useConfigStore } from '../stores/configStore';
import type { EmbeddingConfig } from '../types/embedding';

interface EmbeddingConfigProps {
  onConfigChange: (config: Partial<EmbeddingConfig>) => void;
}

const DEFAULT_CONFIG: EmbeddingConfig = {
  model: 'nomic-embed-text',
  modelParameters: {
    temperature: 0.7,
    topK: 40,
    topP: 0.9,
    contextWindow: 4096,
    repeatPenalty: 1.1,
    presencePenalty: 0.0,
    frequencyPenalty: 0.0,
    mirostatMode: 1,
    mirostatTau: 5.0,
    mirostatEta: 0.1,
  },
  batchSize: 32,
  normalize: true,
  truncateStrategy: 'NONE',
  maxTokens: 4096,
  chunkSize: 1000,
  chunkOverlap: 200,
  chunkStrategy: 'SENTENCE',
  enableCache: true,
  cacheSize: 2000,
  cacheTTL: 3600,
  parallelProcessing: true,
  maxConcurrentRequests: 4,
  timeout: 30000,
  minSimilarityThreshold: 0.7,
  maxResults: 5,
  rerankResults: true,
};

export const EmbeddingConfigPanel: React.FC<EmbeddingConfigProps> = ({ onConfigChange }) => {
  const [config, setConfig] = useState<EmbeddingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<'BALANCED' | 'FOCUSED' | 'CREATIVE' | 'PRECISE' | string>('BALANCED');
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const { customPresets, addCustomPreset, removeCustomPreset } = useConfigStore();

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const currentConfig = await window.electron.ipc.invoke('embedding:get-config');
        setConfig(currentConfig);
        setError(null);
      } catch (err) {
        setError('Failed to load configuration');
        console.error('Error loading config:', err);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handlePresetChange = (preset: 'BALANCED' | 'FOCUSED' | 'CREATIVE' | 'PRECISE' | string) => {
    if (!config) return;
    const newConfig = { ...config };
    
    if (preset in customPresets) {
      Object.assign(newConfig, customPresets[preset]);
    } else {
      switch (preset) {
        case 'FOCUSED':
          newConfig.modelParameters.temperature = 0.3;
          newConfig.modelParameters.topK = 20;
          newConfig.modelParameters.topP = 0.95;
          newConfig.minSimilarityThreshold = 0.8;
          newConfig.maxResults = 3;
          break;
        case 'CREATIVE':
          newConfig.modelParameters.temperature = 0.9;
          newConfig.modelParameters.topK = 60;
          newConfig.modelParameters.topP = 0.85;
          newConfig.minSimilarityThreshold = 0.6;
          newConfig.maxResults = 8;
          break;
        case 'PRECISE':
          newConfig.modelParameters.temperature = 0.2;
          newConfig.modelParameters.topK = 10;
          newConfig.modelParameters.topP = 0.98;
          newConfig.minSimilarityThreshold = 0.9;
          newConfig.maxResults = 2;
          break;
        default: // BALANCED
          newConfig.modelParameters.temperature = 0.7;
          newConfig.modelParameters.topK = 40;
          newConfig.modelParameters.topP = 0.9;
          newConfig.minSimilarityThreshold = 0.7;
          newConfig.maxResults = 5;
      }
    }
    setConfig(newConfig);
    setActivePreset(preset);
    onConfigChange(newConfig);
  };

  const handleReset = () => {
    if (!config) return;
    const newConfig = { ...DEFAULT_CONFIG };
    setConfig(newConfig);
    setActivePreset('BALANCED');
    onConfigChange(newConfig);
  };

  const handleSavePreset = () => {
    if (!config || !newPresetName.trim()) return;
    addCustomPreset(newPresetName.trim(), config);
    setActivePreset(newPresetName.trim());
    setShowSavePreset(false);
    setNewPresetName('');
  };

  const handleDeletePreset = (presetName: string) => {
    removeCustomPreset(presetName);
    if (activePreset === presetName) {
      handlePresetChange('BALANCED');
    }
  };

  const handleModelParamChange = (param: keyof EmbeddingConfig['modelParameters'], value: number) => {
    if (!config) return;
    const newConfig = {
      ...config,
      modelParameters: {
        ...config.modelParameters,
        [param]: value,
      },
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleNumericChange = (key: keyof EmbeddingConfig, value: number) => {
    if (!config) return;
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleToggle = (key: keyof EmbeddingConfig, value: boolean) => {
    if (!config) return;
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-6 bg-white rounded-lg shadow animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 space-y-6 bg-white rounded-lg shadow">
        <div className="text-red-600">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="p-4 space-y-6 bg-white rounded-lg shadow">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Personality Presets</h3>
          <div className="space-x-2">
            <button
              onClick={() => setShowSavePreset(true)}
              className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Save Current
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-700"
            >
              Reset to Default
            </button>
          </div>
        </div>

        {showSavePreset && (
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Preset name"
              className="flex-1 px-3 py-1 text-sm border rounded-md"
            />
            <button
              onClick={handleSavePreset}
              disabled={!newPresetName.trim()}
              className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowSavePreset(false);
                setNewPresetName('');
              }}
              className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {(['BALANCED', 'FOCUSED', 'CREATIVE', 'PRECISE'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetChange(preset)}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activePreset === preset
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {preset.charAt(0) + preset.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {Object.keys(customPresets).length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Custom Presets</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(customPresets).map((presetName) => (
                <div key={presetName} className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePresetChange(presetName)}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
                      activePreset === presetName
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {presetName}
                  </button>
                  <button
                    onClick={() => handleDeletePreset(presetName)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Model Parameters</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Temperature</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.modelParameters.temperature}
              onChange={(e) => handleModelParamChange('temperature', parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-500">{config.modelParameters.temperature}</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Top K</label>
            <input
              type="range"
              min="1"
              max="100"
              value={config.modelParameters.topK}
              onChange={(e) => handleModelParamChange('topK', parseInt(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-500">{config.modelParameters.topK}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Processing Options</h3>
        <div className="space-y-2">
          <Switch.Group>
            <div className="flex items-center justify-between">
              <Switch.Label className="text-sm font-medium text-gray-700">Normalize Embeddings</Switch.Label>
              <Switch
                checked={config.normalize}
                onChange={(checked) => handleToggle('normalize', checked)}
                className={`${
                  config.normalize ? 'bg-blue-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    config.normalize ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>
          </Switch.Group>

          <Switch.Group>
            <div className="flex items-center justify-between">
              <Switch.Label className="text-sm font-medium text-gray-700">Rerank Results</Switch.Label>
              <Switch
                checked={config.rerankResults}
                onChange={(checked) => handleToggle('rerankResults', checked)}
                className={`${
                  config.rerankResults ? 'bg-blue-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    config.rerankResults ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>
          </Switch.Group>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Quality Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Similarity Threshold</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.minSimilarityThreshold}
              onChange={(e) => handleNumericChange('minSimilarityThreshold', parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-500">{config.minSimilarityThreshold}</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Results</label>
            <input
              type="range"
              min="1"
              max="20"
              value={config.maxResults}
              onChange={(e) => handleNumericChange('maxResults', parseInt(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-500">{config.maxResults}</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 