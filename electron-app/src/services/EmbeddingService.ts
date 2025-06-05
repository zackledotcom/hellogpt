import { logger } from '../utils/logger';
import { OllamaService } from './OllamaService';
import { InMemoryVectorStore } from './InMemoryVectorStore';
import { v4 as uuidv4 } from 'uuid';

export type ServiceStatus = 'operational' | 'degraded' | 'unavailable';

export interface EmbeddingConfig {
  // Model settings
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
  
  // Processing settings
  batchSize: number;
  normalize: boolean;
  truncateStrategy: 'NONE' | 'FIRST' | 'LAST' | 'MIDDLE';
  maxTokens: number;
  
  // Chunking settings
  chunkSize: number;
  chunkOverlap: number;
  chunkStrategy: 'SENTENCE' | 'PARAGRAPH' | 'FIXED';
  
  // Cache settings
  enableCache: boolean;
  cacheSize: number;
  cacheTTL: number;
  
  // Performance settings
  parallelProcessing: boolean;
  maxConcurrentRequests: number;
  timeout: number;
  
  // Quality settings
  minSimilarityThreshold: number;
  maxResults: number;
  rerankResults: boolean;
}

export class EmbeddingService {
  private static instance: EmbeddingService;
  private readonly ollamaService: OllamaService;
  private config: EmbeddingConfig;
  private status: ServiceStatus = 'operational';
  private fallbackStore: InMemoryVectorStore;
  private readonly defaultConfig: EmbeddingConfig = {
    model: 'nomic-embed-text',
    modelParameters: {
      temperature: 0.7,
      topK: 40,
      topP: 0.9,
      contextWindow: 2048,
      repeatPenalty: 1.1,
      presencePenalty: 0.0,
      frequencyPenalty: 0.0,
      mirostatMode: 0,
      mirostatTau: 5.0,
      mirostatEta: 0.1,
    },
    batchSize: 32,
    normalize: true,
    truncateStrategy: 'NONE',
    maxTokens: 2048,
    chunkSize: 1000,
    chunkOverlap: 200,
    chunkStrategy: 'SENTENCE',
    enableCache: true,
    cacheSize: 1000,
    cacheTTL: 3600,
    parallelProcessing: true,
    maxConcurrentRequests: 4,
    timeout: 30000,
    minSimilarityThreshold: 0.7,
    maxResults: 10,
    rerankResults: false,
  };

  private constructor(ollamaService: OllamaService, config?: Partial<EmbeddingConfig>) {
    this.ollamaService = ollamaService;
    this.config = { ...this.defaultConfig, ...config };
    this.fallbackStore = new InMemoryVectorStore(1536);
  }

