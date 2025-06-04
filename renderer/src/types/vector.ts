export interface Document {
  id: string;
  content: string;
  metadata: {
    filename?: string;
    type?: string;
    size?: number;
    timestamp: number;
    source?: string;
    [key: string]: any;
  };
}

export interface VectorStoreAPI {
  searchVectorStore: (query: string) => Promise<Document[]>;
  addDocument: (document: Omit<Document, 'id'>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  clearVectorStore: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: VectorStoreAPI;
  }
} 