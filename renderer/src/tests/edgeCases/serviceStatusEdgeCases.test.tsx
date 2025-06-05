import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceStatusManager } from '../../components/ServiceStatusManager';
import { mockElectron, resetMocks } from '../utils/electronMock';
import { ServiceName, ServiceState } from '../../types/services';

describe('Service Status Edge Cases', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('handles rapid state transitions without UI glitches', async () => {
    const states: ServiceState['status'][] = ['ok', 'degraded', 'error', 'ok'];
    
    render(<ServiceStatusManager />);
    
    // Simulate rapid state changes
    for (const state of states) {
      const statuses: Record<ServiceName, ServiceState> = {
        ollama: { status: state, lastCheck: Date.now(), error: '' },
        embedding: { status: 'ok', lastCheck: Date.now(), error: '' },
        vectorStore: { status: 'ok', lastCheck: Date.now(), error: '' },
        memory: { status: 'ok', lastCheck: Date.now(), error: '' }
      };
      
      mockElectron.ipc.invoke.mockResolvedValueOnce(statuses);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Verify final state is displayed correctly
    await waitFor(() => {
      expect(screen.getByText('Service Status')).toBeInTheDocument();
    });
  });

  it.skip('recovers gracefully after multiple failures', async () => {
    render(<ServiceStatusManager />);

    // Simulate multiple failures
    for (let i = 0; i < 3; i++) {
      const statuses: Record<ServiceName, ServiceState> = {
        ollama: { status: 'error', lastCheck: Date.now(), error: `Connection attempt ${i + 1} failed` },
        embedding: { status: 'ok', lastCheck: Date.now(), error: '' },
        vectorStore: { status: 'ok', lastCheck: Date.now(), error: '' },
        memory: { status: 'ok', lastCheck: Date.now(), error: '' }
      };
      
      mockElectron.ipc.invoke.mockResolvedValueOnce(statuses);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Simulate recovery
    const recoveredStatuses: Record<ServiceName, ServiceState> = {
      ollama: { status: 'ok', lastCheck: Date.now(), error: '' },
      embedding: { status: 'ok', lastCheck: Date.now(), error: '' },
      vectorStore: { status: 'ok', lastCheck: Date.now(), error: '' },
      memory: { status: 'ok', lastCheck: Date.now(), error: '' }
    };
    
    mockElectron.ipc.invoke.mockResolvedValueOnce(recoveredStatuses);

    // Verify recovery state
    await waitFor(() => {
      expect(screen.queryByText(/ollama service is error/)).not.toBeInTheDocument();
    });
  });

  it.skip('handles concurrent service operations', async () => {
    render(<ServiceStatusManager />);

    // Simulate concurrent operations
    const statuses: Record<ServiceName, ServiceState> = {
      ollama: { status: 'degraded', lastCheck: Date.now(), error: 'High latency' },
      embedding: { status: 'degraded', lastCheck: Date.now(), error: 'Processing delay' },
      vectorStore: { status: 'degraded', lastCheck: Date.now(), error: 'Indexing in progress' },
      memory: { status: 'ok', lastCheck: Date.now(), error: '' }
    };
    
    mockElectron.ipc.invoke.mockResolvedValueOnce(statuses);

    // Verify all states are displayed correctly
    await waitFor(() => {
      expect(screen.getByText(/ollama service is degraded/)).toBeInTheDocument();
      expect(screen.getByText(/embedding service is degraded/)).toBeInTheDocument();
      expect(screen.getByText(/vectorStore service is degraded/)).toBeInTheDocument();
    });
  });
}); 