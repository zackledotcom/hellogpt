import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { OllamaService } from './OllamaService';
import { EmbeddingService } from './EmbeddingService';
import { VectorStoreService } from './VectorStoreService';
import { MemoryService } from './MemoryService';

export type ServiceName = 'ollama' | 'embedding' | 'vectorStore' | 'memory';
export type ServiceStatus = 'operational' | 'degraded' | 'unavailable';

interface ServiceState {
  status: ServiceStatus;
  lastCheck: number;
  error?: string;
}

export class ServiceManager extends EventEmitter {
  private static instance: ServiceManager;
  private services: Map<ServiceName, ServiceState> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 30000; // 30 seconds
  private readonly RECOVERY_ATTEMPTS = new Map<ServiceName, number>();
  private readonly MAX_RECOVERY_ATTEMPTS = 5;

  private constructor() {
    super();
    this.initializeServices();
  }

  public static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  private initializeServices(): void {
    this.services.set('ollama', { status: 'unavailable', lastCheck: Date.now() });
    this.services.set('embedding', { status: 'unavailable', lastCheck: Date.now() });
    this.services.set('vectorStore', { status: 'unavailable', lastCheck: Date.now() });
    this.services.set('memory', { status: 'unavailable', lastCheck: Date.now() });
  }

  public startMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkServices();
    }, this.CHECK_INTERVAL_MS);
  }

  public stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  public async checkServices(): Promise<void> {
    for (const [serviceName, state] of this.services.entries()) {
      try {
        await this.checkService(serviceName);
      } catch (error) {
        logger.error(`Error checking service ${serviceName}:`, error);
        this.updateServiceStatus(serviceName, 'degraded', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  private async checkService(serviceName: ServiceName): Promise<void> {
    const state = this.services.get(serviceName);
    if (!state) return;

    try {
      switch (serviceName) {
        case 'ollama':
          await this.checkOllamaService();
          break;
        case 'embedding':
          await this.checkEmbeddingService();
          break;
        case 'vectorStore':
          await this.checkVectorStoreService();
          break;
        case 'memory':
          await this.checkMemoryService();
          break;
      }
    } catch (error) {
      this.handleServiceError(serviceName, error);
    }
  }

  private async checkOllamaService(): Promise<void> {
    const ollamaService = OllamaService.getInstance();
    const isConnected = await ollamaService.checkConnection();
    this.updateServiceStatus('ollama', isConnected ? 'operational' : 'degraded');
  }

  private async checkEmbeddingService(): Promise<void> {
    const embeddingService = EmbeddingService.getInstance();
    const status = embeddingService.getStatus();
    this.updateServiceStatus('embedding', status);
  }

  private async checkVectorStoreService(): Promise<void> {
    const vectorStoreService = VectorStoreService.getInstance();
    // Add vector store specific checks here
    this.updateServiceStatus('vectorStore', 'operational');
  }

  private async checkMemoryService(): Promise<void> {
    const memoryService = MemoryService.getInstance();
    const { success } = await memoryService.initialize();
    this.updateServiceStatus('memory', success ? 'operational' : 'degraded');
  }

  private handleServiceError(serviceName: ServiceName, error: unknown): void {
    const attempts = (this.RECOVERY_ATTEMPTS.get(serviceName) || 0) + 1;
    this.RECOVERY_ATTEMPTS.set(serviceName, attempts);

    if (attempts >= this.MAX_RECOVERY_ATTEMPTS) {
      this.updateServiceStatus(
        serviceName,
        'unavailable',
        `Service failed after ${attempts} recovery attempts`
      );
    } else {
      this.updateServiceStatus(
        serviceName,
        'degraded',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private updateServiceStatus(
    serviceName: ServiceName,
    status: ServiceStatus,
    error?: string
  ): void {
    const currentState = this.services.get(serviceName);
    if (!currentState) return;

    const newState: ServiceState = {
      status,
      lastCheck: Date.now(),
      error,
    };

    if (currentState.status !== status) {
      this.services.set(serviceName, newState);
      this.emit('serviceStatusChanged', { serviceName, status, error });
      logger.info(`Service ${serviceName} status changed to ${status}`);
    }
  }

  public getServiceStatus(serviceName: ServiceName): ServiceState | undefined {
    return this.services.get(serviceName);
  }

  public getAllServiceStatuses(): Map<ServiceName, ServiceState> {
    return new Map(this.services);
  }

  public isServiceAvailable(serviceName: ServiceName): boolean {
    const state = this.services.get(serviceName);
    return state?.status === 'operational';
  }

  public async retryService(serviceName: ServiceName): Promise<void> {
    this.RECOVERY_ATTEMPTS.set(serviceName, 0);
    await this.checkService(serviceName);
  }
} 