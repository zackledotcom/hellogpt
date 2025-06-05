import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ServiceStatusManager } from '../components/ServiceStatusManager';
import { useServiceStatus } from '../hooks/useServiceStatus';
import { vi } from 'vitest';
import { ServiceName, ServiceState, ServiceStatus } from '../types/services';

vi.mock('../hooks/useServiceStatus');

describe('ServiceStatusManager Edge Cases', () => {
  const mockRetryService = vi.fn();
  const mockRemoveToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles rapid service status changes', async () => {
    const statusChanges: ServiceState[] = [
      { status: 'operational', lastCheck: Date.now() },
      { status: 'degraded', lastCheck: Date.now(), error: 'High latency' },
      { status: 'unavailable', lastCheck: Date.now(), error: 'Connection lost' },
      { status: 'operational', lastCheck: Date.now() }
    ];

    let currentStatusIndex = 0;
    const mockServiceStatuses = new Map<ServiceName, ServiceState>([
      ['ollama', statusChanges[currentStatusIndex]]
    ]);

    vi.mocked(useServiceStatus).mockReturnValue({
      serviceStatuses: mockServiceStatuses,
      toasts: [],
      removeToast: mockRemoveToast,
      retryService: mockRetryService
    });

    const { rerender } = render(<ServiceStatusManager />);

    // Simulate rapid status changes
    for (let i = 1; i < statusChanges.length; i++) {
      currentStatusIndex = i;
      mockServiceStatuses.set('ollama', statusChanges[i]);
      
      await act(async () => {
        rerender(<ServiceStatusManager />);
      });
    }

    // Verify the final state
    expect(screen.getByText('Service Status')).toBeInTheDocument();
  });

  it('handles multiple simultaneous service failures', async () => {
    const mockServiceStatuses = new Map<ServiceName, ServiceState>([
      ['ollama', { status: 'unavailable', lastCheck: Date.now(), error: 'Connection failed' }],
      ['embedding', { status: 'unavailable', lastCheck: Date.now(), error: 'Service error' }],
      ['vectorStore', { status: 'unavailable', lastCheck: Date.now(), error: 'Timeout' }]
    ]);

    const mockToasts = [
      {
        id: '1',
        message: 'Ollama service is unavailable',
        type: 'unavailable' as ServiceStatus
      },
      {
        id: '2',
        message: 'Embedding service is unavailable',
        type: 'unavailable' as ServiceStatus
      },
      {
        id: '3',
        message: 'Vector store is unavailable',
        type: 'unavailable' as ServiceStatus
      }
    ];

    vi.mocked(useServiceStatus).mockReturnValue({
      serviceStatuses: mockServiceStatuses,
      toasts: mockToasts,
      removeToast: mockRemoveToast,
      retryService: mockRetryService
    });

    render(<ServiceStatusManager />);

    // Expand the panel
    fireEvent.click(screen.getByText('Service Status'));

    // Verify all retry buttons are present
    const retryButtons = screen.getAllByText('Retry');
    expect(retryButtons).toHaveLength(3);

    // Test retry for each service
    for (const button of retryButtons) {
      fireEvent.click(button);
    }

    expect(mockRetryService).toHaveBeenCalledTimes(3);
  });

  it('handles toast removal during status changes', async () => {
    const mockToasts = [
      {
        id: '1',
        message: 'Ollama service is unavailable',
        type: 'unavailable' as ServiceStatus
      }
    ];

    vi.mocked(useServiceStatus).mockReturnValue({
      serviceStatuses: new Map<ServiceName, ServiceState>([
        ['ollama', { status: 'unavailable', lastCheck: Date.now(), error: 'Connection failed' }]
      ]),
      toasts: mockToasts,
      removeToast: mockRemoveToast,
      retryService: mockRetryService
    });

    render(<ServiceStatusManager />);

    // Remove toast
    const closeButton = screen.getByRole('button', { name: '×' });
    fireEvent.click(closeButton);

    expect(mockRemoveToast).toHaveBeenCalledWith('1');
  });
}); 