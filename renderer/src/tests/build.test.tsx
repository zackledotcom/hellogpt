import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../App';
import { useServiceStatus } from '../hooks/useServiceStatus';
import { vi } from 'vitest';
import { ServiceName, ServiceState } from '../types/services';

vi.mock('../hooks/useServiceStatus');

describe('Build Process', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the application with all components', () => {
    const mockServiceStatuses = new Map<ServiceName, ServiceState>([
      ['ollama', { status: 'unavailable', lastCheck: Date.now(), error: 'Connection failed' }],
      ['embedding', { status: 'unavailable', lastCheck: Date.now(), error: 'Service error' }],
      ['vectorStore', { status: 'unavailable', lastCheck: Date.now(), error: 'Timeout' }]
    ]);

    vi.mocked(useServiceStatus).mockReturnValue({
      serviceStatuses: mockServiceStatuses,
      toasts: [],
      removeToast: vi.fn(),
      retryService: vi.fn()
    });

    render(<App />);

    // Verify all main components are rendered
    expect(screen.getByText('Service Status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Setup Guide' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Troubleshoot' })).toBeInTheDocument();
  });

  it('handles missing Ollama service gracefully', () => {
    const mockServiceStatuses = new Map<ServiceName, ServiceState>([
      ['ollama', { status: 'unavailable', lastCheck: Date.now(), error: 'Connection failed' }]
    ]);

    vi.mocked(useServiceStatus).mockReturnValue({
      serviceStatuses: mockServiceStatuses,
      toasts: [],
      removeToast: vi.fn(),
      retryService: vi.fn()
    });

    render(<App />);

    // Verify the application still renders
    expect(screen.getByText('Service Status')).toBeInTheDocument();
    
    // Verify the retry button is available
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
  });

  it('displays appropriate error messages for each service', () => {
    const mockServiceStatuses = new Map<ServiceName, ServiceState>([
      ['ollama', { status: 'unavailable', lastCheck: Date.now(), error: 'Connection failed' }],
      ['embedding', { status: 'degraded', lastCheck: Date.now(), error: 'High latency' }],
      ['vectorStore', { status: 'unavailable', lastCheck: Date.now(), error: 'Timeout' }]
    ]);

    vi.mocked(useServiceStatus).mockReturnValue({
      serviceStatuses: mockServiceStatuses,
      toasts: [],
      removeToast: vi.fn(),
      retryService: vi.fn()
    });

    render(<App />);

    // Expand the service status panel
    fireEvent.click(screen.getByText('Service Status'));

    // Verify error messages are displayed
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    expect(screen.getByText('High latency')).toBeInTheDocument();
    expect(screen.getByText('Timeout')).toBeInTheDocument();
  });
}); 