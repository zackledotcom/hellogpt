import { logger } from '../utils/logger';

interface VectorEntry {
  id: string;
  vector: number[];
  metadata: any;
}

interface SearchResult extends VectorEntry {
  similarity: number;
}

export class InMemoryVectorStore {
  private vectors: Map<string, VectorEntry> = new Map();
  private dimension: number;

  constructor(dimension: number = 1536) {
    this.dimension = dimension;
  }

  add(id: string, vector: number[], metadata: any = {}): void {
    if (vector.length !== this.dimension) {
      throw new Error(`Vector dimension mismatch. Expected ${this.dimension}, got ${vector.length}`);
    }
    this.vectors.set(id, { id, vector, metadata });
  }

  search(queryVector: number[], k: number = 5): SearchResult[] {
    if (queryVector.length !== this.dimension) {
      throw new Error(`Query vector dimension mismatch. Expected ${this.dimension}, got ${queryVector.length}`);
    }

    const entries = Array.from(this.vectors.values());
    const results = entries.map(entry => ({
      ...entry,
      similarity: this.cosineSimilarity(queryVector, entry.vector)
    }));

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);
  }

  delete(id: string): void {
    this.vectors.delete(id);
  }

  clear(): void {
    this.vectors.clear();
  }

  size(): number {
    return this.vectors.size;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
} 