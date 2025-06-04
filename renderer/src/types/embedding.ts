export interface EmbeddingConfig {
  model: string;
  modelParameters: {
    temperature: number;
    topK: number;
    topP: number;
    contextWindow: number;
    repeatPenalty: number;
    presencePenalty: number;
    frequencyPenalty: number;
    mirostatMode: number;
    mirostatTau: number;
    mirostatEta: number;
  };
  batchSize: number;
  normalize: boolean;
  truncateStrategy: 'NONE' | 'FIRST' | 'LAST';
  maxTokens: number;
  chunkSize: number;
  chunkOverlap: number;
  chunkStrategy: 'SENTENCE' | 'PARAGRAPH' | 'FIXED';
  enableCache: boolean;
  cacheSize: number;
  cacheTTL: number;
  parallelProcessing: boolean;
  maxConcurrentRequests: number;
  timeout: number;
  minSimilarityThreshold: number;
  maxResults: number;
  rerankResults: boolean;
} 