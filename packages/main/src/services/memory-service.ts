import { ChromaClient, Collection, Metadata, IncludeEnum } from 'chromadb';
import { pipeline, Pipeline, FeatureExtractionPipeline } from '@huggingface/transformers';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises'; // Use promises version
import { ipcMain } from 'electron';

interface MemoryChunk {
  id: string;
  content: string;
  metadata: {
    timestamp: number;
    source: string;
    type: string;
    tags?: string[];
    [key: string]: any; // Allow additional properties as ChromaDB metadata is flexible
  };
}

interface EmbeddingResult {
  data: Float32Array;
}

export class MemoryService {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private embedder: FeatureExtractionPipeline | null = null;
  private isInitialized = false;

  constructor() {
    // Initialize ChromaDB client with the correct path for a local persistent database
    const dbPath = path.join(app.getPath('userData'), 'chroma');
    console.log(`Initializing ChromaDB with path: ${dbPath}`);
    this.client = new ChromaClient({
      path: dbPath
    });
  }

  async initialize() {
    try {
      // Initialize the embedding model
      const pipelineResult = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      this.embedder = pipelineResult as FeatureExtractionPipeline;

      // Create or get the collection
      this.collection = await this.client.getOrCreateCollection({
        name: 'memories',
        metadata: {
          description: 'Stored memories and context for the chat application'
        }
      });

      this.isInitialized = true;
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize memory service:', error);
      // Keep the specific error check for potential future use or debugging
       if (error instanceof Error && error.message.includes('Failed to fetch')) {
        return { success: false, error: 'Could not connect to ChromaDB. Please ensure it is running on http://localhost:8000.' };
      }
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async store(content: string, metadata: Omit<MemoryChunk['metadata'], 'timestamp'>) {
    if (!this.isInitialized || !this.embedder || !this.collection) {
      throw new Error('Memory service not initialized');
    }

    try {
      // Generate embedding for the content
      const embedding = await this.embedder(content, { pooling: 'mean', normalize: true }) as EmbeddingResult;
      const embeddingArray = Array.from(embedding.data);

      // Add timestamp to metadata
      const fullMetadata = {
        ...metadata,
        timestamp: Date.now()
      };

      // Store in ChromaDB
      const result = (await this.collection.add({
        ids: [Date.now().toString()],
        embeddings: [embeddingArray],
        metadatas: [fullMetadata],
        documents: [content]
      })) as unknown as string[];

      return { success: true, id: result[0] };
    } catch (error) {
      console.error('Failed to store memory:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async search(query: string, options: { limit?: number } = {}) {
    if (!this.isInitialized || !this.embedder || !this.collection) {
      throw new Error('Memory service not initialized');
    }

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embedder(query, { pooling: 'mean', normalize: true }) as EmbeddingResult;
      const queryEmbeddingArray = Array.from(queryEmbedding.data);

      // Search in ChromaDB
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbeddingArray],
        nResults: options.limit || 5,
        include: [IncludeEnum.Metadatas, IncludeEnum.Documents]
      });

      // Transform results into MemoryChunk format
      const memories: MemoryChunk[] = results.ids[0].map((id, index) => {
        const content = results.documents?.[0]?.[index];
        const metadata = results.metadatas?.[0]?.[index] as MemoryChunk['metadata'];

        if (!content || !metadata) {
          console.warn(`Skipping memory chunk due to missing content or metadata for ID: ${id}`);
          return null; // Skip this memory chunk
        }

        return {
          id: id.toString(),
          content,
          metadata
        };
      }).filter((item): item is MemoryChunk => item !== null); // Filter out nulls

      return { success: true, results: memories };
    } catch (error) {
      console.error('Failed to search memories:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getRecent(limit: number = 10) {
    if (!this.isInitialized || !this.collection) {
      throw new Error('Memory service not initialized');
    }

    try {
      // Get all documents and sort by timestamp
      const results = await this.collection.get({
        include: [IncludeEnum.Metadatas, IncludeEnum.Documents]
      });

      // Transform and sort by timestamp
      const memories: MemoryChunk[] = results.ids.map((id, index) => {
        const content = results.documents?.[index];
        const metadata = results.metadatas?.[index] as MemoryChunk['metadata'];

        if (!content || !metadata) {
          console.warn(`Skipping recent memory due to missing content or metadata for ID: ${id}`);
          return null; // Skip this memory chunk
        }

        return {
          id: id.toString(),
          content,
          metadata
        };
      }).filter((item): item is MemoryChunk => item !== null) // Filter out nulls
        .sort((a, b) => b.metadata.timestamp - a.metadata.timestamp)
        .slice(0, limit);

      return { success: true, results: memories };
    } catch (error) {
      console.error('Failed to get recent memories:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Initialize and export the service
const memoryService = new MemoryService();

// Set up IPC handlers
ipcMain.handle('memory:initialize', async () => {
  return memoryService.initialize();
});

ipcMain.handle('memory:store', async (_, content: string, metadata: Omit<MemoryChunk['metadata'], 'timestamp'>) => {
  return memoryService.store(content, metadata);
});

ipcMain.handle('memory:search', async (_, query: string, options?: { limit?: number }) => {
  return memoryService.search(query, options);
});

ipcMain.handle('memory:recent', async (_, limit?: number) => {
  return memoryService.getRecent(limit);
}); 