import { ipcMain } from 'electron';
import { OllamaClient } from '../services/OllamaClient';
import { IPC_CHANNELS } from './channels';
import { logger } from '../utils/logger';
import type { ModelLoadingState, OllamaRequestOptions } from '../types/ollama';

const ollama = OllamaClient.getInstance();

export function setupOllamaHandlers(): void {
  // List models
  ipcMain.handle(IPC_CHANNELS.OLLAMA.LIST_MODELS, async () => {
    try {
      if (ollama.isInFallbackMode()) {
        throw new Error('Ollama service is in fallback mode');
      }
      return await ollama.listModels();
    } catch (error) {
      logger.error('Failed to list models:', error);
      throw error;
    }
  });

  // Set model
  ipcMain.handle(IPC_CHANNELS.OLLAMA.SET_MODEL, async (_, modelName: string) => {
    try {
      if (ollama.isInFallbackMode()) {
        throw new Error('Ollama service is in fallback mode');
      }
      await ollama.setModel(modelName);
    } catch (error) {
      logger.error('Failed to set model:', error);
      throw error;
    }
  });

  // Check connection
  ipcMain.handle(IPC_CHANNELS.OLLAMA.CHECK_CONNECTION, async () => {
    try {
      const isConnected = await ollama.checkConnection();
      return { 
        status: isConnected ? 'connected' : 'disconnected',
        isFallbackMode: ollama.isInFallbackMode(),
        lastSuccessfulConnection: ollama.getLastSuccessfulConnection(),
        connectionAttempts: ollama.getConnectionAttempts()
      };
    } catch (error) {
      logger.error('Failed to check connection:', error);
      return { 
        status: 'disconnected',
        isFallbackMode: ollama.isInFallbackMode(),
        lastSuccessfulConnection: ollama.getLastSuccessfulConnection(),
        connectionAttempts: ollama.getConnectionAttempts()
      };
    }
  });

  // Cancel load
  ipcMain.handle(IPC_CHANNELS.OLLAMA.CANCEL_LOAD, async () => {
    try {
      if (ollama.isInFallbackMode()) {
        throw new Error('Ollama service is in fallback mode');
      }
      await ollama.cancelLoad();
    } catch (error) {
      logger.error('Failed to cancel load:', error);
      throw error;
    }
  });

  // Save model configuration
  ipcMain.handle(IPC_CHANNELS.OLLAMA.SAVE_CONFIG, async (_, { modelName, config }: { modelName: string; config: OllamaRequestOptions }) => {
    try {
      if (ollama.isInFallbackMode()) {
        throw new Error('Ollama service is in fallback mode');
      }
      await ollama.setModel(modelName);
      await ollama.updateModelConfig(modelName, config);
    } catch (error) {
      logger.error('Failed to save model configuration:', error);
      throw error;
    }
  });

  // Get connection status
  ipcMain.handle(IPC_CHANNELS.OLLAMA.GET_CONNECTION_STATUS, () => {
    return {
      isConnected: ollama.isServiceConnected(),
      isFallbackMode: ollama.isInFallbackMode(),
      lastSuccessfulConnection: ollama.getLastSuccessfulConnection(),
      connectionAttempts: ollama.getConnectionAttempts()
    };
  });

  // Model loading state changed
  ollama.onModelLoadingStateChanged((state: ModelLoadingState) => {
    ipcMain.emit(IPC_CHANNELS.OLLAMA.MODEL_LOADING_STATE_CHANGED, state);
  });
} 