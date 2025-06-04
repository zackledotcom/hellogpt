import { logger } from '../utils/logger';
import type { Document } from '../types/ipc';
import { v4 as uuidv4 } from 'uuid';
import hnswlib from 'hnswlib-node';
import path from 'path';
import { app } from 'electron';
import { EmbeddingService } from './EmbeddingService';

// Type declaration for HierarchicalNSW
interface HierarchicalNSW {
  new (space: string, dim: number): any;
  initIndex(maxElements: number): Promise<void>;
  readIndex(path: string): Promise<void>;
  addPoint(point: number[], label: number): Promise<void>;
  searchKnn(query: number[], k: number): Promise<{neighbors: number[]}>;
  clearIndex(): Promise<void>;
}

export class VectorStoreService {
  private readonly CHUNK_SIZE = 1000;
  private readonly CHUNK_OVERLAP = 200;
  private readonly VECTOR_SIZE = 1536; // OpenAI embedding dimension
  private documents: Map<string, Document> = new Map();
  private index!: HierarchicalNSW; // Definite assignment assertion
  private indexPath: string;
  private embeddingService: EmbeddingService;
  private nextId: number = 0;

  constructor(embeddingService: EmbeddingService) {
    this.indexPath = path.join(app.getPath('userData'), 'vector-store');
    this.embeddingService = embeddingService;
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing VectorStoreService');
      this.index = new (hnswlib as any).HierarchicalNSW('l2', this.VECTOR_SIZE);
      await this.index.initIndex(1000); // Max elements
      if (this.indexPath) {
        try {
          await this.index.readIndex(this.indexPath);
        } catch (e) {
          logger.info('No existing index found, creating new one');
        }
      }
      await this.loadDocuments();
    } catch (error) {
      logger.error('Error initializing vector store:', error);
      throw error;
    }
  }

  private async loadDocuments(): Promise<void> {
    try {
      // TODO: Implement document loading from disk
      logger.info('Loading documents from disk');
    } catch (error) {
      logger.error('Error loading documents:', error);
      throw error;
    }
  }

  private chunkText(text: string): string[] {
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + this.CHUNK_SIZE, text.length);
      let chunk = text.slice(startIndex, endIndex);

      // If we're not at the end of the text, try to find a sentence boundary
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

      chunks.push(chunk);
      startIndex -= this.CHUNK_OVERLAP;
    }

    return chunks;
  }

  async addDocument(document: Omit<Document, 'id'>): Promise<void> {
    try {
      const id = uuidv4();
      const chunks = this.chunkText(document.content);

      for (const chunk of chunks) {
        const chunkId = uuidv4();
        this.documents.set(chunkId, {
          id: chunkId,
          content: chunk,
          metadata: {
            ...document.metadata,
            originalId: id,
            chunkIndex: chunks.indexOf(chunk),
            totalChunks: chunks.length,
          },
        });

        // Generate embedding and add to vector store
        const embedding = await this.embeddingService.generateEmbedding(chunk);
        await this.index.addPoint(embedding, this.nextId);
        this.nextId++;
      }
    } catch (error) {
      logger.error('Error adding document:', error);
      throw error;
    }
  }

  async searchSimilar(query: string, k: number = 5): Promise<Document[]> {
    try {
      // Generate query embedding
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);

      // Search for similar vectors
      const { neighbors } = await this.index.searchKnn(queryEmbedding, k);

      // Map vector IDs back to documents
      const results: Document[] = [];
      for (const neighborId of neighbors) {
        // TODO: Implement mapping from vector ID to document
        // This requires maintaining a mapping between vector IDs and document IDs
      }

      return results;
    } catch (error) {
      logger.error('Error searching documents:', error);
      throw error;
    }
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      // Delete all chunks associated with the document
      for (const [chunkId, doc] of this.documents.entries()) {
        if (doc.metadata.originalId === id) {
          this.documents.delete(chunkId);
          // TODO: Remove from vector store
          // This requires maintaining a mapping between document IDs and vector IDs
        }
      }
    } catch (error) {
      logger.error('Error deleting document:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      this.documents.clear();
      await this.index.clearIndex();
      this.nextId = 0;
    } catch (error) {
      logger.error('Error clearing vector store:', error);
      throw error;
    }
  }
}
