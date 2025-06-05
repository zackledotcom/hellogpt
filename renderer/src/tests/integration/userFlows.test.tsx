import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../../App';
import { mockIpcResponse } from '../utils/ipcMocks';
import { vi } from 'vitest';

describe('User Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('completes full chat flow with model loading', async () => {
    render(<App />);

    // Simulate model loading
    mockIpcResponse.event('ollama', 'onModelLoadingStateChanged', {
      status: 'loading',
      isLoading: true,
      progress: 0
    });

    // Wait for model to load
    await waitFor(() => {
      expect(screen.getByText('Status: loading')).toBeInTheDocument();
    });

    // Simulate model loaded
    mockIpcResponse.event('ollama', 'onModelLoaded', {
      status: 'operational',
      modelName: 'llama2'
    });

    // Send a message
    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Hello, how are you?' } });
    fireEvent.click(screen.getByText('Send'));

    // Verify message appears in chat
    await waitFor(() => {
      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    });

    // Simulate response
    mockIpcResponse.event('ollama', 'onMessageReceived', {
      content: 'I am doing well, thank you for asking!',
      role: 'assistant'
    });

    // Verify response appears
    await waitFor(() => {
      expect(screen.getByText('I am doing well, thank you for asking!')).toBeInTheDocument();
    });
  });

  it('handles service degradation during chat', async () => {
    render(<App />);

    // Start chat
    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Tell me a story' } });
    fireEvent.click(screen.getByText('Send'));

    // Simulate service degradation
    mockIpcResponse.event('ollama', 'onModelLoadingStateChanged', {
      status: 'degraded',
      error: 'High latency detected'
    });

    // Verify degradation is shown
    await waitFor(() => {
      expect(screen.getByText('High latency detected')).toBeInTheDocument();
    });

    // Verify chat still works
    fireEvent.change(input, { target: { value: 'Continue the story' } });
    fireEvent.click(screen.getByText('Send'));

    // Simulate response despite degradation
    mockIpcResponse.event('ollama', 'onMessageReceived', {
      content: 'The story continues...',
      role: 'assistant'
    });

    await waitFor(() => {
      expect(screen.getByText('The story continues...')).toBeInTheDocument();
    });
  });

  it('recovers from service failure during chat', async () => {
    render(<App />);

    // Start chat
    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByText('Send'));

    // Simulate service failure
    mockIpcResponse.event('ollama', 'onModelLoadingStateChanged', {
      status: 'unavailable',
      error: 'Connection lost'
    });

    // Verify error is shown
    await waitFor(() => {
      expect(screen.getByText('Connection lost')).toBeInTheDocument();
    });

    // Click retry
    fireEvent.click(screen.getByText('Retry'));

    // Simulate recovery
    mockIpcResponse.event('ollama', 'onModelLoadingStateChanged', {
      status: 'operational'
    });

    // Verify recovery
    await waitFor(() => {
      expect(screen.getByText('Status: operational')).toBeInTheDocument();
    });

    // Verify chat works again
    fireEvent.change(input, { target: { value: 'Are you back?' } });
    fireEvent.click(screen.getByText('Send'));

    mockIpcResponse.event('ollama', 'onMessageReceived', {
      content: 'Yes, I am back online!',
      role: 'assistant'
    });

    await waitFor(() => {
      expect(screen.getByText('Yes, I am back online!')).toBeInTheDocument();
    });
  });
}); 