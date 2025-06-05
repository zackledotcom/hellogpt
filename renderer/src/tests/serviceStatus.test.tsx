import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceStatusManager } from '../../components/ServiceStatusManager';
import { mockElectron, resetMocks } from './utils/electronMock';
import { ServiceName, ServiceState } from '../../types/services';

describe('ServiceStatusManager', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('renders service status panel', () => {
    render(<ServiceStatusManager />);
    expect(screen.getByText('Service Status')).toBeInTheDocument();
  });

  it('shows toast notifications', async () => {
    const mockStatuses = new Map<ServiceName, ServiceState>([
      ['ollama', { status: 'error', lastCheck: Date.now(), error: 'Service unavailable' }],
      ['embedding', { status: 'ok', lastCheck: Date.now(), error: '' }],
    ]);

    mockElectron.ipc.invoke.mockResolvedValue(mockStatuses);

    render(<ServiceStatusManager />);

    await waitFor(() => {
      expect(screen.getByText('Ollama service is unavailable')).toBeInTheDocument();
    });
  });

  it('handles service retry', async () => {
    const mockStatuses = new Map<ServiceName, ServiceState>([
      ['ollama', { status: 'error', lastCheck: Date.now(), error: 'Service unavailable' }],
    ]);

    mockElectron.ipc.invoke.mockResolvedValue(mockStatuses);

    render(<ServiceStatusManager />);

    // Find the retry button for ollama service
    const retryButtons = screen.getAllByText('Retry');
    const ollamaRetryButton = retryButtons[0]; // First retry button is for ollama
    fireEvent.click(ollamaRetryButton);

    await waitFor(() => {
      expect(mockElectron.ipc.invoke).toHaveBeenCalledWith('app:retry-service', 'ollama');
    });
  });

  it('shows setup guide when requested', () => {
    render(<ServiceStatusManager />);
    const setupButton = screen.getByText('Setup Guide');
    fireEvent.click(setupButton);
    expect(screen.getByText('Setup Guide')).toBeInTheDocument();
  });

  it('shows troubleshooter when requested', () => {
    render(<ServiceStatusManager />);
    const troubleshootButton = screen.getByText('Troubleshoot');
    fireEvent.click(troubleshootButton);
    expect(screen.getByText('Troubleshoot')).toBeInTheDocument();
  });
}); 