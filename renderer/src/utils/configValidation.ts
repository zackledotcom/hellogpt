import type { EmbeddingConfig } from '../types/embedding';

interface ValidationError {
  field: string;
  message: string;
}

export function validateConfig(config: Partial<EmbeddingConfig>): ValidationError[] {
  const errors: ValidationError[] = [];

  // Model parameters validation
  if (config.modelParameters) {
    const { temperature, topK, topP, contextWindow } = config.modelParameters;

    if (temperature !== undefined && (temperature < 0 || temperature > 1)) {
      errors.push({
        field: 'modelParameters.temperature',
        message: 'Temperature must be between 0 and 1',
      });
    }

    if (topK !== undefined && (topK < 1 || topK > 100)) {
      errors.push({
        field: 'modelParameters.topK',
        message: 'Top K must be between 1 and 100',
      });
    }

    if (topP !== undefined && (topP < 0 || topP > 1)) {
      errors.push({
        field: 'modelParameters.topP',
        message: 'Top P must be between 0 and 1',
      });
    }

    if (contextWindow !== undefined && (contextWindow < 512 || contextWindow > 8192)) {
      errors.push({
        field: 'modelParameters.contextWindow',
        message: 'Context window must be between 512 and 8192',
      });
    }
  }

  // Processing settings validation
  if (config.batchSize !== undefined && (config.batchSize < 1 || config.batchSize > 128)) {
    errors.push({
      field: 'batchSize',
      message: 'Batch size must be between 1 and 128',
    });
  }

  if (config.chunkSize !== undefined && (config.chunkSize < 100 || config.chunkSize > 2000)) {
    errors.push({
      field: 'chunkSize',
      message: 'Chunk size must be between 100 and 2000',
    });
  }

  if (config.chunkOverlap !== undefined && config.chunkSize !== undefined && 
      (config.chunkOverlap < 0 || config.chunkOverlap > config.chunkSize)) {
    errors.push({
      field: 'chunkOverlap',
      message: 'Chunk overlap must be between 0 and chunk size',
    });
  }

  // Cache settings validation
  if (config.cacheSize !== undefined && (config.cacheSize < 100 || config.cacheSize > 10000)) {
    errors.push({
      field: 'cacheSize',
      message: 'Cache size must be between 100 and 10000',
    });
  }

  if (config.cacheTTL !== undefined && (config.cacheTTL < 60 || config.cacheTTL > 86400)) {
    errors.push({
      field: 'cacheTTL',
      message: 'Cache TTL must be between 60 and 86400 seconds',
    });
  }

  // Performance settings validation
  if (config.maxConcurrentRequests !== undefined && (config.maxConcurrentRequests < 1 || config.maxConcurrentRequests > 16)) {
    errors.push({
      field: 'maxConcurrentRequests',
      message: 'Max concurrent requests must be between 1 and 16',
    });
  }

  if (config.timeout !== undefined && (config.timeout < 1000 || config.timeout > 60000)) {
    errors.push({
      field: 'timeout',
      message: 'Timeout must be between 1000 and 60000 milliseconds',
    });
  }

  // Quality settings validation
  if (config.minSimilarityThreshold !== undefined && (config.minSimilarityThreshold < 0 || config.minSimilarityThreshold > 1)) {
    errors.push({
      field: 'minSimilarityThreshold',
      message: 'Similarity threshold must be between 0 and 1',
    });
  }

  if (config.maxResults !== undefined && (config.maxResults < 1 || config.maxResults > 50)) {
    errors.push({
      field: 'maxResults',
      message: 'Max results must be between 1 and 50',
    });
  }

  return errors;
}

export function getConfigValidationMessage(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  return errors.map(error => `${error.field}: ${error.message}`).join('\n');
} 