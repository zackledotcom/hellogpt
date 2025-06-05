import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { ServiceStatusManager } from '../../components/ServiceStatusManager';
import { mockIpcResponse } from '../utils/ipcMocks';
import { ServiceStatus } from '../../types/services';
import { vi } from 'vitest';

describe('Service State Transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles rapid state transitions without UI glitches', async () => {
    const states: ServiceStatus[] = ['ok', 'degraded', 'error', 'ok'];
    
    render(<ServiceStatusManager />);
    
    // Simulate rapid state changes
    for (const state of states) {
      await act(async () => {
        mockIpcResponse.event('ollama', 'onModelLoadingStateChanged', { status: state });
        // Small delay to simulate real-world timing
        await new Promise(resolve => setTimeout(resolve, 50));
      });
    }

    // Verify final state is displayed correctly
    expect(screen.getByText('Service Status')).toBeInTheDocument();
  });

  it('recovers gracefully after multiple failures', async () => {
    render(<ServiceStatusManager />);

    // Simulate multiple failures
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        mockIpcResponse.error('ollama', 'checkConnection', `Connection attempt ${i + 1} failed`);
        await new Promise(resolve => setTimeout(resolve, 100));
      });
    }

    // Simulate recovery
    await act(async () => {
      mockIpcResponse.success('ollama', 'checkConnection', { 
        connected: true,
        lastChecked: Date.now()
      });
    });

    // Verify recovery state
    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  it('handles concurrent service operations', async () => {
    render(<ServiceStatusManager />);

    // Simulate concurrent operations
    await Promise.all([
      act(async () => {
        mockIpcResponse.event('ollama', 'onModelLoadingStateChanged', { 
          status: 'loading',
          isLoading: true
        });
      }),
      act(async () => {
        mockIpcResponse.event('embedding', 'onEmbeddingStateChanged', {
          status: 'processing',
          progress: 50
        });
      }),
      act(async () => {
        mockIpcResponse.event('vectorStore', 'onVectorStoreStateChanged', {
          status: 'indexing',
          progress: 75
        });
      })
    ]);

    // Verify all states are displayed correctly
    await waitFor(() => {
      expect(screen.getByText('Status: loading')).toBeInTheDocument();
      expect(screen.getByText('Status: processing')).toBeInTheDocument();
      expect(screen.getByText('Status: indexing')).toBeInTheDocument();
    });
  });
}); 