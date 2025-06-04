import type { RequestQueueItem } from '../types/ollama';

export class RequestQueue<T> {
  private queue: RequestQueueItem[] = [];
  private isProcessing = false;

  constructor(private delayFn: (ms: number) => Promise<void>) {}

  public enqueue(requestItem: RequestQueueItem): void {
    this.queue.push(requestItem);
    this.process();
  }

  private async process(): Promise<void> {
    if (this.isProcessing || !this.queue.length) return;
    this.isProcessing = true;

    const item = this.queue[0];
    try {
      const result = await item.request();
      item.resolve(result);
    } catch (err) {
      if (item.retries < item.maxRetries) {
        item.retries++;
        await this.delayFn(2 ** item.retries * 1000);
        this.isProcessing = false;
        return this.process();
      }
      item.reject(err as Error);
    }

    this.queue.shift();
    this.isProcessing = false;
    this.process();
  }

  public clear(): void {
    this.queue = [];
    this.isProcessing = false;
  }

  public get length(): number {
    return this.queue.length;
  }

  public get isActive(): boolean {
    return this.isProcessing;
  }
}
