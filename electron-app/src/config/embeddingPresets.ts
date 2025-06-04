import type { EmbeddingConfig } from '../services/EmbeddingService';

const BALANCED_PRESET: EmbeddingConfig = {
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

export const CHATGPT_PRESETS = {
  BALANCED: BALANCED_PRESET,

  FOCUSED: {
    ...BALANCED_PRESET,
    modelParameters: {
      ...BALANCED_PRESET.modelParameters,
      temperature: 0.3,
      topK: 20,
      topP: 0.95,
    },
    minSimilarityThreshold: 0.8,
    maxResults: 3,
  } as EmbeddingConfig,

  CREATIVE: {
    ...BALANCED_PRESET,
    modelParameters: {
      ...BALANCED_PRESET.modelParameters,
      temperature: 0.9,
      topK: 60,
      topP: 0.85,
    },
    minSimilarityThreshold: 0.6,
    maxResults: 8,
  } as EmbeddingConfig,

  PRECISE: {
    ...BALANCED_PRESET,
    modelParameters: {
      ...BALANCED_PRESET.modelParameters,
      temperature: 0.2,
      topK: 10,
      topP: 0.98,
    },
    minSimilarityThreshold: 0.9,
    maxResults: 2,
  } as EmbeddingConfig,
} as const; 