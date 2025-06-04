interface PerformanceMetrics {
  embeddingTime: number;
  batchSize: number;
  tokensProcessed: number;
  cacheHits: number;
  cacheMisses: number;
  errorRate: number;
  timestamp: number;
}

interface PerformanceStats {
  averageEmbeddingTime: number;
  totalTokensProcessed: number;
  cacheHitRate: number;
  errorRate: number;
  lastUpdate: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics
  private readonly stats: PerformanceStats = {
    averageEmbeddingTime: 0,
    totalTokensProcessed: 0,
    cacheHitRate: 0,
    errorRate: 0,
    lastUpdate: Date.now(),
  };

  recordMetrics(metrics: Omit<PerformanceMetrics, 'timestamp'>) {
    const newMetric: PerformanceMetrics = {
      ...metrics,
      timestamp: Date.now(),
    };

    this.metrics.push(newMetric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    this.updateStats();
  }

  private updateStats() {
    if (this.metrics.length === 0) return;

    const recentMetrics = this.metrics.slice(-100); // Use last 100 metrics for stats
    const totalCacheHits = recentMetrics.reduce((sum, m) => sum + m.cacheHits, 0);
    const totalCacheMisses = recentMetrics.reduce((sum, m) => sum + m.cacheMisses, 0);
    const totalErrors = recentMetrics.reduce((sum, m) => sum + m.errorRate, 0);

    this.stats.averageEmbeddingTime =
      recentMetrics.reduce((sum, m) => sum + m.embeddingTime, 0) / recentMetrics.length;
    this.stats.totalTokensProcessed = recentMetrics.reduce((sum, m) => sum + m.tokensProcessed, 0);
    this.stats.cacheHitRate = totalCacheHits / (totalCacheHits + totalCacheMisses) || 0;
    this.stats.errorRate = totalErrors / recentMetrics.length;
    this.stats.lastUpdate = Date.now();
  }

  getStats(): PerformanceStats {
    return { ...this.stats };
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  clear() {
    this.metrics = [];
    this.updateStats();
  }
}

export const performanceMonitor = new PerformanceMonitor(); 