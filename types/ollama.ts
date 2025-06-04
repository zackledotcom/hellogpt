export interface RequestQueueItem {
  id: string;
  request: () => Promise<any>;
  retries: number;
  maxRetries: number;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
}

export interface StreamParserOptions {
  onChunk: (chunk: string) => void;
  onError: (error: Error) => void;
  onComplete: () => void;
}
