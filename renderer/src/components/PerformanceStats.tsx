import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '../utils/performanceMonitor';

export const PerformanceStats: React.FC = () => {
  const [stats, setStats] = useState(performanceMonitor.getStats());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(performanceMonitor.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Performance Statistics</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Average Embedding Time</p>
          <p className="text-lg font-medium">{formatTime(stats.averageEmbeddingTime)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Tokens Processed</p>
          <p className="text-lg font-medium">{stats.totalTokensProcessed.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Cache Hit Rate</p>
          <p className="text-lg font-medium">{formatPercentage(stats.cacheHitRate)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Error Rate</p>
          <p className="text-lg font-medium">{formatPercentage(stats.errorRate)}</p>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">Recent Metrics</h4>
            <button
              onClick={() => performanceMonitor.clear()}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear History
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {performanceMonitor.getMetrics().slice(-10).map((metric, index) => (
              <div key={index} className="text-sm text-gray-600 py-1">
                <div className="flex justify-between">
                  <span>{new Date(metric.timestamp).toLocaleTimeString()}</span>
                  <span>{formatTime(metric.embeddingTime)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Batch: {metric.batchSize}</span>
                  <span>Tokens: {metric.tokensProcessed}</span>
                  <span>Cache: {metric.cacheHits}/{metric.cacheHits + metric.cacheMisses}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 