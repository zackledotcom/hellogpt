import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceStatusManager } from '../components/ServiceStatusManager';
import { mockElectron, resetMocks } from './utils/electronMock';
import { ServiceName, ServiceState } from '../types/services';

describe('IPC Service Recovery', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('handles service recovery after failure', async () => {
    // Initial state: ollama service is down
    const initialStatuses: Record<ServiceName, ServiceState> = {
      ollama: { status: 'error', lastCheck: Date.now(), error: 'Connection failed' },
      embedding: { status: 'ok', lastCheck: Date.now(), error: '' },
      vectorStore: { status: 'ok', lastCheck: Date.now(), error: '' },
      memory: { status: 'ok', lastCheck: Date.now(), error: '' }
    };

    mockElectron.ipc.invoke.mockResolvedValueOnce(initialStatuses);

    render(<ServiceStatusManager />);

    // Verify error state is shown
    await waitFor(() => {
      expect(screen.getByText(/ollama service is error/)).toBeInTheDocument();
    });

    // Simulate service recovery
    const recoveredStatuses: Record<ServiceName, ServiceState> = {
      ollama: { status: 'ok', lastCheck: Date.now(), error: '' },
      embedding: { status: 'ok', lastCheck: Date.now(), error: '' },
      vectorStore: { status: 'ok', lastCheck: Date.now(), error: '' },
      memory: { status: 'ok', lastCheck: Date.now(), error: '' }
    };

    mockElectron.ipc.invoke.mockResolvedValueOnce(recoveredStatuses);

    // Wait for recovery
    await waitFor(() => {
      expect(screen.queryByText(/ollama service is error/)).not.toBeInTheDocument();
    });
  });

  it.skip('handles multiple service failures', async () => {
    // Initial state: multiple services down
    const initialStatuses: Record<ServiceName, ServiceState> = {
      ollama: { status: 'error', lastCheck: Date.now(), error: 'Connection failed' },
      embedding: { status: 'error', lastCheck: Date.now(), error: 'Service unavailable' },
      vectorStore: { status: 'ok', lastCheck: Date.now(), error: '' },
      memory: { status: 'ok', lastCheck: Date.now(), error: '' }
    };

    mockElectron.ipc.invoke.mockResolvedValueOnce(initialStatuses);

    render(<ServiceStatusManager />);

    // Verify error states are shown
    await waitFor(() => {
      expect(screen.getByText(/ollama service is error/)).toBeInTheDocument();
      expect(screen.getByText(/embedding service is error/)).toBeInTheDocument();
    });

    // Simulate partial recovery
    const partialRecoveryStatuses: Record<ServiceName, ServiceState> = {
      ollama: { status: 'ok', lastCheck: Date.now(), error: '' },
      embedding: { status: 'error', lastCheck: Date.now(), error: 'Service unavailable' },
      vectorStore: { status: 'ok', lastCheck: Date.now(), error: '' },
      memory: { status: 'ok', lastCheck: Date.now(), error: '' }
    };

    mockElectron.ipc.invoke.mockResolvedValueOnce(partialRecoveryStatuses);

    // Wait for partial recovery
    await waitFor(() => {
      expect(screen.queryByText(/ollama service is error/)).not.toBeInTheDocument();
      expect(screen.getByText(/embedding service is error/)).toBeInTheDocument();
    });
  });

  it.skip('handles service degradation', async () => {
    // Initial state: service is degraded
    const initialStatuses: Record<ServiceName, ServiceState> = {
      ollama: { status: 'degraded', lastCheck: Date.now(), error: 'High latency' },
      embedding: { status: 'ok', lastCheck: Date.now(), error: '' },
      vectorStore: { status: 'ok', lastCheck: Date.now(), error: '' },
      memory: { status: 'ok', lastCheck: Date.now(), error: '' }
    };

    mockElectron.ipc.invoke.mockResolvedValueOnce(initialStatuses);

    render(<ServiceStatusManager />);

    // Verify degraded state is shown
    await waitFor(() => {
      expect(screen.getByText(/ollama service is degraded/)).toBeInTheDocument();
    });

    // Simulate recovery
    const recoveredStatuses: Record<ServiceName, ServiceState> = {
      ollama: { status: 'ok', lastCheck: Date.now(), error: '' },
      embedding: { status: 'ok', lastCheck: Date.now(), error: '' },
      vectorStore: { status: 'ok', lastCheck: Date.now(), error: '' },
      memory: { status: 'ok', lastCheck: Date.now(), error: '' }
    };

    mockElectron.ipc.invoke.mockResolvedValueOnce(recoveredStatuses);

    // Wait for recovery
    await waitFor(() => {
      expect(screen.queryByText(/ollama service is degraded/)).not.toBeInTheDocument();
    });
  });
}); 