  public static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      const ollamaService = OllamaService.getInstance();
      EmbeddingService.instance = new EmbeddingService(ollamaService);
    }
    return EmbeddingService.instance;
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing EmbeddingService');
      const connectionStatus = await this.ollamaService.checkConnection();
      
      if (connectionStatus.status === 'disconnected') {
        this.status = 'degraded';
        logger.warn('Ollama service is not available. Using fallback embedding mode.');
        return;
      }

      // Ensure the embedding model is available
      const models = await this.ollamaService.listModels();
      if (!models.models.some(model => model.name === this.config.model)) {
        logger.info(`Embedding model ${this.config.model} not found, pulling...`);
        await this.ollamaService.pullModel(this.config.model);
      }

      this.status = 'operational';
    } catch (error) {
      this.status = 'degraded';
      logger.error('Error initializing embedding service:', error);
      throw error;
    }
  }

  getStatus(): ServiceStatus {
    return this.status;
  }

  async updateConfig(newConfig: Partial<EmbeddingConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    logger.info(`Updated embedding configuration: ${JSON.stringify(this.config, null, 2)}`);
  }

  getConfig(): EmbeddingConfig {
    return { ...this.config };
  }

  private truncateText(text: string): string {
    if (this.config.truncateStrategy === 'NONE') return text;

    const tokens = text.split(/\s+/);
    if (tokens.length <= this.config.maxTokens) return text;

    switch (this.config.truncateStrategy) {
      case 'FIRST':
        return tokens.slice(0, this.config.maxTokens).join(' ');
      case 'LAST':
        return tokens.slice(-this.config.maxTokens).join(' ');
      case 'MIDDLE':
        const half = Math.floor(this.config.maxTokens / 2);
        return [
          ...tokens.slice(0, half),
          '...',
          ...tokens.slice(-half)
        ].join(' ');
      default:
        return text;
    }
  }

  private chunkText(text: string): string[] {
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + this.config.chunkSize, text.length);
      let chunk = text.slice(startIndex, endIndex);

      if (this.config.chunkStrategy === 'SENTENCE') {
        if (endIndex < text.length) {
          const lastPeriod = chunk.lastIndexOf('.');
          if (lastPeriod !== -1) {
            chunk = chunk.slice(0, lastPeriod + 1);
            startIndex += lastPeriod + 1;
          } else {
            startIndex = endIndex;
          }
        } else {
          startIndex = endIndex;
        }
      } else if (this.config.chunkStrategy === 'PARAGRAPH') {
        if (endIndex < text.length) {
          const lastNewline = chunk.lastIndexOf('\n\n');
          if (lastNewline !== -1) {
            chunk = chunk.slice(0, lastNewline + 2);
            startIndex += lastNewline + 2;
          } else {
            startIndex = endIndex;
          }
        } else {
          startIndex = endIndex;
        }
      } else {
        startIndex = endIndex;
      }

      chunks.push(chunk);
      startIndex -= this.config.chunkOverlap;
    }

    return chunks;
  }

  private generateFallbackEmbedding(text: string): number[] {
    // Simple fallback embedding using character frequencies
    const embedding = new Array(1536).fill(0);
    const chars = text.toLowerCase().split('');
    
    chars.forEach((char, i) => {
      const index = (char.charCodeAt(0) * i) % 1536;
      embedding[index] += 1;
    });

    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (this.status === 'unavailable') {
        throw new Error('Embedding service is unavailable');
      }

      if (this.status === 'degraded' || !this.ollamaService.isServiceAvailable()) {
        logger.warn('Using fallback embedding generation');
        return this.generateFallbackEmbedding(text);
      }

      const truncatedText = this.truncateText(text);
      const response = await fetch('http://localhost:11434/api/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          prompt: truncatedText,
          options: {
            ...this.config.modelParameters,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate embedding: ${response.statusText}`);
      }

      const data = await response.json();
      let embedding = data.embedding;

      if (this.config.normalize) {
        const magnitude = Math.sqrt(embedding.reduce((sum: number, val: number) => sum + val * val, 0));
        embedding = embedding.map((val: number) => val / magnitude);
      }

      return embedding;
    } catch (error) {
      logger.error('Error generating embedding:', error);
      if (this.status === 'operational') {
        this.status = 'degraded';
      }
      return this.generateFallbackEmbedding(text);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      if (this.status === 'unavailable') {
        throw new Error('Embedding service is unavailable');
      }

      const embeddings: number[][] = [];
      const batchSize = this.config.batchSize ?? 32;
      
      // Process in batches
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchEmbeddings = await Promise.all(
          batch.map(text => this.generateEmbedding(text))
        );
        embeddings.push(...batchEmbeddings);
      }
      return embeddings;
    } catch (error) {
      logger.error('Error generating embeddings:', error);
      if (this.status === 'operational') {
        this.status = 'degraded';
      }
      return texts.map(text => this.generateFallbackEmbedding(text));
    }
  }

  async storeEmbedding(text: string, metadata: any = {}): Promise<string> {
    const id = uuidv4();
    const embedding = await this.generateEmbedding(text);
    this.fallbackStore.add(id, embedding, metadata);
    return id;
  }

  async searchSimilar(query: string, k: number = 5): Promise<Array<{ id: string; similarity: number; metadata: any }>> {
    const queryEmbedding = await this.generateEmbedding(query);
    return this.fallbackStore.search(queryEmbedding, k);
  }

  async rerankResults(query: string, results: { text: string; score: number }[]): Promise<{ text: string; score: number }[]> {
    if (!this.config.rerankResults) return results;

    try {
      const queryEmbedding = await this.generateEmbedding(query);
      const resultEmbeddings = await this.generateEmbeddings(results.map(r => r.text));
      
      const rerankedResults = results.map((result, index) => {
        const similarity = this.cosineSimilarity(queryEmbedding, resultEmbeddings[index]);
        return { ...result, score: similarity };
      });

      return rerankedResults
        .filter(r => r.score >= this.config.minSimilarityThreshold)
        .sort((a, b) => b.score - a.score)
        .slice(0, this.config.maxResults);
    } catch (error) {
      logger.error('Error reranking results:', error);
      return results;
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
} 