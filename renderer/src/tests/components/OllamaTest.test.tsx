import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import OllamaTest from '../../components/OllamaTest';
import { mockElectron, resetMocks } from '../utils/electronMock';
import type { OllamaModel, ModelLoadingState } from '@electron-app/types/ollama';

describe('OllamaTest', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('renders test interface', () => {
    render(<OllamaTest />);
    expect(screen.getByText('Ollama API Test')).toBeInTheDocument();
    expect(screen.getByText('Connection Status:')).toBeInTheDocument();
    expect(screen.getByText('Available Models:')).toBeInTheDocument();
  });

  it('handles successful connection check', async () => {
    const mockModels: OllamaModel[] = [
      { 
        name: 'llama2',
        digest: 'sha256:123',
        size: 7,
        details: {
          format: 'gguf',
          family: 'llama',
          parameter_size: '7B',
          quantization_level: 'q4_0'
        }
      },
      { 
        name: 'mistral',
        digest: 'sha256:456',
        size: 7,
        details: {
          format: 'gguf',
          family: 'mistral',
          parameter_size: '7B',
          quantization_level: 'q4_0'
        }
      }
    ];
    vi.mocked(mockElectron.ollama.listModels).mockResolvedValueOnce(mockModels);

    render(<OllamaTest />);

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('llama2, mistral')).toBeInTheDocument();
    });
  });

  it('handles connection error', async () => {
    const errorMessage = 'Failed to connect to Ollama';
    vi.mocked(mockElectron.ollama.listModels).mockRejectedValueOnce(new Error(errorMessage));

    render(<OllamaTest />);

    await waitFor(() => {
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles model loading state changes', async () => {
    render(<OllamaTest />);

    // Simulate loading state change
    const loadingCallback = vi.mocked(mockElectron.ollama.onModelLoadingStateChanged).mock.calls[0][0];
    const loadingState: ModelLoadingState = {
      isLoading: true,
      status: 'loading',
      modelName: 'llama2',
      progress: 0,
      estimatedTimeRemaining: 60
    };
    loadingCallback(loadingState);

    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    // Simulate loading complete
    const completeState: ModelLoadingState = {
      isLoading: false,
      status: 'loaded',
      modelName: 'llama2',
      progress: 100,
      estimatedTimeRemaining: 0
    };
    loadingCallback(completeState);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });
}); 