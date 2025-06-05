import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../../App';
import { mockIpcResponse } from '../utils/ipcMocks';
import { vi } from 'vitest';

describe('Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.error to prevent test output pollution
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles unexpected IPC errors gracefully', async () => {
    render(<App />);

    // Simulate unexpected IPC error
    mockIpcResponse.error('ollama', 'checkConnection', 'Unexpected IPC error');

    // Verify error is displayed to user
    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    // Verify retry option is available
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('propagates errors through component hierarchy', async () => {
    render(<App />);

    // Simulate error in child component
    mockIpcResponse.error('ollama', 'onModelLoadingStateChanged', 'Model loading failed');
    mockIpcResponse.error('embedding', 'onEmbeddingStateChanged', 'Embedding failed');
    mockIpcResponse.error('vectorStore', 'onVectorStoreStateChanged', 'Vector store failed');

    // Verify all errors are caught and displayed
    await waitFor(() => {
      expect(screen.getByText('Model loading failed')).toBeInTheDocument();
      expect(screen.getByText('Embedding failed')).toBeInTheDocument();
      expect(screen.getByText('Vector store failed')).toBeInTheDocument();
    });
  });

  it('provides appropriate user feedback for different error types', async () => {
    render(<App />);

    // Test connection error
    mockIpcResponse.error('ollama', 'checkConnection', 'Connection refused');
    await waitFor(() => {
      expect(screen.getByText(/connection/i)).toBeInTheDocument();
      expect(screen.getByText('Setup Guide')).toBeInTheDocument();
    });

    // Test model error
    mockIpcResponse.error('ollama', 'loadModel', 'Model not found');
    await waitFor(() => {
      expect(screen.getByText(/model/i)).toBeInTheDocument();
      expect(screen.getByText('Troubleshoot')).toBeInTheDocument();
    });

    // Test resource error
    mockIpcResponse.error('ollama', 'checkConnection', 'Insufficient memory');
    await waitFor(() => {
      expect(screen.getByText(/memory/i)).toBeInTheDocument();
      expect(screen.getByText('System Requirements')).toBeInTheDocument();
    });
  });

  it('maintains application state after error recovery', async () => {
    render(<App />);

    // Start chat
    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByText('Send'));

    // Simulate error
    mockIpcResponse.error('ollama', 'onMessageReceived', 'Message processing failed');

    // Verify error
    await waitFor(() => {
      expect(screen.getByText('Message processing failed')).toBeInTheDocument();
    });

    // Simulate recovery
    mockIpcResponse.success('ollama', 'checkConnection', { connected: true });

    // Verify chat history is preserved
    expect(screen.getByText('Hello')).toBeInTheDocument();

    // Verify can continue chatting
    fireEvent.change(input, { target: { value: 'Are you working now?' } });
    fireEvent.click(screen.getByText('Send'));

    mockIpcResponse.event('ollama', 'onMessageReceived', {
      content: 'Yes, everything is working!',
      role: 'assistant'
    });

    await waitFor(() => {
      expect(screen.getByText('Yes, everything is working!')).toBeInTheDocument();
    });
  });
}); 