declare module 'hnswlib-node' {
  export class HnswLib {
    constructor(dimensions: number, path: string);
    initIndex(maxElements: number): Promise<void>;
    addPoint(vector: number[], id: number): Promise<void>;
    searchKnn(vector: number[], k: number): Promise<{ neighbors: number[], distances: number[] }>;
    deletePoint(id: number): Promise<void>;
    clearIndex(): Promise<void>;
  }
} 